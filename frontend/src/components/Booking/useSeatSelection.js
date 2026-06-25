/**
 * useSeatSelection — a micro store for selected seats.
 *
 * Uses the "external store" pattern:
 *   - selectedSeats lives in a plain Set (ref), NOT in React state
 *   - Each SeatButton subscribes with useSyncExternalStore and passes
 *     a selector that only triggers a re-render when *its own* key changes
 *   - SeatMap / BookingContext never re-render from seat clicks
 */
import { useRef, useCallback } from 'react';
import { useSyncExternalStore } from 'react';

// ─── Create the store (call once at the top of SeatMap, pass it down) ────────
export function createSeatStore() {
  const selected = new Set();           // "row-number" keys
  const listeners = new Set();          // subscriber callbacks

  const notify = () => listeners.forEach(fn => fn());

  return {
    // ── Write API (used by SeatMap click handler) ──────────────────────────
    add(key) {
      if (selected.has(key)) return false;
      selected.add(key);
      notify();
      return true;
    },
    remove(key) {
      if (!selected.has(key)) return false;
      selected.delete(key);
      notify();
      return true;
    },
    has(key) {
      return selected.has(key);
    },
    getAll() {
      return new Set(selected);         // snapshot copy
    },
    size() {
      return selected.size;
    },
    clear() {
      selected.clear();
      notify();
    },

    // ── useSyncExternalStore plumbing ──────────────────────────────────────
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    // Each seat gets its own snapshot selector → only re-renders if its key changed
    getSnapshot(key) {
      return selected.has(key);
    },
  };
}

// ─── Hook used inside SeatButton ─────────────────────────────────────────────
// Only re-renders THIS button when its own key enters/leaves the selected set
export function useSeatSelected(store, key) {
  return useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot(key),   // client snapshot
    () => false,                    // server snapshot
  );
}