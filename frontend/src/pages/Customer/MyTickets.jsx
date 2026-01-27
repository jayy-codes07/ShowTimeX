import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Calendar, Clock, MapPin, Download, XCircle, CheckCircle } from 'lucide-react';
import Loader from '../../components/UI/Loader';
import Button from '../../components/UI/Button';
import { apiRequest } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { formatDate, formatTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const MyTickets = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await apiRequest.get(API_ENDPOINTS.USER_BOOKINGS);
      
      if (response.success) {
        setBookings(response.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await apiRequest.delete(API_ENDPOINTS.CANCEL_BOOKING(bookingId));
      
      if (response.success) {
        toast.success('Booking cancelled successfully');
        fetchBookings();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleDownloadTicket = (booking) => {
    // Implement ticket download
    toast.success('Ticket download started');
    window.print();
  };

  const getFilteredBookings = () => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return bookings.filter(b => new Date(b.show?.date) >= now && b.status !== 'cancelled');
      case 'past':
        return bookings.filter(b => new Date(b.show?.date) < now);
      case 'cancelled':
        return bookings.filter(b => b.status === 'cancelled');
      default:
        return bookings;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { color: 'bg-green-500', icon: CheckCircle, text: 'Confirmed' },
      cancelled: { color: 'bg-red-500', icon: XCircle, text: 'Cancelled' },
      pending: { color: 'bg-yellow-500', icon: Clock, text: 'Pending' },
    };

    const config = statusConfig[status] || statusConfig.confirmed;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-white text-sm ${config.color}`}>
        <Icon className="w-4 h-4" />
        <span>{config.text}</span>
      </span>
    );
  };

  if (loading) {
    return <Loader fullScreen message="Loading your bookings..." />;
  }

  const filteredBookings = getFilteredBookings();

  return (
    <div className="min-h-screen bg-dark py-8">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Tickets</h1>
              <p className="text-gray-400">View and manage your movie bookings</p>
            </div>
            <Ticket className="w-12 h-12 text-primary" />
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All Bookings' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'past', label: 'Past' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-6 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-primary text-white'
                    : 'bg-dark-card text-gray-400 hover:bg-dark-lighter'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Bookings List */}
        {filteredBookings.length > 0 ? (
          <div className="space-y-6">
            {filteredBookings.map((booking, index) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-dark-card rounded-xl overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Movie Poster */}
                    <div className="flex-shrink-0">
                      <img
                        src={booking.movie?.poster}
                        alt={booking.movie?.title}
                        className="w-32 h-48 object-cover rounded-lg"
                      />
                    </div>

                    {/* Booking Details */}
                    <div className="flex-grow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-2">
                            {booking.movie?.title}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="text-gray-500 text-sm">
                          Booking ID: {booking.bookingId}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-3 text-gray-400">
                          <Calendar className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-xs text-gray-500">Date</p>
                            <p className="text-white">{formatDate(booking.show?.date)}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-gray-400">
                          <Clock className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-xs text-gray-500">Time</p>
                            <p className="text-white">{formatTime(booking.show?.time)}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-gray-400 md:col-span-2">
                          <MapPin className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-xs text-gray-500">Theater</p>
                            <p className="text-white">{booking.show?.theater}</p>
                            <p className="text-sm text-gray-400">{booking.show?.location}</p>
                          </div>
                        </div>
                      </div>

                      {/* Seats */}
                      <div className="mb-4">
                        <p className="text-gray-500 text-sm mb-2">Seats</p>
                        <div className="flex flex-wrap gap-2">
                          {booking.seats?.map((seat, idx) => (
                            <span
                              key={idx}
                              className="bg-primary px-3 py-1 rounded text-white font-semibold text-sm"
                            >
                              {seat.row}{seat.number}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                        <div>
                          <p className="text-gray-500 text-sm">Total Amount Paid</p>
                          <p className="text-2xl font-bold text-primary">
                            ₹{booking.totalAmount?.toFixed(2)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          {booking.status !== 'cancelled' && new Date(booking.show?.date) >= new Date() && (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleDownloadTicket(booking)}
                                icon={<Download className="w-4 h-4" />}
                              >
                                Download
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleCancelBooking(booking._id)}
                                icon={<XCircle className="w-4 h-4" />}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {booking.status !== 'cancelled' && new Date(booking.show?.date) < new Date() && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDownloadTicket(booking)}
                              icon={<Download className="w-4 h-4" />}
                            >
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                {booking.status === 'confirmed' && new Date(booking.show?.date) >= new Date() && (
                  <div className="bg-dark-lighter p-4 border-t border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 bg-white rounded flex items-center justify-center">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.bookingId}`} 
                            alt="Booking QR" 
                            className="w-13 h-13"
                            crossOrigin="anonymous" 
                        />
                        </div>
                        <div>
                          <p className="text-white font-semibold">Show this at the entrance</p>
                          <p className="text-gray-400 text-sm">Scan QR code for entry</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Ticket className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No bookings found</h3>
            <p className="text-gray-400 mb-6">
              {filter === 'all'
                ? "You haven't made any bookings yet"
                : `No ${filter} bookings found`}
            </p>
            <Button variant="primary" onClick={() => (window.location.href = '/')}>
              Browse Movies
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;