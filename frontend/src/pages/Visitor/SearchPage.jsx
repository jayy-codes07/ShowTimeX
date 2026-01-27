import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import MovieGrid from '../../components/Movie/MovieGrid';
import Loader from '../../components/UI/Loader';
import { movieService } from '../../services/movieService';
import { GENRES, LANGUAGES } from '../../utils/constants';
import toast from 'react-hot-toast';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    genre: '',
    language: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      handleSearch(query);
    } else {
      fetchAllMovies();
    }
  }, [searchParams]);

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

  const handleSearch = async (query = searchQuery) => {
    try {
      setLoading(true);
      const response = await movieService.searchMovies(query, filters);
      
      if (response.success) {
        setMovies(response.movies || []);
      }
    } catch (error) {
      console.error('Error searching movies:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    handleSearch();
  };

  const clearFilters = () => {
    setFilters({ genre: '', language: '' });
    setSearchQuery('');
    setSearchParams({});
    fetchAllMovies();
  };

  return (
    <div className="min-h-screen bg-dark py-8">
      <div className="container-custom">
        {/* Search Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'All Movies'}
          </h1>

          {/* Search Bar */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder="Search for movies..."
                className="input-field pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
            
            <button
              onClick={() => handleSearch()}
              className="btn-primary"
            >
              Search
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-dark-card rounded-xl p-6 mb-4"
            >
              <h3 className="text-lg font-bold text-white mb-4">Filter Movies</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Genre Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Genre
                  </label>
                  <select
                    value={filters.genre}
                    onChange={(e) => handleFilterChange('genre', e.target.value)}
                    className="input-field"
                  >
                    <option value="">All Genres</option>
                    {GENRES.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Language Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    value={filters.language}
                    onChange={(e) => handleFilterChange('language', e.target.value)}
                    className="input-field"
                  >
                    <option value="">All Languages</option>
                    {LANGUAGES.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex items-end gap-2">
                  <button
                    onClick={applyFilters}
                    className="btn-primary flex-1"
                  >
                    Apply
                  </button>
                  <button
                    onClick={clearFilters}
                    className="btn-secondary flex-1"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results Count */}
          <p className="text-gray-400">
            {movies.length} {movies.length === 1 ? 'movie' : 'movies'} found
          </p>
        </motion.div>

        {/* Movies Grid */}
        {loading ? (
          <Loader message="Searching movies..." />
        ) : movies.length > 0 ? (
          <MovieGrid movies={movies} />
        ) : (
          <div className="text-center py-20">
            <Search className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No movies found</h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your search or filters
            </p>
            <button onClick={clearFilters} className="btn-primary">
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;