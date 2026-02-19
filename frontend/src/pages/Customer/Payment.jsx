import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Film, Calendar, Clock, MapPin } from "lucide-react";
import SeatMap from "../../components/Booking/SeatMap";
import BookingForm from "../../components/Booking/BookingForm";
import Receipt from "../../components/Booking/Receipt";
import { useBooking } from "../../context/BookingContext";
import { formatDate, formatTime } from "../../utils/formatDate";
import { apiRequest } from "../../services/api";
import { API_ENDPOINTS, RAZORPAY_KEY } from "../../utils/constants";
import { API_BASE_URL } from "../../utils/constants";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
      toast.error("Please select a movie and showtime first");
      navigate("/");
    }
  }, [bookingData, navigate]);

  const handlePayment = async (formData) => {
    try {
      setLoading(true);

      // 1️⃣ Create booking (PENDING)
      const bookingRes = await apiRequest.post(API_ENDPOINTS.CREATE_BOOKING, {
        movieId: bookingData.movie._id,
        showId: bookingData.show._id,
        seats: bookingData.selectedSeats,
        email: formData.email,
        phone: formData.phone,
      });

      const booking = bookingRes.booking;

      // 2️⃣ Create Razorpay order
      const orderRes = await apiRequest.post(
        API_ENDPOINTS.CREATE_RAZORPAY_ORDER,
        { bookingId: booking._id },
      );

      // 3️⃣ Open Razorpay popup
      const options = {
        key: RAZORPAY_KEY, // rzp_test_xxx
        amount: orderRes.amount,
        currency: orderRes.currency,
        order_id: orderRes.id,
        name: "Movie Booking",
        description: "Ticket Payment",

        handler: async function (response) {
          // 🔴 THIS IS THE “5️⃣ FRONTEND DATA YOU MUST SEND”
          const verifyRes = await apiRequest.post(
            API_ENDPOINTS.VERIFY_PAYMENT,
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id,
            },
          );

          if (verifyRes.success) {
            clearBooking();
            toast.success("Payment successful");

            // ✅ use booking returned by VERIFY API
            navigate(`/receipt/${verifyRes.booking._id}`, { replace: true });
          }
        },

        prefill: {
          email: formData.email,
          contact: formData.phone,
        },

        theme: {
          color: "#6366f1",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed");
    } finally {
      setLoading(false);
    }
  };

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
                  <span>{bookingData.show.format || "2D"}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 ${step >= 1 ? "text-primary" : "text-gray-500"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-primary" : "bg-gray-700"}`}
              >
                1
              </div>
              <span>Select Seats</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-700"></div>
            <div
              className={`flex items-center space-x-2 ${step >= 2 ? "text-primary" : "text-gray-500"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-primary" : "bg-gray-700"}`}
              >
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
                <h2 className="text-2xl font-bold text-white mb-6">
                  Select Your Seats
                </h2>
                <SeatMap bookedSeats={bookingData.show.bookedSeats} totalSeats={bookingData.show.totalSeats}/>

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
              <h3 className="text-xl font-bold text-white mb-4">
                Booking Summary
              </h3>

              {bookingData.selectedSeats.length > 0 ? (
                <>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-gray-400">
                      <span>Seats:</span>
                      <span className="text-white font-semibold">
                        {bookingData.selectedSeats
                          .map((s) => `${s.row}${s.number}`)
                          .join(", ")}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Tickets ({summary.seatCount}):</span>
                      <span className="text-white">
                        ₹{summary.basePrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Convenience Fee:</span>
                      <span className="text-white">
                        ₹{summary.convenienceFee.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>GST (18%):</span>
                      <span className="text-white">
                        ₹{summary.tax.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-3 flex justify-between text-white font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-primary">
                      ₹{summary.total.toFixed(2)}
                    </span>
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
