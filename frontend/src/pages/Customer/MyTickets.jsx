import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pdf } from "@react-pdf/renderer";
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Download,
  XCircle,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import Loader from "../../components/UI/Loader";
import Button from "../../components/UI/Button";
import { apiRequest } from "../../services/api";
import { API_ENDPOINTS } from "../../utils/constants";
import { formatDate, formatTime } from "../../utils/formatDate";
import TicketDocument from "../../components/Booking/TicketDocument";
import toast from "react-hot-toast";

const MyTickets = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); 
  const [qrFailed, setQrFailed] = useState({});
  const [downloadingId, setDownloadingId] = useState(null);

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
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      const response = await apiRequest.delete(
        API_ENDPOINTS.CANCEL_BOOKING(bookingId),
      );

      if (response.success) {
        toast.success("Booking cancelled successfully");
        fetchBookings();
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error(error.response?.data?.message || "Failed to cancel booking");
    }
  };

  const handleDownloadTicket = async (booking) => {
    const toastId = toast.loading("Preparing your ticket...");
    setDownloadingId(booking._id);

    try {
      const doc = <TicketDocument booking={booking} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `ticket-${booking.bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success("Ticket downloaded", { id: toastId });
    } catch (error) {
      console.error("Error generating ticket:", error);
      toast.error("Failed to generate ticket", { id: toastId });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleQrError = (bookingId) => {
    setQrFailed((prev) => ({ ...prev, [bookingId]: true }));
  };

  const getFilteredBookings = () => {
    const now = new Date();

    switch (filter) {
      case "upcoming":
        return bookings.filter(
          (b) => new Date(b.show?.date) >= now && b.status !== "cancelled",
        );
      case "past":
        return bookings.filter((b) => new Date(b.show?.date) < now);
      case "cancelled":
        return bookings.filter((b) => b.status === "cancelled");
      default:
        return bookings;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: {
        color: "bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]",
        icon: CheckCircle,
        text: "Confirmed",
      },
      cancelled: { 
        color: "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]", 
        icon: XCircle, 
        text: "Cancelled", 
      },
      pending: { 
        color: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]", 
        icon: Clock, 
        text: "Pending", 
      },
    };

    const config = statusConfig[status] || statusConfig.confirmed;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md ${config.color}`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{config.text}</span>
      </span>
    );
  };

  if (loading) {
    return <Loader fullScreen message="Loading your bookings..." />;
  }

  const filteredBookings = getFilteredBookings();

  return (
    <div className="min-h-screen bg-dark py-8 px-4 sm:px-6">
      <div className="container-custom max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center sm:text-left"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gradient-primary tracking-tight mb-3">
                My Tickets
              </h1>
              <p className="text-gray-400 text-lg">
                Your digital cinema passes and booking history.
              </p>
            </div>
            <div className="premium-glass-panel p-4 rounded-[20px]">
              <Ticket className="w-10 h-10 text-primary" />
            </div>
          </div>

          {/* Premium Filter Tabs */}
          <div className="flex flex-wrap sm:flex-nowrap justify-center sm:justify-start gap-3 w-full">
            {[
              { id: "all", label: "All Bookings" },
              { id: "upcoming", label: "Upcoming" },
              { id: "past", label: "Past" },
              { id: "cancelled", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`active-press px-6 py-2.5 rounded-2xl font-semibold transition-all duration-300 ${
                  filter === tab.id
                    ? "bg-primary text-white shadow-[0_0_20px_rgba(229,9,20,0.3)] stat-glow-orange"
                    : "bg-gray-800/40 text-gray-400 hover:bg-gray-800 border border-white/5 hover:border-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Bookings List */}
        {filteredBookings.length > 0 ? (
          <div className="space-y-8">
            <AnimatePresence>
              {filteredBookings.map((booking, index) => {
                const isUpcoming = new Date(booking.show?.date) >= new Date();
                const isActivePass = booking.status === "confirmed" && isUpcoming;

                return (
                  <motion.div
                    key={booking._id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ delay: index * 0.1 }}
                    className={`premium-glass-panel group overflow-hidden ${isActivePass ? 'ring-1 ring-primary/20 shadow-[0_0_30px_rgba(229,9,20,0.1)] theme-light:shadow-[0_0_30px_rgba(188,108,37,0.1)]' : ''}`}
                  >
                    <div className="flex flex-col md:flex-row h-full">
                      {/* Left Side: Dramatic Movie Poster */}
                      <div className="relative md:w-56 h-48 md:h-auto flex-shrink-0">
                        <img
                          src={booking.movie?.poster}
                          alt={booking.movie?.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-dark/90 via-dark/40 to-transparent" />
                        
                        {/* Status Badge floating on poster */}
                        <div className="absolute top-4 left-4">
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>

                      {/* Middle: Details section */}
                      <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                        <div className="flex flex-col mb-6">
                            <span className="text-primary text-xs font-bold uppercase tracking-widest mb-1.5">
                              {isActivePass ? "Active Entry Pass" : "Digital Receipt"}
                            </span>
                            <h3 className="text-3xl font-extrabold text-white leading-tight mb-2">
                              {booking.movie?.title}
                            </h3>
                            <p className="text-gray-500 text-sm font-medium">
                              Booking ID: <span className="text-gray-300 font-mono tracking-wider">{booking.bookingId}</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date</p>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              <p className="text-white font-medium">{formatDate(booking.show?.date)}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Time</p>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-primary" />
                              <p className="text-white font-medium">{formatTime(booking.show?.time)}</p>
                            </div>
                          </div>

                          <div className="col-span-2">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Theater</p>
                            <div className="flex items-start space-x-2">
                              <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-white font-medium">{booking.show?.theater}</p>
                                <p className="text-gray-400 text-xs">{booking.show?.location}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Seats Array */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
                          <div>
                             <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Seats ({booking.seats?.length})</p>
                             <div className="flex flex-wrap gap-2">
                               {booking.seats?.map((seat, idx) => (
                                 <span
                                   key={idx}
                                   className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-white font-semibold text-sm shadow-sm"
                                 >
                                   {seat.row}{seat.number}
                                 </span>
                               ))}
                             </div>
                          </div>
                          <div className="text-left sm:text-right">
                             <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Paid</p>
                             <p className="money-value text-2xl font-bold text-white">
                               Rs. {booking.totalAmount?.toFixed(2)}
                             </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 mt-6">
                            {booking.status !== "cancelled" && (
                              <button
                                className="active-press hover-lift flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 px-5 py-2.5 rounded-xl text-white font-medium transition-colors text-sm"
                                onClick={() => handleDownloadTicket(booking)}
                                disabled={downloadingId === booking._id}
                              >
                                {downloadingId === booking._id ? (
                                  <Loader size="small" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                                Download PDF
                              </button>
                            )}

                            {booking.status !== "cancelled" && isUpcoming && (
                              <button
                                className="active-press hover-lift flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 px-5 py-2.5 rounded-xl font-medium transition-colors text-sm"
                                onClick={() => handleCancelBooking(booking._id)}
                              >
                                <XCircle className="w-4 h-4" />
                                Cancel Ticket
                              </button>
                            )}
                        </div>
                      </div>

                      {/* Right Side: Quick QR Pass */}
                      {isActivePass && (
                        <div className="md:w-64 bg-black/40 md:border-l border-t md:border-t-0 border-white/10 p-8 flex flex-col items-center justify-center relative">
                          {/* Inner glow */}
                          <div className="absolute inset-0 bg-primary/5 opacity-50" />
                          
                          <p className="text-sm text-gray-400 font-medium mb-4 relative z-10">Scan at entrance</p>
                          <div className="bg-white p-3 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] relative z-10">
                            {qrFailed[booking._id] ? (
                              <div className="w-32 h-32 flex flex-col items-center justify-center text-center bg-gray-100 rounded-xl">
                                <p className="text-xs text-gray-500 uppercase font-semibold">ID</p>
                                <p className="text-sm font-bold text-gray-900 mt-1">{booking.bookingId}</p>
                              </div>
                            ) : (
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${booking.bookingId}`}
                                alt="Booking QR"
                                className="w-32 h-32"
                                crossOrigin="anonymous"
                                onError={() => handleQrError(booking._id)}
                              />
                            )}
                          </div>
                          
                          <div className="mt-6 flex items-center text-xs text-primary font-bold tracking-widest uppercase relative z-10 w-full justify-center gap-1">
                            Valid Pass <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="premium-glass-panel text-center py-20 px-6 max-w-2xl mx-auto"
          >
            <div className="w-24 h-24 bg-dark-card rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/5">
              <Ticket className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-3">
              No tickets found
            </h3>
            <p className="text-gray-400 mb-8 max-w-sm mx-auto text-lg leading-relaxed">
              {filter === "all"
                ? "You haven't booked any movies yet. Your digital passes will appear here."
                : `We couldn't find any ${filter} bookings in your history.`}
            </p>
            <Button
              variant="primary"
              className="px-8 py-3 text-lg"
              onClick={() => (window.location.href = "/")}
            >
              Browse Movies
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;
