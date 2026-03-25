import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import { formatTime } from '../../utils/formatDate';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ShowtimeList = ({ shows, movie }) => {
  const navigate = useNavigate();
  const { setMovieAndShow } = useBooking();
  const { isAuthenticated } = useAuth();

  const handleShowSelect = (show) => {
    if (!isAuthenticated) {
      toast.error('Please login to book tickets');
      navigate('/login');
      return;
    }

    setMovieAndShow(movie, show);
    navigate('/payment');
  };

  // Group shows by theater
  const groupedShows = shows.reduce((acc, show) => {
    const theaterName = show.theater || 'Unknown Theater';
    if (!acc[theaterName]) {
      acc[theaterName] = [];
    }
    acc[theaterName].push(show);
    return acc;
  }, {});

  if (!shows || shows.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No shows available for this date</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedShows).map(([theaterName, theaterShows]) => (
        <div
          key={theaterName}
          className="bg-dark-card rounded-xl p-6"
        >
          {/* Theater Info */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white mb-2">{theaterName}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{theaterShows[0]?.location || 'Location not specified'}</span>
              </div>
            </div>
          </div>

          {/* Showtimes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {theaterShows.map((show) => {
              const totalBookedCount = show.bookedSeats?.reduce((total, item) => {
                // If it's a transaction (has a .seats array), count the seats
                if (item.seats && Array.isArray(item.seats)) {
                  return total + item.seats.length;
                }
                // If it's already a flat seat object (has a .row)
                if (item.row) {
                  return total + 1;
                }
                return total;
              }, 0) || 0;
              const totalLockedCount = show.lockedSeats?.reduce((total, item) => {
                if (item.seats && Array.isArray(item.seats)) {
                  return total + item.seats.length;
                }
                if (item.row) {
                  return total + 1;
                }
                return total;
              }, 0) || 0;
              const myLockedCount = show.myLockedSeats?.reduce((total, item) => {
                if (item.seats && Array.isArray(item.seats)) {
                  return total + item.seats.length;
                }
                if (item.row) {
                  return total + 1;
                }
                return total;
              }, 0) || 0;
              const effectiveLocked = Math.max(totalLockedCount - myLockedCount, 0);
              const availableSeats = Math.max(
                show.totalSeats - totalBookedCount - effectiveLocked,
                0
              );
              const isAlmostFull = availableSeats > 0 && availableSeats < 45;
              const isFull = availableSeats <= 0;

              return (
                <button
                  key={show._id}
                  onClick={() => !isFull && handleShowSelect(show)}
                  disabled={isFull}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                    isFull
                      ? 'border-gray-700 bg-gray-800/50 cursor-not-allowed opacity-50'
                      : isAlmostFull
                      ? 'border-orange-500 bg-orange-500/10 hover:bg-orange-500/20 hover:scale-[1.02] active:scale-[0.98]'
                      : 'border-gray-700 bg-dark-lighter hover:border-gray-700 hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-white font-bold">
                        {formatTime(show.time)}
                      </span>
                    </div>
                    
                    <div className="text-xs space-y-1">
                      <div className="text-gray-400">
                        {show.format || '2D'}
                      </div>
                      <div className={`font-semibold ${
                        isFull
                          ? 'text-gray-500'
                          : isAlmostFull
                          ? 'text-orange-400'
                          : 'text-green-400'
                      }`}>
                        {isFull ? 'Full' : `${availableSeats} seats`}
                      </div>
                      <div className="money-value font-bold">
                        ₹{show.price}
                      </div>
                    </div>
                  </div>

                  {isAlmostFull && !isFull && (
                    <div className="absolute top-1 right-1">
                      <span className="inline-block w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShowtimeList;
