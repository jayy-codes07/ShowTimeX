import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, RotateCcw, IndianRupee, Mail } from "lucide-react";
import Button from "../../components/UI/Button";
import Loader from "../../components/UI/Loader";
import { apiRequest } from "../../services/api";
import { API_ENDPOINTS } from "../../utils/constants";
import { formatDate, formatTime } from "../../utils/formatDate";
import toast from "react-hot-toast";

const PAGE_LIMIT = 10;

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [resendingBookingId, setResendingBookingId] = useState("");
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: false,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    date: "",
    movieId: "",
    theater: "",
    status: "",
    paymentStatus: "",
    refundStatus: "",
  });
  const [refundForm, setRefundForm] = useState({
    reason: "",
    note: "",
  });

  const fetchBookings = useCallback(async (requestFilters, resetPage = true, pageToLoad = 1) => {
    const targetPage = resetPage ? 1 : pageToLoad;

    try {
      if (resetPage) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = {
        ...requestFilters,
        page: targetPage,
        limit: PAGE_LIMIT,
      };

      Object.keys(params).forEach((key) => {
        if (params[key] === "") {
          delete params[key];
        }
      });

      const response = await apiRequest.get(API_ENDPOINTS.ADMIN_BOOKINGS, {
        params,
      });

      if (response.success) {
        const incomingBookings = response.bookings || [];
        setBookings((prev) =>
          resetPage ? incomingBookings : [...prev, ...incomingBookings],
        );

        setPagination({
          page: response.page || targetPage,
          hasMore: Boolean(response.hasMore),
          total: response.total || incomingBookings.length,
        });
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      if (resetPage) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const moviesRes = await apiRequest.get(API_ENDPOINTS.MOVIES);
        if (moviesRes.success) {
          setMovies(moviesRes.movies || []);
        }
      } catch (error) {
        console.error("Error fetching movies for filter:", error);
      }
    };

    loadInitial();
  }, []);

  useEffect(() => {
    fetchBookings(
      {
        date: filters.date,
        movieId: filters.movieId,
        theater: filters.theater,
        status: filters.status,
        paymentStatus: filters.paymentStatus,
        refundStatus: filters.refundStatus,
      },
      true,
      1,
    );
  }, [
    fetchBookings,
    filters.date,
    filters.movieId,
    filters.theater,
    filters.status,
    filters.paymentStatus,
    filters.refundStatus,
  ]);

  const statusOptions = useMemo(
    () => ["", "confirmed", "pending", "cancelled", "expired"],
    [],
  );

  const paymentStatusOptions = useMemo(
    () => ["", "pending", "completed", "failed", "refunded"],
    [],
  );

  const refundStatusOptions = useMemo(
    () => ["", "none", "initiated", "processing", "refunded", "failed"],
    [],
  );

  const canInitiateRefund = (booking) =>
    booking?.paymentStatus === "completed" &&
    ["none", "failed"].includes(booking?.refundStatus || "none");

  const canResendTicket = (booking) =>
    booking?.status === "confirmed" && booking?.paymentStatus === "completed";

  const handleLoadMore = () => {
    if (!loadingMore && pagination.hasMore) {
      fetchBookings(filters, false, pagination.page + 1);
    }
  };

  const applySearch = () => {
    fetchBookings(filters, true, 1);
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      date: "",
      movieId: "",
      theater: "",
      status: "",
      paymentStatus: "",
      refundStatus: "",
    });
  };

  const openRefundModal = (booking) => {
    setSelectedBooking(booking);
    setRefundForm({ reason: "", note: "" });
    setShowRefundModal(true);
  };

  const submitRefund = async (e) => {
    e.preventDefault();

    if (!refundForm.reason.trim()) {
      toast.error("Refund reason is required");
      return;
    }

    if (!selectedBooking?._id) {
      toast.error("Booking selection is invalid");
      return;
    }

    try {
      setSubmittingRefund(true);
      const response = await apiRequest.patch(
        API_ENDPOINTS.ADMIN_BOOKING_REFUND(selectedBooking._id),
        {
          reason: refundForm.reason,
          note: refundForm.note,
        },
      );

      if (response.success) {
        toast.success(response.message || "Refund initiated");
        setShowRefundModal(false);
        setSelectedBooking(null);
        fetchBookings(filters, true, 1);
      }
    } catch (error) {
      console.error("Error initiating refund:", error);
      toast.error(error.response?.data?.message || "Failed to initiate refund");
    } finally {
      setSubmittingRefund(false);
    }
  };

  const handleResendTicket = async (booking) => {
    if (!booking?._id) return;

    try {
      setResendingBookingId(booking._id);
      const response = await apiRequest.post(
        API_ENDPOINTS.ADMIN_BOOKING_RESEND(booking._id),
      );

      if (response.success) {
        toast.success(response.message || "Ticket email resent successfully");
      }
    } catch (error) {
      console.error("Error resending ticket:", error);
      toast.error(error.response?.data?.message || "Failed to resend ticket");
    } finally {
      setResendingBookingId("");
    }
  };

  if (loading) {
    return <Loader fullScreen message="Loading bookings..." />;
  }

  return (
    <div className="min-h-screen bg-dark py-8">
      <div className="container-custom">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Manage Bookings</h1>
          <p className="text-gray-400">Filter bookings, review payments, and initiate refunds with reason tracking.</p>
        </div>

        <div className="bg-dark-card rounded-xl p-4 sm:p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <div className="relative">
                <input
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  placeholder="Booking ID / name / email"
                  className="input-field pl-10"
                />
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Movie</label>
              <select
                value={filters.movieId}
                onChange={(e) => setFilters((prev) => ({ ...prev, movieId: e.target.value }))}
                className="input-field"
              >
                <option value="">All Movies</option>
                {movies.map((movie) => (
                  <option key={movie._id} value={movie._id}>
                    {movie.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Theater</label>
              <input
                value={filters.theater}
                onChange={(e) => setFilters((prev) => ({ ...prev, theater: e.target.value }))}
                placeholder="e.g. PVR"
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Booking Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="input-field"
              >
                {statusOptions.map((option) => (
                  <option key={option || "all-status"} value={option}>
                    {option || "All"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Payment Status</label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => setFilters((prev) => ({ ...prev, paymentStatus: e.target.value }))}
                className="input-field"
              >
                {paymentStatusOptions.map((option) => (
                  <option key={option || "all-payment"} value={option}>
                    {option || "All"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Refund Status</label>
              <select
                value={filters.refundStatus}
                onChange={(e) => setFilters((prev) => ({ ...prev, refundStatus: e.target.value }))}
                className="input-field"
              >
                {refundStatusOptions.map((option) => (
                  <option key={option || "all-refund"} value={option}>
                    {option || "All"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button type="button" variant="secondary" onClick={resetFilters} icon={<RotateCcw className="w-4 h-4" />}>
              Reset Filters
            </Button>
            <Button type="button" variant="primary" onClick={applySearch} icon={<Search className="w-4 h-4" />}>
              Search
            </Button>
          </div>
        </div>

        <div className="bg-dark-card rounded-xl p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-white">Bookings</h2>
            <span className="text-sm text-gray-400">
              Showing {bookings.length} of {pagination.total}
            </span>
          </div>

          {bookings.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="border-b border-gray-700">
                    <tr>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Booking ID</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Customer</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Movie/Show</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Theater</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Amount</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Refund</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking._id} className="admin-table-row border-b border-gray-800">
                        <td className="py-3 px-4 text-sm text-white">{booking.bookingId}</td>
                        <td className="py-3 px-4 text-sm text-gray-300">
                          <p className="text-white font-medium">{booking.user?.name || "N/A"}</p>
                          <p className="text-xs text-gray-500">{booking.user?.email || booking.email}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300">
                          <p className="text-white">{booking.movie?.title || "Unknown"}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(booking.show?.date || booking.bookingDate)} {booking.show?.time ? `at ${formatTime(booking.show.time)}` : ""}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300">{booking.show?.theater || "-"}</td>
                        <td className="py-3 px-4 text-sm money-value font-semibold">₹{booking.totalAmount?.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold uppercase ${
                            booking.status === "confirmed"
                              ? "bg-green-500/20 text-green-500"
                              : booking.status === "cancelled"
                                ? "bg-red-500/20 text-red-500"
                                : "bg-yellow-500/20 text-yellow-500"
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold uppercase ${
                            booking.refundStatus === "initiated" || booking.refundStatus === "processing"
                              ? "bg-amber-500/20 text-amber-400"
                              : booking.refundStatus === "refunded"
                                ? "bg-green-500/20 text-green-500"
                                : booking.refundStatus === "failed"
                                  ? "bg-red-500/20 text-red-500"
                                  : "bg-gray-700/40 text-gray-300"
                          }`}>
                            {booking.refundStatus || "none"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => handleResendTicket(booking)}
                              disabled={!canResendTicket(booking) || resendingBookingId === booking._id}
                              loading={resendingBookingId === booking._id}
                              className="!px-3 !py-2"
                              icon={<Mail className="w-4 h-4" />}
                            >
                              Resend
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => openRefundModal(booking)}
                              disabled={!canInitiateRefund(booking)}
                              className="!px-3 !py-2"
                              icon={<IndianRupee className="w-4 h-4" />}
                            >
                              Refund
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.hasMore && (
                <div className="mt-6 flex justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleLoadMore}
                    loading={loadingMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading..." : `Load More (${pagination.total - bookings.length} remaining)`}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-center py-8">No bookings found</p>
          )}
        </div>

        {showRefundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-lg rounded-xl bg-dark-card p-6">
              <h3 className="text-xl font-bold text-white mb-2">Initiate Refund</h3>
              <p className="text-sm text-gray-400 mb-5">
                {selectedBooking?.bookingId} - customer will be informed that refund will reflect in 2-3 working days.
              </p>

              <form onSubmit={submitRefund} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Refund Reason *</label>
                  <input
                    value={refundForm.reason}
                    onChange={(e) => setRefundForm((prev) => ({ ...prev, reason: e.target.value }))}
                    className="input-field"
                    placeholder="User requested cancellation"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Admin Note (Optional)</label>
                  <textarea
                    value={refundForm.note}
                    onChange={(e) => setRefundForm((prev) => ({ ...prev, note: e.target.value }))}
                    className="input-field min-h-[100px]"
                    placeholder="Additional notes for tracking"
                  />
                </div>

                <div className="pt-2 flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowRefundModal(false);
                      setSelectedBooking(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={submittingRefund}>
                    Confirm Refund Start
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBookings;
