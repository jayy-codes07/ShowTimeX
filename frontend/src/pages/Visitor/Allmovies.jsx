import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import MovieGrid from '../../components/Movie/MovieGrid'; // Ensure this matches your file structure
import { movieService } from '../../services/movieService'; // FIX 1: Added missing import
import toast from 'react-hot-toast'; // FIX 2: Added missing import
import Loader from '../../components/UI/Loader'; // Optional: Use your custom loader

const AllMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');

  useEffect(() => {
    fetchAllMovies();
  }, []);

  const fetchAllMovies = async () => {
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

  const availableGenres = useMemo(() => {
    const genresInMovies = new Set();

    movies.forEach((movie) => {
      movie.genres?.forEach((genre) => genresInMovies.add(genre));
    });

    return ['All', ...Array.from(genresInMovies).sort()];
  }, [movies]);

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchesSearch = movie.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesGenre =
        selectedGenre === 'All' || movie.genres?.includes(selectedGenre);

      return matchesSearch && matchesGenre;
    });
  }, [movies, searchTerm, selectedGenre]);

  if (loading) return <Loader fullScreen message="Fetching all movies..." />;

  return (
    <div className="min-h-screen bg-dark pt-20 sm:pt-24 pb-12 px-4">
      <div className="container-custom mx-auto">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white uppercase tracking-tighter">All Movies</h1>
          
          {/* Search Bar - Styled like your Figma header */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search movies..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 rounded-2xl border border-gray-800 bg-dark-card p-4 sm:p-5"
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-white">Filter by Category</h2>
            </div>
            <p className="text-sm text-gray-400">
              {filteredMovies.length} {filteredMovies.length === 1 ? 'movie' : 'movies'} found
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {availableGenres.map((genre) => {
              const isActive = selectedGenre === genre;

              return (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setSelectedGenre(genre)}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-700 bg-dark-lighter text-gray-300 hover:border-primary hover:text-white'
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Movies Grid */}
        {filteredMovies.length > 0 ? (
          <MovieGrid movies={filteredMovies} />
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              No movies found
              {searchTerm ? ` for "${searchTerm}"` : ''}
              {selectedGenre !== 'All' ? ` in ${selectedGenre}` : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllMovies;
