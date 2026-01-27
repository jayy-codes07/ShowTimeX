import React from 'react';
import { motion } from 'framer-motion';
import { Monitor } from 'lucide-react';
import { SEAT_CONFIG } from '../../utils/constants';
import { useBooking } from '../../context/BookingContext';

const SeatMap = ({ bookedSeats = [] }) => {
  const { toggleSeat, isSeatSelected } = useBooking();

  const handleSeatClick = (row, number) => {
    const isBooked = bookedSeats.some(
      (seat) => seat.row === row && seat.number === number
    );

    if (!isBooked) {
      toggleSeat({ row, number });
    }
  };

  const getSeatStatus = (row, number) => {
    const isBooked = bookedSeats.some(
      (seat) => seat.row === row && seat.number === number
    );
    const isSelected = isSeatSelected(row, number);

    if (isBooked) return 'booked';
    if (isSelected) return 'selected';
    return 'available';
  };

  const getSeatClass = (status) => {
    const baseClass = 'seat';
    
    switch (status) {
      case 'booked':
        return `${baseClass} seat-booked`;
      case 'selected':
        return `${baseClass} seat-selected`;
      default:
        return `${baseClass} seat-available`;
    }
  };

  return (
    <div className="bg-dark-card rounded-xl p-6">
      {/* Screen */}
      <div className="mb-8">
        <div className="flex justify-center mb-2">
          <Monitor className="w-8 h-8 text-gray-500" />
        </div>
        <div className="h-2 bg-gradient-to-r from-transparent via-gray-600 to-transparent rounded-full mb-2"></div>
        <p className="text-center text-gray-500 text-sm">Screen this way</p>
      </div>

      {/* Seat Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="space-y-3">
            {SEAT_CONFIG.ROWS.map((row) => (
              <div key={row} className="flex items-center justify-center space-x-2">
                {/* Row Label */}
                <div className="w-8 text-center text-gray-400 font-semibold">
                  {row}
                </div>

                {/* Seats */}
                <div className="flex space-x-2">
                  {Array.from({ length: SEAT_CONFIG.SEATS_PER_ROW }, (_, i) => {
                    const seatNumber = i + 1;
                    const status = getSeatStatus(row, seatNumber);
                    const isMiddle = i === Math.floor(SEAT_CONFIG.SEATS_PER_ROW / 2);

                    return (
                      <React.Fragment key={seatNumber}>
                        {isMiddle && <div className="w-4"></div>}
                        <motion.button
                          whileHover={{ scale: status !== 'booked' ? 1.1 : 1 }}
                          whileTap={{ scale: status !== 'booked' ? 0.9 : 1 }}
                          onClick={() => handleSeatClick(row, seatNumber)}
                          disabled={status === 'booked'}
                          className={getSeatClass(status)}
                          title={`${row}${seatNumber} - ${status}`}
                        >
                          {seatNumber}
                        </motion.button>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
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
            <div className="seat seat-booked pointer-events-none"></div>
            <span className="text-sm text-gray-400">Booked</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;