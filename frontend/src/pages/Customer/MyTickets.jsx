import React, { useEffect, useMemo, useState } from "react";
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
  Wallet,
  Sparkles,
  Clock3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Loader from "../../components/UI/Loader";
import Button from "../../components/UI/Button";
import { apiRequest } from "../../services/api";
import { API_ENDPOINTS } from "../../utils/constants";
import { formatDate, formatTime } from "../../utils/formatDate";
import TicketDocument from "../../components/Booking/TicketDocument";
import CancellationModal from "../../components/Booking/CancellationModal";
import toast from "react-hot-toast";
import logo from "./../../assets/images/Showtime_logo.png";
import { useTheme } from "../../context/ThemeContext";

const createWhiteLogoDataUrl = (src) =>
  new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        if (!width || !height) {
          resolve(src);
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 0) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    } catch {
      resolve(src);
    }
  });

const MyTickets = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [qrFailed, setQrFailed] = useState({});
  const [downloadingId, setDownloadingId] = useState(null);
  const [cancellationModal, setCancellationModal] = useState({ isOpen: false, bookingId: null });
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  

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

  const handleOpenCancellationModal = (bookingId) => {
    setCancellationModal({ isOpen: true, bookingId });
  };

  const handleCloseCancellationModal = () => {
    setCancellationModal({ isOpen: false, bookingId: null });
  };

  const handleConfirmCancellation = async (reason, additionalNote) => {
    const bookingId = cancellationModal.bookingId;
    setCancellingBookingId(bookingId);

    try {
      const response = await apiRequest.delete(
        API_ENDPOINTS.CANCEL_BOOKING(bookingId),
        { data: { reason, additionalNote } },
      );

      if (response.success) {
        toast.success(response.message || "Booking cancelled. Refund process initiated.");
        handleCloseCancellationModal();
        fetchBookings();
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error(error.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancellingBookingId(null);
    }
  };

  const handleDownloadTicket = async (booking) => {
    const toastId = toast.loading("Preparing your ticket...");
    setDownloadingId(booking._id);

    try {
      const whiteLogo = await createWhiteLogoDataUrl(logo);
      const doc = <TicketDocument booking={booking} logoSrc={whiteLogo} />;
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

  const getRefundMeta = (status) => {
    const normalized = status || "none";
    const base = {
      titleClass: isDark ? "text-gray-200" : "text-gray-800",
      textClass: isDark ? "text-gray-200/80" : "text-gray-700",
      containerClass: isDark
        ? "bg-gray-700/30 border-gray-600/60"
        : "bg-gray-100 border-gray-300",
      iconClass: isDark ? "text-gray-300" : "text-gray-600",
      Icon: Clock,
      title: "Refund Pending",
      statusText: "Status: Not initiated",
      note: "Refund will start after review",
      showAmount: false,
    };

    if (normalized === "refunded") {
      return {
        ...base,
        Icon: CheckCircle,
        title: "Refund Completed",
        statusText: "Status: Refunded",
        note: null,
        showAmount: true,
        containerClass: isDark
          ? "bg-emerald-500/10 border-emerald-500/30"
          : "bg-emerald-50 border-emerald-200",
        iconClass: isDark ? "text-emerald-300" : "text-emerald-600",
        titleClass: isDark ? "text-emerald-200" : "text-emerald-800",
        textClass: isDark ? "text-emerald-200/80" : "text-emerald-700",
      };
    }

    if (normalized === "failed") {
      return {
        ...base,
        Icon: XCircle,
        title: "Refund Failed",
        statusText: "Status: Failed",
        note: "Please contact support",
        containerClass: isDark
          ? "bg-rose-500/10 border-rose-500/30"
          : "bg-rose-50 border-rose-200",
        iconClass: isDark ? "text-rose-300" : "text-rose-600",
        titleClass: isDark ? "text-rose-200" : "text-rose-800",
        textClass: isDark ? "text-rose-200/80" : "text-rose-700",
      };
    }

    if (normalized === "processing" || normalized === "initiated") {
      return {
        ...base,
        Icon: Clock3,
        title: "Refund Processing",
        statusText: `Status: ${normalized}`,
        note: "Expected in 2-3 working days",
        containerClass: isDark
          ? "bg-blue-500/10 border-blue-500/30"
          : "bg-blue-50 border-blue-200",
        iconClass: isDark ? "text-blue-300" : "text-blue-600",
        titleClass: isDark ? "text-blue-200" : "text-blue-800",
        textClass: isDark ? "text-blue-200/80" : "text-blue-700",
      };
    }

    return base;
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

  const filteredBookings = useMemo(() => {
    const list = getFilteredBookings();
    return [...list].sort(
      (a, b) =>
        new Date(b.createdAt || b.show?.date || 0).getTime() -
        new Date(a.createdAt || a.show?.date || 0).getTime(),
    );
  }, [bookings, filter]);

  const ticketStats = useMemo(() => {
    const now = new Date();
    const upcoming = bookings.filter(
      (b) => new Date(b.show?.date) >= now && b.status !== "cancelled",
    ).length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;
    const spent = bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const refunded = bookings
      .filter((b) => b.refundStatus === "refunded")
      .reduce(
        (sum, b) =>
          sum + Number(b.refundedAmount || b.totalAmount || 0),
        0,
      );

    return { upcoming, cancelled, spent, refunded };
  }, [bookings]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: {
        color:
          "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
        icon: CheckCircle,
        text: "Confirmed",
      },
      cancelled: {
        color: "bg-rose-500/10 text-rose-300 border border-rose-500/30",
        icon: XCircle,
        text: "Cancelled",
      },
      pending: {
        color: "bg-amber-500/10 text-amber-300 border border-amber-500/30",
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

  const filters = [
    { id: "all", label: "All", count: bookings.length },
    {
      id: "upcoming",
      label: "Upcoming",
      count: bookings.filter(
        (b) => new Date(b.show?.date) >= new Date() && b.status !== "cancelled",
      ).length,
    },
    {
      id: "past",
      label: "Past",
      count: bookings.filter((b) => new Date(b.show?.date) < new Date()).length,
    },
    {
      id: "cancelled",
      label: "Cancelled",
      count: bookings.filter((b) => b.status === "cancelled").length,
    },
  ];

  return (
    <>
    <div className="min-h-screen bg-dark py-8 px-4 sm:px-6">
      <div className="container-custom max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="card overflow-hidden p-0">
            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-[1.2fr_1fr] md:p-7">
              <div>
                <h1 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">
                  My Tickets
                </h1>
                <p className="mt-3 max-w-xl text-sm text-gray-300 sm:text-base">
                  Keep all your movie passes in one place. Download PDFs, scan
                  QR at entry, and manage upcoming bookings.
                </p>
              </div>

              <div className="grid grid-cols-4 h-full items-center gap-3">
                <div className="rounded-2xl border h-[90px] border-gray-700/60 bg-gray-800/45 p-3 text-center">
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    All
                  </p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {bookings.length}
                  </p>
                </div>
                <div className="rounded-2xl border h-[90px]  border-primary/30 bg-primary/10 p-3 text-center">
                  <p className="text-xs uppercase tracking-wider text-primary/90">
                    Active
                  </p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {ticketStats.upcoming}
                  </p>
                </div>
                <div className="rounded-2xl border h-[90px] border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
                  <p className="text-xs uppercase tracking-wider text-black/90">
                    Refunded
                  </p>
                  <p className="mt-1 text-lg font-bold text-white">
                    Rs. {ticketStats.refunded.toFixed(0)}
                  </p>
                </div>
                <div className="rounded-2xl border h-[90px] border-gray-700/60 bg-gray-800/45 p-3 text-center">
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    Spent
                  </p>
                  <p className="mt-1 text-lg font-bold text-white">
                    Rs. {ticketStats.spent.toFixed(0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {filters.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  filter === tab.id
                    ? "border-primary/50 bg-primary/15 text-white"
                    : "border-gray-700/70 bg-gray-800/40 text-gray-300 hover:bg-gray-800/65"
                }`}
              >
                {tab.label}{" "}
                <span className="ml-1 text-xs opacity-80">({tab.count})</span>
              </button>
            ))}
          </div>
        </motion.div>

        {filteredBookings.length > 0 ? (
          <div className="space-y-5">
            <AnimatePresence>
              {filteredBookings.map((booking, index) => {
                const isUpcoming = new Date(booking.show?.date) >= new Date();
                const isActivePass =
                  booking.status === "confirmed" && isUpcoming;

                return (
                  <motion.div
                    key={booking._id}
                    layout
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, delay: index * 0.04 }}
                    className={`card overflow-hidden p-0 ${isActivePass ? "ring-1 ring-primary/30" : ""}`}
                  >
                    <div className="flex flex-col lg:flex-row">
                      <div className="relative h-48 w-full overflow-hidden lg:h-auto lg:w-52">
                        <img
                          src={booking.movie?.poster}
                          alt={booking.movie?.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent lg:bg-gradient-to-r" />
                        <div className="absolute left-3 top-3">
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>

                      <div className="flex-1 p-5 md:p-6">
                        <div className="mb-5 flex flex-col gap-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                            {isActivePass ? "Active Pass" : "Ticket Record"}
                          </p>
                          <h3 className="text-2xl font-bold text-white">
                            {booking.movie?.title}
                          </h3>
                          <p className="text-xs text-gray-400">
                            Booking ID:{" "}
                            <span className="font-mono text-gray-300">
                              {booking.bookingId}
                            </span>
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-xl border border-gray-700/60 bg-gray-800/35 p-3">
                            <p className="text-[11px] uppercase tracking-wider text-gray-400">
                              Date
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-white">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span className="text-sm font-semibold">
                                {formatDate(booking.show?.date)}
                              </span>
                            </div>
                          </div>

                          <div className="rounded-xl border border-gray-700/60 bg-gray-800/35 p-3">
                            <p className="text-[11px] uppercase tracking-wider text-gray-400">
                              Time
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-white">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="text-sm font-semibold">
                                {formatTime(booking.show?.time)}
                              </span>
                            </div>
                          </div>

                          <div className="rounded-xl border border-gray-700/60 bg-gray-800/35 p-3 sm:col-span-2">
                            <p className="text-[11px] uppercase tracking-wider text-gray-400">
                              Theater
                            </p>
                            <div className="mt-1 flex items-start gap-2 text-white">
                              <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                              <div>
                                <p className="text-sm font-semibold">
                                  {booking.show?.theater}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {booking.show?.location}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-4 border-t border-gray-700/60 pt-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-gray-400">
                              Seats ({booking.seats?.length || 0})
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {booking.seats?.map((seat, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-lg border border-gray-700 bg-gray-800/60 px-2.5 py-1 text-xs font-semibold text-white"
                                >
                                  {seat.row}
                                  {seat.number}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="text-left md:text-right">
                            <p className="text-[11px] uppercase tracking-wider text-gray-400">
                              Total Paid
                            </p>
                            <div className="mt-1 flex items-center gap-2 md:justify-end">
                              <Wallet className="h-4 w-4 text-primary" />
                              <p className="money-value text-xl font-bold text-white">
                                Rs. {(booking.totalAmount || 0).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          {booking.status === "cancelled" && booking.refundRequestedBy === "admin" && (
                            <div
                              className={`w-full rounded-lg border px-4 py-3 text-xs ${
                                isDark
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                                  : "bg-amber-50 border-amber-200 text-amber-800"
                              }`}
                            >
                              <p className="font-semibold uppercase tracking-wider">Cancelled By Admin</p>
                              <p className="mt-1">
                                {booking.refundReason || booking.refundApprovalNote || "Your booking was cancelled by admin."}
                              </p>
                            </div>
                          )}
                          {booking.status !== "cancelled" && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDownloadTicket(booking)}
                              disabled={downloadingId === booking._id}
                              icon={
                                downloadingId === booking._id ? (
                                  <Loader size="small" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )
                              }
                            >
                              {downloadingId === booking._id
                                ? "Preparing..."
                                : "Download PDF"}
                            </Button>
                          )}

                          {booking.status !== "cancelled" && isUpcoming && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenCancellationModal(booking._id)}
                              disabled={cancellingBookingId === booking._id}
                              icon={<XCircle className="h-4 w-4" />}
                            >
                              Cancel Ticket
                            </Button>
                          )}

                          {booking.status === "cancelled" && (() => {
                            const refundMeta = getRefundMeta(booking.refundStatus);
                            const Icon = refundMeta.Icon;
                            const declineNote =
                              booking.refundStatus === "failed"
                                ? booking.refundApprovalNote || booking.refundReason
                                : null;
                            return (
                              <div className={`flex items-start gap-2 p-3 rounded-lg w-full border ${refundMeta.containerClass}`}>
                                <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${refundMeta.iconClass}`} />
                                <div className="flex-1">
                                  <p className={`text-xs font-semibold ${refundMeta.titleClass}`}>{refundMeta.title}</p>
                                  <p className={`text-xs ${refundMeta.textClass}`}>{refundMeta.statusText}</p>
                                  {refundMeta.note && (
                                    <p className={`text-xs ${refundMeta.textClass}`}>{refundMeta.note}</p>
                                  )}
                                  {declineNote && (
                                    <p className={`text-xs ${refundMeta.textClass}`}>
                                      Message: {declineNote}
                                    </p>
                                  )}
                                  {refundMeta.showAmount && (
                                    <p className={`text-xs ${refundMeta.textClass}`}>
                                      Refunded Amount: Rs.{" "}
                                      {Number(booking.refundedAmount || booking.totalAmount || 0).toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {isActivePass && (
                        <div className="border-t border-gray-700/60 bg-black/25 p-6 lg:w-56 lg:border-l lg:border-t-0">
                          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                            Scan at Entry
                          </p>
                          <div className="mx-auto w-fit rounded-2xl bg-white p-3">
                            {qrFailed[booking._id] ? (
                              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-xl bg-gray-100 text-center">
                                <p className="text-[10px] font-semibold uppercase text-gray-500">
                                  Code
                                </p>
                                <p className="mt-1 text-xs font-bold text-gray-900">
                                  {booking.bookingId}
                                </p>
                              </div>
                            ) : (
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${booking.bookingId}`}
                                alt="Booking QR"
                                className="h-32 w-32"
                                crossOrigin="anonymous"
                                onError={() => handleQrError(booking._id)}
                              />
                            )}
                          </div>
                          <p className="mt-4 flex items-center justify-center gap-1 text-xs font-bold uppercase tracking-widest text-primary">
                            Valid Pass <ChevronRight className="h-3.5 w-3.5" />
                          </p>
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
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card mx-auto max-w-2xl py-16 text-center"
          >
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-gray-700 bg-gray-800/40">
              <Ticket className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">No tickets found</h3>
            <p className="mx-auto mt-3 max-w-md text-gray-400">
              {filter === "all"
                ? "You have not booked any movie yet. Your tickets will appear here once you complete a booking."
                : `No ${filter} bookings available right now.`}
            </p>
            <div className="mt-7 flex justify-center">
              <Button
                variant="primary"
                onClick={() => navigate("/")}
                icon={<ChevronRight className="h-4 w-4" />}
              >
                Browse Movies
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>

    <CancellationModal
      isOpen={cancellationModal.isOpen}
      onClose={handleCloseCancellationModal}
      onConfirm={handleConfirmCancellation}
      isLoading={cancellingBookingId === cancellationModal.bookingId}
    />
    </>
  );
};

export default MyTickets;
