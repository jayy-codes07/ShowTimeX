import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Film } from 'lucide-react';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Loader from '../../components/UI/Loader';
import { movieService } from '../../services/movieService';
import { GENRES, LANGUAGES, CERTIFICATES } from '../../utils/constants';
import toast from 'react-hot-toast';

const ManageMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    releaseDate: '',
    rating: '',
    certificate: '',
    genres: [],
    languages: [],
    director: '',
    cast: '',
    poster: '',
    backdrop: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await movieService.getAllMovies();
      if (response.success) {
        setMovies(response.movies || []);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.error('Failed to load movies');
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

  const handleMultiSelect = (field, value) => {
    const current = formData[field];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.duration) newErrors.duration = 'Duration is required';
    if (!formData.releaseDate) newErrors.releaseDate = 'Release date is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare data
      const movieData = {
        ...formData,
        duration: parseInt(formData.duration),
        rating: parseFloat(formData.rating) || 0,
        cast: formData.cast.split(',').map(c => c.trim()).filter(Boolean),
      };

      let response;
      if (editingMovie) {
        response = await movieService.updateMovie(editingMovie._id, movieData);
      } else {
        response = await movieService.createMovie(movieData);
      }

      if (response.success) {
        toast.success(editingMovie ? 'Movie updated successfully' : 'Movie added successfully');
        setShowModal(false);
        resetForm();
        fetchMovies();
      }
    } catch (error) {
      console.error('Error saving movie:', error);
      toast.error(error.response?.data?.message || 'Failed to save movie');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      description: movie.description || '',
      duration: movie.duration?.toString() || '',
      releaseDate: movie.releaseDate?.split('T')[0] || '',
      rating: movie.rating?.toString() || '',
      certificate: movie.certificate || '',
      genres: movie.genres || [],
      languages: movie.languages || [],
      director: movie.director || '',
      cast: movie.cast?.join(', ') || '',
      poster: movie.poster || '',
      backdrop: movie.backdrop || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (movieId) => {
    if (!window.confirm('Are you sure you want to delete this movie?')) {
      return;
    }

    try {
      const response = await movieService.deleteMovie(movieId);
      if (response.success) {
        toast.success('Movie deleted successfully');
        fetchMovies();
      }
    } catch (error) {
      console.error('Error deleting movie:', error);
      toast.error('Failed to delete movie');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      duration: '',
      releaseDate: '',
      rating: '',
      certificate: '',
      genres: [],
      languages: [],
      director: '',
      cast: '',
      poster: '',
      backdrop: '',
    });
    setEditingMovie(null);
    setErrors({});
  };

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <Loader fullScreen message="Loading movies..." />;
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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Manage Movies</h1>
            <p className="text-gray-400">Add, edit, or remove movies from your catalog</p>
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
            Add New Movie
          </Button>
        </motion.div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies..."
              className="input-field pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          </div>
        </div>

        {/* Movies Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-card rounded-xl overflow-hidden"
        >
          {filteredMovies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-lighter">
                  <tr>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Movie</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Duration</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Rating</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Release Date</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovies.map((movie, index) => (
                    <motion.tr
                      key={movie._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-800 hover:bg-dark-lighter transition"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <img
                            src={movie.poster}
                            alt={movie.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                          <div>
                            <p className="text-white font-semibold">{movie.title}</p>
                            <p className="text-gray-500 text-sm">
                              {movie.genres?.slice(0, 2).join(', ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-300">{movie.duration} min</td>
                      <td className="py-4 px-6 text-yellow-500 font-semibold">{movie.rating}/10</td>
                      <td className="py-4 px-6 text-gray-300">
                        {new Date(movie.releaseDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(movie)}
                            className="p-2 bg-blue-500/20 text-blue-500 rounded hover:bg-blue-500/30 transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(movie._id)}
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
              <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No movies found</p>
            </div>
          )}
        </motion.div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-dark-card rounded-xl p-8 max-w-2xl w-full mb-8 mt-[300px]"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingMovie ? 'Edit Movie' : 'Add New Movie'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    error={errors.title}
                    required
                  />
                  <Input
                    label="Duration (minutes)"
                    name="duration"
                    type="number"
                    value={formData.duration}
                    onChange={handleInputChange}
                    error={errors.duration}
                    required
                  />
                  <Input
                    label="Rating"
                    name="rating"
                    type="number"
                    step="0.1"
                    max="10"
                    value={formData.rating}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Release Date"
                    name="releaseDate"
                    type="date"
                    value={formData.releaseDate}
                    onChange={handleInputChange}
                    error={errors.releaseDate}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Certificate</label>
                    <select
                      name="certificate"
                      value={formData.certificate}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="">Select Certificate</option>
                      {CERTIFICATES.map(cert => (
                        <option key={cert} value={cert}>{cert}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Director"
                    name="director"
                    value={formData.director}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="input-field"
                  />
                </div>

                <Input
                  label="Cast (comma separated)"
                  name="cast"
                  value={formData.cast}
                  onChange={handleInputChange}
                  placeholder="Actor 1, Actor 2, Actor 3"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Poster URL"
                    name="poster"
                    value={formData.poster}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Backdrop URL"
                    name="backdrop"
                    value={formData.backdrop}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Genres</label>
                    <div className="max-h-32 overflow-y-auto bg-dark-lighter rounded p-2">
                      {GENRES.map(genre => (
                        <label key={genre} className="flex items-center space-x-2 py-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.genres.includes(genre)}
                            onChange={() => handleMultiSelect('genres', genre)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-300">{genre}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Languages</label>
                    <div className="max-h-32 overflow-y-auto bg-dark-lighter rounded p-2">
                      {LANGUAGES.map(language => (
                        <label key={language} className="flex items-center space-x-2 py-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.languages.includes(language)}
                            onChange={() => handleMultiSelect('languages', language)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-300">{language}</span>
                        </label>
                      ))}
                    </div>
                  </div>
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
                    {editingMovie ? 'Update Movie' : 'Add Movie'}
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

export default ManageMovies;