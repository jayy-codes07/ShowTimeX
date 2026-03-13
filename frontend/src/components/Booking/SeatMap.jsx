import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Monitor } from 'lucide-react';
import { SEAT_CONFIG, API_ENDPOINTS } from '../../utils/constants';
import { useBooking } from '../../context/BookingContext';
import { apiRequest } from '../../services/api';
import toast from 'react-hot-toast';

// 🟢 FIX 1: Accept totalSeats as a prop (default to 120 if missing)
const SeatMap = ({
  bookedSeats = [],
  totalSeats = 120,
  lockedSeats = [],
  myLockedSeats = [],
}) => {
  const {
    bookingData,
    addSeat,
    removeSeat,
    isSeatSelected,
    updateShowLocks,
  } = useBooking();

  const flatBookedSeats = useMemo(() => {
    if (!Array.isArray(bookedSeats)) return [];
    return bookedSeats.reduce((acc, curr) => {
      if (curr.seats && Array.isArray(curr.seats)) {
        return [...acc, ...curr.seats];
      }
      if (curr.row) {
        return [...acc, curr];
      }
      return acc;
    }, []);
  }, [bookedSeats]);

  const flatLockedSeats = useMemo(() => {
    if (!Array.isArray(lockedSeats)) return [];
    return lockedSeats.reduce((acc, curr) => {
      if (curr.seats && Array.isArray(curr.seats)) {
        return [...acc, ...curr.seats];
      }
      if (curr.row) {
        return [...acc, curr];
      }
      return acc;
    }, []);
  }, [lockedSeats]);

  const flatMyLockedSeats = useMemo(() => {
    if (!Array.isArray(myLockedSeats)) return [];
    return myLockedSeats.reduce((acc, curr) => {
      if (curr.seats && Array.isArray(curr.seats)) {
        return [...acc, ...curr.seats];
      }
      if (curr.row) {
        return [...acc, curr];
      }
      return acc;
    }, []);
  }, [myLockedSeats]);

  const handleSeatClick = async (row, number) => {
    const showId = bookingData.show?._id;
    if (!showId) return;

    const isBooked = flatBookedSeats.some(
      (seat) => seat.row === row && seat.number === number
    );
    const isLockedByMe = flatMyLockedSeats.some(
      (seat) => seat.row === row && seat.number === number
    );
    const isLockedByOther =
      flatLockedSeats.some(
        (seat) => seat.row === row && seat.number === number
      ) && !isLockedByMe;

    if (isBooked || isLockedByOther) {
      return;
    }

    try {
      if (isSeatSelected(row, number)) {
        const response = await apiRequest.post(
          API_ENDPOINTS.UNLOCK_SEATS(showId),
          { seats: [{ row, number }] }
        );
        removeSeat({ row, number });
        updateShowLocks(
          response.lockedSeats || [],
          response.myLockedSeats || [],
          response.myLockExpiresAt || response.expiresAt || null
        );
        return;
      }

      if (
        bookingData.selectedSeats.length >= SEAT_CONFIG.MAX_SEATS_PER_BOOKING
      ) {
        toast.error(
          `You can select maximum ${SEAT_CONFIG.MAX_SEATS_PER_BOOKING} seats per booking`
        );
        return;
      }

      const response = await apiRequest.post(
        API_ENDPOINTS.LOCK_SEATS(showId),
        { seats: [{ row, number }], holdMinutes: 10 }
      );

      const added = addSeat({ row, number });
      if (!added) {
        await apiRequest.post(API_ENDPOINTS.UNLOCK_SEATS(showId), {
          seats: [{ row, number }],
        });
        return;
      }

      updateShowLocks(
        response.lockedSeats || [],
        response.myLockedSeats || [],
        response.myLockExpiresAt || response.expiresAt || null
      );
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to lock seat";
      toast.error(message);
    }
  };

  const getSeatStatus = (row, number) => {
    const isBooked = flatBookedSeats.some(
      (seat) => seat.row === row && seat.number === number
    );
    const isLockedByMe = flatMyLockedSeats.some(
      (seat) => seat.row === row && seat.number === number
    );
    const isLockedByOther =
      flatLockedSeats.some(
        (seat) => seat.row === row && seat.number === number
      ) && !isLockedByMe;
    const isSelected = isSeatSelected(row, number);

    if (isBooked) return 'booked';
    if (isLockedByOther) return 'locked';
    if (isSelected) return 'selected';
    return 'available';
  };

  const getSeatClass = (status) => {
    const baseClass = 'seat';
    switch (status) {
      case 'booked': return `${baseClass} seat-booked`;
      case 'locked': return `${baseClass} seat-locked`;
      case 'selected': return `${baseClass} seat-selected`;
      default: return `${baseClass} seat-available`;
    }
  };

  // 🟢 FIX 2: Dynamically calculate how many rows we need to draw
  const calculateGrid = () => {
    const seatsPerRow = SEAT_CONFIG.SEATS_PER_ROW || 12;
    // Calculate how many rows are needed to fit 'totalSeats'
    const rowsNeeded = Math.ceil(totalSeats / seatsPerRow);
    
    // Slice the alphabet array to only show the rows we need (e.g., A through E for 60 seats)
    const activeRows = SEAT_CONFIG.ROWS.slice(0, rowsNeeded);
    
    return { activeRows, seatsPerRow };
  };

  const { activeRows, seatsPerRow } = calculateGrid();

  return (
    <div className="bg-dark-card rounded-xl p-4 sm:p-6">
      {/* Screen */}
      <div className="mb-8">
        <div className="flex justify-center mb-2">
          <Monitor className="w-8 h-8 text-gray-500" />
        </div>
        <div className="h-2 bg-gradient-to-r from-transparent via-gray-600 to-transparent rounded-full mb-2"></div>
        <p className="text-center text-gray-500 text-sm">Screen this way</p>
      </div>

      {/* Seat Grid */}
      <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
        <div className="inline-block min-w-full">
          <div className="space-y-3">
            {/* 🟢 FIX 3: Map over activeRows instead of SEAT_CONFIG.ROWS */}
            {activeRows.map((row, rowIndex) => {
              
              // If we are on the very last row, check if it's a "partial" row
              // (e.g., 100 seats / 12 = 8 full rows + 1 row of 4 seats)
              const isLastRow = rowIndex === activeRows.length - 1;
              const seatsInThisRow = isLastRow && (totalSeats % seatsPerRow !== 0) 
                  ? totalSeats % seatsPerRow 
                  : seatsPerRow;

              return (
                <div key={row} className="flex items-center justify-center space-x-1.5 sm:space-x-2">
                  <div className="w-6 sm:w-8 text-center text-gray-400 font-semibold text-xs sm:text-sm">
                    {row}
                  </div>

                  <div className="flex space-x-1.5 sm:space-x-2">
                    {Array.from({ length: seatsInThisRow }, (_, i) => {
                      const seatNumber = i + 1;
                      const status = getSeatStatus(row, seatNumber);
                      const isMiddle = i === Math.floor(seatsPerRow / 2);

                      return (
                        <React.Fragment key={seatNumber}>
                          {isMiddle && <div className="w-2 sm:w-4"></div>}
                          <motion.button
                            whileHover={{ scale: status !== 'booked' ? 1.1 : 1 }}
                            whileTap={{ scale: status !== 'booked' ? 0.9 : 1 }}
                            onClick={() => handleSeatClick(row, seatNumber)}
                            disabled={status === 'booked'}
                            className={getSeatClass(status)}
                            title={
                              status === 'locked'
                                ? `${row}${seatNumber} - Locked by another user`
                                : `${row}${seatNumber} - ${status}`
                            }
                          >
                            {seatNumber}
                          </motion.button>
                        </React.Fragment>
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
          <div className="flex items-center space-x-2">
            <div className="seat seat-available pointer-events-none"></div>
            <span className="text-sm text-gray-400">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="seat seat-selected pointer-events-none"></div>
            <span className="text-sm text-gray-400">Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="seat seat-locked pointer-events-none"></div>
            <span className="text-sm text-gray-400">Locked</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="seat seat-booked pointer-events-none"></div>
            <span className="text-sm text-gray-400">Booked</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
