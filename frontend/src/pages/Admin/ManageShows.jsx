import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import Loader from "../../components/UI/Loader";
import { apiRequest } from "../../services/api";
import {
  API_ENDPOINTS,
  FORMATS,
  TIME_SLOTS,
  SEAT_CONFIG,
} from "../../utils/constants";
import { formatDate, formatTime } from "../../utils/formatDate";
import toast from "react-hot-toast";

const ManageShows = () => {
  const PAGE_LIMIT = 10;
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: false,
    total: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [editingShow, setEditingShow] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    movieId: "",
    startDate: "",
    endDate: "",
    timeSlots: [],
    theater: "",
    location: "",
    format: "2D",
    price: "",
    totalSeats: SEAT_CONFIG.ROWS.length * SEAT_CONFIG.SEATS_PER_ROW,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (resetPage = true) => {
    const targetPage = resetPage ? 1 : pagination.page + 1;

    try {
      if (resetPage) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const showsPromise = apiRequest.get(API_ENDPOINTS.SHOWS, {
        params: {
          page: targetPage,
          limit: PAGE_LIMIT,
          sortBy: "createdAt",
          order: "desc",
        },
      });

      let showsRes;

      if (resetPage) {
        const [showsResponse, moviesRes] = await Promise.all([
          showsPromise,
          apiRequest.get(API_ENDPOINTS.MOVIES),
        ]);

        showsRes = showsResponse;

        if (moviesRes.success) {
          setMovies(moviesRes.movies || []);
        }
      } else {
        showsRes = await showsPromise;
      }

      if (showsRes.success) {
        const incomingShows = showsRes.shows || [];

        setShows((prevShows) =>
          resetPage ? incomingShows : [...prevShows, ...incomingShows],
        );

        const total =
          typeof showsRes.total === "number"
            ? showsRes.total
            : resetPage
              ? incomingShows.length
              : shows.length + incomingShows.length;

        setPagination({
          page: showsRes.page || targetPage,
          hasMore: Boolean(showsRes.hasMore),
          total,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load shows");
    } finally {
      if (resetPage) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && pagination.hasMore) {
      fetchData(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const toggleTimeSlot = (time) => {
    // If editing, only allow ONE time slot
    if (editingShow) {
      setFormData({ ...formData, timeSlots: [time] });
      return;
    }
    // If creating, allow multiple
    setFormData((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.includes(time)
        ? prev.timeSlots.filter((t) => t !== time)
        : [...prev.timeSlots, time],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!formData.movieId) newErrors.movieId = "Movie is required";
    if (!formData.startDate) newErrors.startDate = "Start date required";
    if (!formData.endDate) newErrors.endDate = "End date required";
    if (formData.timeSlots.length === 0)
      newErrors.timeSlots = "Select at least one time slot";
    if (!formData.theater.trim()) newErrors.theater = "Theater is required";
    if (!formData.price) newErrors.price = "Price is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);

      let response;

      // 🟢 LOGIC BRANCH: Editing (Single Show) vs Creating (Batch)
      if (editingShow) {
        // Prepare SINGLE show payload
        const updateData = {
          ...formData,
          // Map form fields back to Model fields
          date: formData.startDate, // Use Start Date as THE Date
          time: formData.timeSlots[0], // Use the first selected slot
          price: parseFloat(formData.price),
          totalSeats: parseInt(formData.totalSeats),
        };

        response = await apiRequest.put(
          API_ENDPOINTS.SHOW_BY_ID(editingShow._id),
          updateData,
        );
      } else {
        // Prepare BATCH generator payload
        const createData = {
          ...formData,
          price: parseFloat(formData.price),
          totalSeats: parseInt(formData.totalSeats),
        };
        response = await apiRequest.post(API_ENDPOINTS.SHOWS, createData);
      }

      if (response.success) {
        toast.success(
          editingShow
            ? "Show updated successfully"
            : "Shows scheduled successfully",
        );
        setShowModal(false);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error("Error saving show:", error);
      toast.error(error.response?.data?.message || "Failed to save show");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (show) => {
    setEditingShow(show);

    // 🟢 FIX: Handle data mapping from Backend (Single) to Form (Range)
    // If show.date exists, use it. If not, try fallback fields.
    const formattedDate = show.date ? show.date.split("T")[0] : "";

    setFormData({
      movieId: show.movie?._id || show.movieId,
      startDate: formattedDate, // Set Start = Date
      endDate: formattedDate, // Set End = Date (Since it's a single show)
      timeSlots: show.time ? [show.time] : [], // Wrap single time in array
      theater: show.theater || "",
      location: show.location || "",
      format: show.format || "2D",
      price: show.price?.toString() || "",
      totalSeats:
        show.totalSeats || SEAT_CONFIG.ROWS.length * SEAT_CONFIG.SEATS_PER_ROW,
    });
    setShowModal(true);
  };

  const handleDelete = async (showId) => {
    if (!window.confirm("Are you sure you want to delete this show?")) {
      return;
    }

    try {
      const response = await apiRequest.delete(
        API_ENDPOINTS.SHOW_BY_ID(showId),
      );
      if (response.success) {
        toast.success("Show deleted successfully");
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting show:", error);
      toast.error("Failed to delete show");
    }
  };

  const resetForm = () => {
    setFormData({
      movieId: "",
      startDate: "",
      endDate: "",
      timeSlots: [],
      theater: "",
      location: "",
      format: "2D",
      price: "",
      totalSeats: SEAT_CONFIG.ROWS.length * SEAT_CONFIG.SEATS_PER_ROW,
    });
    setEditingShow(null);
    setErrors({});
  };

  if (loading) {
    return <Loader fullScreen message="Loading shows..." />;
  }

  return (
    <div className="min-h-screen bg-dark py-8">
      <div className="container-custom">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Manage Shows
            </h1>
            <p className="text-gray-400">Schedule and manage movie showtimes</p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="mt-4 w-full sm:w-auto md:mt-0"
          >
            Add New Show
          </Button>
        </motion.div>

        {/* Shows Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-card rounded-xl overflow-hidden"
        >
          {shows.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px]">
                <thead className="admin-table-head">
                  <tr>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">
                      Movie
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">
                      Date
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">
                      Time
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">
                      Theater
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">
                      Format
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">
                      Price
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">
                      Seats
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                  <tbody>
                    {shows.map((show, index) => (
                      <motion.tr
                        key={show._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="admin-table-row border-b border-gray-800"
                      >
                      <td className="py-4 px-6 text-white font-semibold">
                        {show.movie?.title || "Unknown"}
                      </td>

                      {/* 🟢 FIX: Handle both 'date' and 'showDate' to prevent NaN */}
                      <td className="py-4 px-6 text-gray-300">
                        {formatDate(show.date)}
                      </td>

                      <td className="py-4 px-6 text-gray-300">
                        {formatTime(show.time)}
                      </td>

                      <td className="py-4 px-6">
                        <div>
                          <p className="text-white">{show.theater}</p>
                          <p className="text-gray-500 text-sm">
                            {show.location}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-300">{show.format}</td>
                      <td className="py-4 px-6 money-value font-semibold">
                        ₹{show.price}
                      </td>
                      {/* 🟢 FIX: Use availableSeats if it exists, or calculate safely */}
                      <td className="py-4 px-6 text-gray-300">
                        {show.availableSeats}/{show.totalSeats}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(show)}
                            className="p-2 bg-blue-500/20 text-blue-500 rounded hover:bg-blue-500/30 transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(show._id)}
                            className="p-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.hasMore && (
                <div className="flex justify-center border-t border-gray-800 px-6 py-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleLoadMore}
                    loading={loadingMore}
                    disabled={loadingMore}
                  >
                    {loadingMore
                      ? "Loading..."
                      : `Load More${
                          pagination.total > shows.length
                            ? ` (${pagination.total - shows.length} remaining)`
                            : ""
                        }`}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No shows scheduled</p>
            </div>
          )}
        </motion.div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl bg-dark-card p-4 sm:p-6 lg:p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingShow
                  ? `Edit Show — ${formatDate(editingShow.date)} ${editingShow.time}`
                  : "Schedule New Shows"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Movie <span className="text-primary">*</span>
                  </label>
                  <select
                    name="movieId"
                    value={formData.movieId}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                    // Disable movie selection when editing to prevent confusion
                    disabled={!!editingShow}
                  >
                    <option value="">Select Movie</option>
                    {movies.map((movie) => (
                      <option key={movie._id} value={movie._id}>
                        {movie.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={editingShow ? "Date" : "Start Date"}
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                    />
                    {/* Hide End Date if Editing (Single Show) */}
                    {!editingShow && (
                      <Input
                        label="End Date"
                        name="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        required
                      />
                    )}
                  </div>

                  <div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {editingShow ? "Time (Select One)" : "Time Slots"}
                      </label>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {TIME_SLOTS.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => toggleTimeSlot(time)}
                            className={`px-3 py-2 rounded text-sm ${
                              (formData.timeSlots || []).includes(time)
                                ? "bg-primary text-white"
                                : "bg-dark-lighter text-gray-300"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                    {errors.timeSlots && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.timeSlots}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Theater Name"
                    name="theater"
                    value={formData.theater}
                    onChange={handleInputChange}
                    error={errors.theater}
                    placeholder="PVR Cinemas"
                    required
                  />
                  <Input
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City Center, Downtown"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Format
                    </label>
                    <select
                      name="format"
                      value={formData.format}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      {FORMATS.map((format) => (
                        <option key={format} value={format}>
                          {format}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Price (₹)"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    error={errors.price}
                    placeholder="200"
                    required
                  />
                  <Input
                    label="Total Seats"
                    name="totalSeats"
                    type="number"
                    value={formData.totalSeats}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={submitting}>
                    {editingShow ? "Update Show" : "Generate Schedule"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageShows;
