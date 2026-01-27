import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Film, Calendar, Clock, MapPin } from 'lucide-react';
import SeatMap from '../../components/Booking/SeatMap';
import BookingForm from '../../components/Booking/BookingForm';
import Receipt from '../../components/Booking/Receipt';
import { useBooking } from '../../context/BookingContext';
import { formatDate, formatTime } from '../../utils/formatDate';
import { apiRequest } from '../../services/api';
import { API_ENDPOINTS, RAZORPAY_KEY } from '../../utils/constants';
import toast from 'react-hot-toast';

const Payment = () => {
  const navigate = useNavigate();
  const { bookingData, getBookingSummary, clearBooking } = useBooking();
  const [loading, setLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [step, setStep] = useState(1); // 1: Select Seats, 2: Checkout

  useEffect(() => {
    // Redirect if no booking data
    if (!bookingData.movie || !bookingData.show) {
      toast.error('Please select a movie and showtime first');
      navigate('/');
    }
  }, [bookingData, navigate]);

  const handlePayment = async (formData) => {
    try {
      setLoading(true);

      // Create booking
      const bookingPayload = {
        movieId: bookingData.movie._id,
        showId: bookingData.show._id,
        seats: bookingData.selectedSeats,
        email: formData.email,
        phone: formData.phone,
      };


      const response = await apiRequest.post(API_ENDPOINTS.CREATE_BOOKING, bookingPayload);

     if (response.success) {
        // ---------------------------------------------------------
        // 👇 CHANGED: Removed Razorpay Popup, added Direct Verification
        // ---------------------------------------------------------
        try {
           const verifyResponse = await apiRequest.post(API_ENDPOINTS.VERIFY_PAYMENT, {
              orderId: response.orderId,          // Use real Order ID from backend
              paymentId: `PAY_TEST_${Date.now()}`, // Fake Payment ID
              signature: "TEST_SIGNATURE_BYPASS",  // Fake Signature
              bookingId: response.booking._id,    // Real Booking ID
           });

           if (verifyResponse.success) {
              setConfirmedBooking(response.booking);
              setBookingConfirmed(true);
              toast.success('Test Payment successful! Booking confirmed.');
           }
        } catch (error) {
           toast.error('Payment verification failed');
        }
        // ---------------------------------------------------------
      }
    } 
    catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (bookingConfirmed && confirmedBooking) {
    return (
      <div className="min-h-screen bg-dark py-12">
        <div className="container-custom">
          <Receipt booking={confirmedBooking} />
        </div>
      </div>
    );
  }

  if (!bookingData.movie || !bookingData.show) {
    return null;
  }

  const summary = getBookingSummary();

  return (
    <div className="min-h-screen bg-dark py-8">
      <div className="container-custom">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Movie</span>
        </button>

        {/* Movie Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-card rounded-xl p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-6">
            <img
              src={bookingData.movie.poster}
              alt={bookingData.movie.title}
              className="w-32 h-48 object-cover rounded-lg"
            />
            <div className="flex-grow">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {bookingData.movie.title}
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2 text-gray-400">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{formatDate(bookingData.show.date)}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{formatTime(bookingData.show.time)}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{bookingData.show.theater}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <Film className="w-4 h-4 text-primary" />
                  <span>{bookingData.show.format || '2D'}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-primary' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary' : 'bg-gray-700'}`}>
                1
              </div>
              <span>Select Seats</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-700"></div>
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-primary' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary' : 'bg-gray-700'}`}>
                2
              </div>
              <span>Checkout</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 1 ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="text-2xl font-bold text-white mb-6">Select Your Seats</h2>
                <SeatMap bookedSeats={bookingData.show.bookedSeats || []} />
                
                {bookingData.selectedSeats.length > 0 && (
                  <div className="mt-6">
                    <button
                      onClick={() => setStep(2)}
                      className="btn-primary w-full"
                    >
                      Continue to Checkout
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="text-2xl font-bold text-white mb-6">Checkout</h2>
                <BookingForm onSubmit={handlePayment} loading={loading} />
              </motion.div>
            )}
          </div>

          {/* Booking Summary Sidebar */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-card rounded-xl p-6 sticky top-24"
            >
              <h3 className="text-xl font-bold text-white mb-4">Booking Summary</h3>
              
              {bookingData.selectedSeats.length > 0 ? (
                <>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-gray-400">
                      <span>Seats:</span>
                      <span className="text-white font-semibold">
                        {bookingData.selectedSeats.map(s => `${s.row}${s.number}`).join(', ')}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Tickets ({summary.seatCount}):</span>
                      <span className="text-white">₹{summary.basePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Convenience Fee:</span>
                      <span className="text-white">₹{summary.convenienceFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>GST (18%):</span>
                      <span className="text-white">₹{summary.tax.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-3 flex justify-between text-white font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-primary">₹{summary.total.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  No seats selected yet
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Load Razorpay Script */}
     
    </div>
  );
};

export default Payment;