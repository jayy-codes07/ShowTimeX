import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Calendar, Search } from 'lucide-react';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Loader from '../../components/UI/Loader';
import { apiRequest } from '../../services/api';
import { API_ENDPOINTS, FORMATS, TIME_SLOTS, SEAT_CONFIG } from '../../utils/constants';
import { formatDate, formatTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const ManageShows = () => {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingShow, setEditingShow] = useState(null);
  const [formData, setFormData] = useState({
    movieId: '',
    date: '',
    time: '',
    theater: '',
    location: '',
    format: '2D',
    price: '',
    totalSeats: SEAT_CONFIG.ROWS.length * SEAT_CONFIG.SEATS_PER_ROW,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [showsRes, moviesRes] = await Promise.all([
        apiRequest.get(API_ENDPOINTS.SHOWS),
        apiRequest.get(API_ENDPOINTS.MOVIES),
      ]);

      if (showsRes.success) {
        setShows(showsRes.shows || []);
      }
      if (moviesRes.success) {
        setMovies(moviesRes.movies || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load shows');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!formData.movieId) newErrors.movieId = 'Movie is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    if (!formData.theater.trim()) newErrors.theater = 'Theater is required';
    if (!formData.price) newErrors.price = 'Price is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);

      const showData = {
        ...formData,
        price: parseFloat(formData.price),
        totalSeats: parseInt(formData.totalSeats),
      };

      let response;
      if (editingShow) {
        response = await apiRequest.put(API_ENDPOINTS.SHOW_BY_ID(editingShow._id), showData);
      } else {
        response = await apiRequest.post(API_ENDPOINTS.SHOWS, showData);
      }

      if (response.success) {
        toast.success(editingShow ? 'Show updated successfully' : 'Show added successfully');
        setShowModal(false);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error saving show:', error);
      toast.error(error.response?.data?.message || 'Failed to save show');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (show) => {
    setEditingShow(show);
    setFormData({
      movieId: show.movie?._id || show.movieId,
      date: show.date?.split('T')[0] || '',
      time: show.time || '',
      theater: show.theater || '',
      location: show.location || '',
      format: show.format || '2D',
      price: show.price?.toString() || '',
      totalSeats: show.totalSeats || SEAT_CONFIG.ROWS.length * SEAT_CONFIG.SEATS_PER_ROW,
    });
    setShowModal(true);
  };

  const handleDelete = async (showId) => {
    if (!window.confirm('Are you sure you want to delete this show?')) {
      return;
    }

    try {
      const response = await apiRequest.delete(API_ENDPOINTS.SHOW_BY_ID(showId));
      if (response.success) {
        toast.success('Show deleted successfully');
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting show:', error);
      toast.error('Failed to delete show');
    }
  };

  const resetForm = () => {
    setFormData({
      movieId: '',
      date: '',
      time: '',
      theater: '',
      location: '',
      format: '2D',
      price: '',
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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Manage Shows</h1>
            <p className="text-gray-400">Schedule and manage movie showtimes</p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="mt-4 md:mt-0"
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-lighter">
                  <tr>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Movie</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Date</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Time</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Theater</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Format</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Price</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Seats</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shows.map((show, index) => (
                    <motion.tr
                      key={show._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-800 hover:bg-dark-lighter transition"
                    >
                      <td className="py-4 px-6 text-white font-semibold">
                        {show.movie?.title || 'Unknown'}
                      </td>
                      <td className="py-4 px-6 text-gray-300">{formatDate(show.date)}</td>
                      <td className="py-4 px-6 text-gray-300">{formatTime(show.time)}</td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-white">{show.theater}</p>
                          <p className="text-gray-500 text-sm">{show.location}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-300">{show.format}</td>
                      <td className="py-4 px-6 text-primary font-semibold">₹{show.price}</td>
                      <td className="py-4 px-6 text-gray-300">
                        {show.totalSeats - (show.bookedSeats?.length || 0)}/{show.totalSeats}
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
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No shows scheduled</p>
            </div>
          )}
        </motion.div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-dark-card rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingShow ? 'Edit Show' : 'Add New Show'}
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
                  >
                    <option value="">Select Movie</option>
                    {movies.map(movie => (
                      <option key={movie._id} value={movie._id}>
                        {movie.title}
                      </option>
                    ))}
                  </select>
                  {errors.movieId && <p className="mt-1 text-sm text-red-500">{errors.movieId}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    error={errors.date}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Time <span className="text-primary">*</span>
                    </label>
                    <select
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    >
                      <option value="">Select Time</option>
                      {TIME_SLOTS.map(time => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    {errors.time && <p className="mt-1 text-sm text-red-500">{errors.time}</p>}
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
                    <select
                      name="format"
                      value={formData.format}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      {FORMATS.map(format => (
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

                <div className="flex justify-end space-x-4 pt-4">
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
                    {editingShow ? 'Update Show' : 'Add Show'}
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