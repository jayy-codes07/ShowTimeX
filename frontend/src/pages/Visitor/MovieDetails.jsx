import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, Calendar, Globe, Film as FilmIcon } from 'lucide-react';
import ShowtimeList from '../../components/Movie/ShowtimeList';
import Loader from '../../components/UI/Loader';
import { movieService } from '../../services/movieService';
import { formatDuration, formatDate, getNextDays } from '../../utils/formatDate';
import { IMAGE_PLACEHOLDER } from '../../utils/constants';
import toast from 'react-hot-toast';

const MovieDetails = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showsLoading, setShowsLoading] = useState(false);

  const dates = getNextDays(7);

  useEffect(() => {
    fetchMovieDetails();
  }, [id]);

  useEffect(() => {
    if (movie) {
      fetchShows();
    }
  }, [selectedDate, movie]);

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      const response = await movieService.getMovieById(id);
      
      if (response.success) {
        setMovie(response.movie);
      }
    } catch (error) {
      console.error('Error fetching movie:', error);
      toast.error('Failed to load movie details');
    } finally {
      setLoading(false);
    }
  };

  const fetchShows = async () => {
    try {
      setShowsLoading(true);

      // 🟢 THE FIX: Manually build the date string so it doesn't shift backward
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      
      // This creates a clean "2026-02-20" string based on your local time
      const localDateString = `${year}-${month}-${day}`;

      console.log(`Asking backend for date: ${localDateString}`);

      const response = await movieService.getShowsByMovie(id, localDateString);
      
      if (response.success) {
        setShows(response.shows || []);
      }
    } catch (error) {
      console.error('Error fetching shows:', error);
      setShows([]);
    } finally {
      setShowsLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen message="Loading movie details..." />;
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-lg">Movie not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero Section with Backdrop */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${movie.backdrop || movie.poster || IMAGE_PLACEHOLDER})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/80 to-dark/30"></div>
        </div>

        <div className="container-custom relative h-full flex items-end pb-8">
          <div className="flex flex-col md:flex-row gap-6 w-full">
            {/* Poster */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-shrink-0"
            >
              <img
                src={movie.poster || IMAGE_PLACEHOLDER}
                alt={movie.title}
                className="w-48 md:w-64 rounded-xl shadow-2xl"
                onError={(e) => {
                  e.target.src = IMAGE_PLACEHOLDER;
                }}
              />
            </motion.div>

            {/* Movie Info */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-grow"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {movie.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                {movie.rating && (
                  <div className="flex items-center space-x-1 bg-yellow-500/20 px-3 py-1 rounded-lg">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-bold">{movie.rating}/10</span>
                  </div>
                )}

                {movie.certificate && (
                  <div className="bg-primary px-3 py-1 rounded-lg">
                    <span className="text-white font-bold">{movie.certificate}</span>
                  </div>
                )}

                {movie.duration && (
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Clock className="w-5 h-5" />
                    <span>{formatDuration(movie.duration)}</span>
                  </div>
                )}

                {movie.releaseDate && (
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Calendar className="w-5 h-5" />
                    <span>{new Date(movie.releaseDate).getFullYear()}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {movie.genres?.map((genre, index) => (
                  <span
                    key={index}
                    className="bg-dark-card px-3 py-1 rounded-lg text-gray-300 text-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {movie.languages && (
                <div className="flex items-center space-x-2 text-gray-400 mb-4">
                  <Globe className="w-5 h-5" />
                  <span>{movie.languages.join(', ')}</span>
                </div>
              )}

              {movie.description && (
                <p className="text-gray-300 max-w-3xl line-clamp-3">
                  {movie.description}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Movie Details Section */}
      <div className="container-custom py-8">
        {/* Synopsis */}
        {movie.description && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Synopsis</h2>
            <p className="text-gray-400 leading-relaxed">{movie.description}</p>
          </motion.section>
        )}

        {/* Cast & Crew */}
        {(movie.cast || movie.director) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Cast & Crew</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {movie.director && (
                <div>
                  <p className="text-gray-500 text-sm">Director</p>
                  <p className="text-white">{movie.director}</p>
                </div>
              )}
              {movie.cast && movie.cast.length > 0 && (
                <div>
                  <p className="text-gray-500 text-sm">Cast</p>
                  <p className="text-white">{movie.cast.join(', ')}</p>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* Showtimes */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">Select Date & Time</h2>

          {/* Date Selector */}
          <div className="flex gap-3 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            {dates.map((date, index) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNumber = date.getDate();
              const monthName = date.toLocaleDateString('en-US', { month: 'short' });

              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 p-4 rounded-lg border-2 transition-all min-w-[80px] ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-700 bg-dark-card hover:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <p className={`text-sm ${isSelected ? 'text-primary' : 'text-gray-500'}`}>
                      {dayName}
                    </p>
                    <p className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                      {dayNumber}
                    </p>
                    <p className={`text-xs ${isSelected ? 'text-primary' : 'text-gray-500'}`}>
                      {monthName}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Shows List */}
          {showsLoading ? (
            <Loader message="Loading showtimes..." />
          ) : (
            <ShowtimeList shows={shows} movie={movie} />
          )}
        </motion.section>
      </div>
    </div>
  );
};

export default MovieDetails;