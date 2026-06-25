import React, { useCallback } from 'react';
import { useSeatSelected } from './useSeatSelection';

/**
 * SeatButton — fully isolated, zero context subscriptions.
 *
 * Re-renders ONLY when:
 *   1. Its own key enters/leaves the selection store  (useSeatSelected)
 *   2. isBooked / isLockedByOther props change        (from memo comparator)
 *
 * No useImperativeHandle, no DOM class hacks, no ref forwarding needed.
 * The "pending" state is just another boolean prop — but it comes from a
 * per-seat ref in SeatMap (pendingKeysRef), not React state, so it doesn't
 * cause re-renders either. Pending is shown via a data-attribute + CSS only.
 */
const SeatButton = React.memo(({
  row,
  number,
  seatKey,          // `${row}-${number}` pre-computed
  store,            // the seatStore from SeatMap
  isBooked,
  isLockedByOther,
  showMiddleGap,
  onClick,
}) => {
  // Only THIS button re-renders when its key enters/leaves the store
  const isSelected = useSeatSelected(store, seatKey);

  let status = 'available';
  if (isBooked)          status = 'booked';
  else if (isLockedByOther) status = 'locked';
  else if (isSelected)   status = 'selected';

  const statusClass =
    status === 'booked'   ? 'seat-booked' :
    status === 'locked'   ? 'seat-locked' :
    status === 'selected' ? 'seat-selected hover:scale-105 active:scale-95' :
                            'seat-available hover:scale-105 active:scale-95';

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }, [onClick]);

  return (
    <>
      {showMiddleGap && <div className="w-1 sm:w-2" />}
      <button
        onClick={onClick}
        onKeyDown={handleKeyDown}
        disabled={isBooked || isLockedByOther}
        // data-pending is toggled by SeatMap via DOM (zero re-render)
        // CSS: [data-pending="true"] { @apply seat-pending; }
        data-pending="false"
        data-seat={seatKey}
        className={`seat ${statusClass} focus:outline-2 focus:outline-offset-1 focus:outline-primary disabled:cursor-not-allowed`}
        title={`${row}${number} - ${status}`}
        aria-label={`Seat ${row}${number} - ${status}`}
        aria-pressed={isSelected}
      >
        {number}
      </button>
    </>
  );
}, (prev, next) =>
  prev.isBooked        === next.isBooked &&
  prev.isLockedByOther === next.isLockedByOther &&
  prev.showMiddleGap   === next.showMiddleGap &&
  prev.onClick         === next.onClick &&
  prev.store           === next.store
  // isSelected is NOT in props — it comes from useSyncExternalStore inside
);

SeatButton.displayName = 'SeatButton';
export default SeatButton;