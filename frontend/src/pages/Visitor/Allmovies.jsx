import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import MovieCard from '../../components/Movie/MovieCard';
import { apiRequest } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';

const AllMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'now-showing', 'coming-soon'

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        // You might need to create this endpoint in your backend or use 'now-showing'
        // For now, let's assume you want to show 'Now Showing' movies by default
        const response = await apiRequest.get(API_ENDPOINTS.MOVIES_NOW_SHOWING); 
        
        if (response.success) {
          setMovies(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch movies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Filter logic
  const filteredMovies = movies.filter(movie => 
    movie.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-dark pt-24 pb-12 px-4">
      <div className="container-custom mx-auto">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4"
        >
          <h1 className="text-3xl font-bold text-white">All Movies</h1>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search movies..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-card border border-gray-700 text-white rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-primary transition"
            />
          </div>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Movies Grid */}
            {filteredMovies.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              >
                {filteredMovies.map((movie, index) => (
                  <MovieCard key={movie._id} movie={movie} index={index} />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">There are no movies</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AllMovies;