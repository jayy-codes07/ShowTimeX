import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import { Monitor } from 'lucide-react';
import { SEAT_CONFIG, API_ENDPOINTS } from '../../utils/constants';
import { useBooking } from '../../context/BookingContext';
import { apiRequest } from '../../services/api';
import toast from 'react-hot-toast';
import SeatButton from './Seatbutton';
import { createSeatStore } from './useSeatSelection';

const DEBOUNCE_MS = 400;

const SeatMap = ({
  bookedSeats = [],
  totalSeats = 120,
  lockedSeats = [],
  myLockedSeats = [],
}) => {
  const { bookingData, updateShowLocks, updateSelectedSeats } = useBooking();
  // The store is the source of truth for seat-map rendering. Every mutation is
  // mirrored into BookingContext.selectedSeats so the payment flow can read it.

  // ─── Seat selection store (created once, never changes reference) ──────────
  const store = useMemo(() => createSeatStore(), []);

  // ─── Batch / rollback refs ────────────────────────────────────────────────
  const pendingOpsRef = useRef(new Map()); // key → 'lock' | 'unlock'
  const rollbackRef   = useRef(new Map()); // key → wasSelected bool
  const debounceTimer = useRef(null);
  // pending keys: toggle data-pending attr directly on DOM node, zero re-render
  const pendingKeysRef = useRef(new Set());

  // flushBatch is redefined each render; the unmount cleanup reads the latest
  // one through this ref so it can stay a mount-once effect.
  const flushBatchRef = useRef(null);

  useEffect(() => () => {
    clearTimeout(debounceTimer.current);
    // Leaving the seat-selection step within DEBOUNCE_MS of a click used to
    // discard that click's lock/unlock entirely. Send it instead.
    if (pendingOpsRef.current.size > 0) flushBatchRef.current?.();
  }, []);

  // ─── Flatten + lookup sets ────────────────────────────────────────────────
  const flatten = useCallback((arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.reduce((acc, curr) => {
      if (curr.seats && Array.isArray(curr.seats)) return [...acc, ...curr.seats];
      if (curr.row) return [...acc, curr];
      return acc;
    }, []);
  }, []);

  const flatBookedSeats   = useMemo(() => flatten(bookedSeats),   [bookedSeats,   flatten]);
  const flatLockedSeats   = useMemo(() => flatten(lockedSeats),   [lockedSeats,   flatten]);
  const flatMyLockedSeats = useMemo(() => flatten(myLockedSeats), [myLockedSeats, flatten]);

  const bookedSet = useMemo(() =>
    new Set(flatBookedSeats.map(s => `${s.row}-${s.number}`)),
  [flatBookedSeats]);

  const lockedByOtherSet = useMemo(() => {
    const mine = new Set(flatMyLockedSeats.map(s => `${s.row}-${s.number}`));
    return new Set(
      flatLockedSeats.map(s => `${s.row}-${s.number}`).filter(k => !mine.has(k))
    );
  }, [flatLockedSeats, flatMyLockedSeats]);

  // ─── DOM pending helpers (no setState, no re-render) ─────────────────────
  const setPendingDOM = useCallback((key, pending) => {
    const el = document.querySelector(`[data-seat="${key}"]`);
    if (el) el.setAttribute('data-pending', String(pending));
  }, []);

  // ─── Seat limit ───────────────────────────────────────────────────────────
  // Every path that puts a seat *into* the store must go through this, not just
  // the plain select path.
  const isAtSeatLimit = () => {
    if (store.size() < SEAT_CONFIG.MAX_SEATS_PER_BOOKING) return false;
    toast.error(`You can select a maximum of ${SEAT_CONFIG.MAX_SEATS_PER_BOOKING} seats per booking`);
    return true;
  };

  // ─── Mirror store selection into BookingContext ───────────────────────────
  // Called synchronously on every toggle so the booking summary updates
  // immediately, without waiting for the debounced lock request.
  const syncSelectionToContext = useCallback(() => {
    const seats = [...store.getAll()].map((key) => {
      const [row, numStr] = key.split('-');
      return { row, number: Number(numStr) };
    });
    updateSelectedSeats(seats);
  }, [store, updateSelectedSeats]);

  // Re-seed the store from context on mount, so a selection survives leaving
  // and returning to step 1 (SeatMap unmounts while the checkout form shows).
  useEffect(() => {
    const existing = bookingData.selectedSeats || [];
    if (existing.length === 0 || store.size() > 0) return;

    existing.forEach((seat) => {
      const key = `${seat.row}-${seat.number}`;
      if (!bookedSet.has(key) && !lockedByOtherSet.has(key)) store.add(key);
    });
    // Seats that became unavailable meanwhile are dropped — resync so context
    // never claims a seat the map cannot show as selected.
    syncSelectionToContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drop any selected seat that has since become booked or locked by someone
  // else. Runs whenever availability changes — i.e. after the Payment page
  // refetches the show on entry or refocus.
  useEffect(() => {
    let changed = false;
    store.getAll().forEach((key) => {
      if (!bookedSet.has(key) && !lockedByOtherSet.has(key)) return;
      store.remove(key);
      pendingOpsRef.current.delete(key);
      rollbackRef.current.delete(key);
      changed = true;
    });
    if (!changed) return;
    syncSelectionToContext();
    toast.error('Some of your seats were just taken and have been removed.');
  }, [bookedSet, lockedByOtherSet, store, syncSelectionToContext]);

  // ─── Flush batch ──────────────────────────────────────────────────────────
  const flushBatch = useCallback(async () => {
    const ops = new Map(pendingOpsRef.current);
    pendingOpsRef.current.clear();
    if (ops.size === 0) return;

    const showId = bookingData.show?._id;
    if (!showId) return;

    ops.forEach((_, key) => setPendingDOM(key, true));

    const toLock   = [];
    const toUnlock = [];
    ops.forEach((action, key) => {
      const [row, numStr] = key.split('-');
      const seat = { row, number: Number(numStr) };
      if (action === 'lock') toLock.push(seat);
      else                   toUnlock.push(seat);
    });

    try {
      const requests = [];
      if (toLock.length)
        requests.push(apiRequest.post(API_ENDPOINTS.LOCK_SEATS(showId),   { seats: toLock,   holdMinutes: 10 }));
      if (toUnlock.length)
        requests.push(apiRequest.post(API_ENDPOINTS.UNLOCK_SEATS(showId), { seats: toUnlock }));

      const responses = await Promise.all(requests);
      const lastRes = responses[responses.length - 1];

      updateShowLocks(
        lastRes?.lockedSeats     || [],
        lastRes?.myLockedSeats   || [],
        lastRes?.myLockExpiresAt || lastRes?.expiresAt || null
      );

      ops.forEach((_, key) => rollbackRef.current.delete(key));
    } catch (error) {
      // Granular rollback — only this batch
      ops.forEach((action, key) => {
        const wasSelected = rollbackRef.current.get(key);
        if (action === 'lock'   && wasSelected === false) store.remove(key);
        if (action === 'unlock' && wasSelected === true)  store.add(key);
        rollbackRef.current.delete(key);
      });
      // Roll BookingContext back in step with the store
      syncSelectionToContext();
      toast.error(error.response?.data?.message || 'Some seats could not be updated. Please try again.');
    } finally {
      ops.forEach((_, key) => setPendingDOM(key, false));
    }
  }, [bookingData.show?._id, store, updateShowLocks, setPendingDOM, syncSelectionToContext]);

  flushBatchRef.current = flushBatch;

  const scheduleBatch = useCallback(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(flushBatch, DEBOUNCE_MS);
  }, [flushBatch]);

  // ─── Click handler ────────────────────────────────────────────────────────
  // Uses a ref so the per-seat stable callbacks below never go stale
  const handleSeatClickRef = useRef(null);
  handleSeatClickRef.current = (row, number) => {
    if (!bookingData.show?._id) return;
    const key = `${row}-${number}`;
    if (bookedSet.has(key) || lockedByOtherSet.has(key)) return;

    const currentlySelected = store.has(key);
    const existingOp = pendingOpsRef.current.get(key);

    // Deduplication: click A → click A again before API fires = net zero
    if (existingOp) {
      // Cancelling a pending 'unlock' puts the seat back, so it has to pass the
      // cap too — another seat may have claimed the free slot in the meantime.
      if (existingOp === 'unlock' && isAtSeatLimit()) return;

      pendingOpsRef.current.delete(key);
      rollbackRef.current.delete(key);
      if (existingOp === 'lock') store.remove(key);
      else                       store.add(key);
      syncSelectionToContext();
      scheduleBatch();
      return;
    }

    if (!currentlySelected && isAtSeatLimit()) return;

    rollbackRef.current.set(key, currentlySelected);
    if (currentlySelected) {
      store.remove(key);
      pendingOpsRef.current.set(key, 'unlock');
    } else {
      store.add(key);
      pendingOpsRef.current.set(key, 'lock');
    }
    syncSelectionToContext();
    scheduleBatch();
  };

  // ─── Stable per-seat callbacks (created once, never re-created) ───────────
  // Each callback calls the ref, so it always has fresh closure values
  const clickCallbacks = useRef(new Map());
  const getClickCallback = useCallback((row, number) => {
    const key = `${row}-${number}`;
    if (!clickCallbacks.current.has(key)) {
      // This function identity never changes — safe for React.memo
      clickCallbacks.current.set(key, () => handleSeatClickRef.current(row, number));
    }
    return clickCallbacks.current.get(key);
  }, []); // no deps — intentional

  // ─── Grid ─────────────────────────────────────────────────────────────────
  const { activeRows, seatsPerRow } = useMemo(() => {
    const spr = SEAT_CONFIG.SEATS_PER_ROW || 12;
    return {
      activeRows: SEAT_CONFIG.ROWS.slice(0, Math.ceil(totalSeats / spr)),
      seatsPerRow: spr,
    };
  }, [totalSeats]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="bg-dark-card rounded-xl p-4 sm:p-6">
      {/* Screen */}
      <div className="mb-8">
        <div className="flex justify-center mb-2">
          <Monitor className="w-8 h-8 text-gray-500" />
        </div>
        <div className="h-2 bg-gradient-to-r from-transparent via-gray-600 to-transparent rounded-full mb-2" />
        <p className="text-center text-gray-500 text-sm">Screen this way</p>
      </div>

      {/* Seat Grid */}
      <div className="w-full overflow-x-auto -mx-2 sm:mx-0">
        <div className="px-2 sm:px-0 py-4">
          <div className="space-y-2">
            {activeRows.map((row, rowIndex) => {
              const isLastRow = rowIndex === activeRows.length - 1;
              const seatsInThisRow =
                isLastRow && totalSeats % seatsPerRow !== 0
                  ? totalSeats % seatsPerRow
                  : seatsPerRow;

              return (
                <div key={row} className="flex items-center justify-center gap-1 sm:gap-1.5">
                  <div className="w-5 sm:w-6 text-center text-gray-400 font-semibold text-xs sm:text-sm flex-shrink-0">
                    {row}
                  </div>
                  <div className="flex gap-0.5 sm:gap-1 justify-center">
                    {Array.from({ length: seatsInThisRow }, (_, i) => {
                      const seatNumber = i + 1;
                      const key = `${row}-${seatNumber}`;
                      return (
                        <SeatButton
                          key={key}
                          row={row}
                          number={seatNumber}
                          seatKey={key}
                          store={store}
                          isBooked={bookedSet.has(key)}
                          isLockedByOther={lockedByOtherSet.has(key)}
                          showMiddleGap={i === Math.floor(seatsPerRow / 2)}
                          onClick={getClickCallback(row, seatNumber)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-gray-700">
        <div className="flex flex-wrap justify-center gap-6">
          {[
            { cls: 'seat-available', label: 'Available' },
            { cls: 'seat-selected',  label: 'Selected'  },
            { cls: 'seat-pending',   label: 'Saving…'   },
            { cls: 'seat-locked',    label: 'Locked'    },
            { cls: 'seat-booked',    label: 'Booked'    },
          ].map(({ cls, label }) => (
            <div key={label} className="flex items-center space-x-2">
              <div className={`seat ${cls} pointer-events-none`} />
              <span className="text-sm text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeatMap;