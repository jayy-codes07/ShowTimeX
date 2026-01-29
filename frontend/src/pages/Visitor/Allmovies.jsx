import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import MovieGrid from '../../components/Movie/MovieGrid'; // Ensure this matches your file structure
import { movieService } from '../../services/movieService'; // FIX 1: Added missing import
import toast from 'react-hot-toast'; // FIX 2: Added missing import
import Loader from '../../components/UI/Loader'; // Optional: Use your custom loader

const AllMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAllMovies();
  }, []);

  const fetchAllMovies = async () => {
    try {
      setLoading(true);
      // Using the service you already used in HomePage
      const response = await movieService.getNowShowing(); 
      
      if (response.success) {
        // Accessing the 'movies' array from your MongoDB response
        setMovies(response.movies || []);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.error('Failed to load movies');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter logic for search
  const filteredMovies = movies.filter(movie => 
    movie.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  if (loading) return <Loader fullScreen message="Fetching all movies..." />;

  return (
    <div className="min-h-screen bg-dark pt-24 pb-12 px-4">
      <div className="container-custom mx-auto">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4"
        >
          <h1 className="text-3xl font-bold text-white uppercase tracking-tighter">All Movies</h1>
          
          {/* Search Bar - Styled like your Figma header */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search movies..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border border-gray-700 text-white rounded-md py-2 pl-10 pr-4 focus:outline-none focus:border-[#BE123C] transition"
            />
          </div>
        </motion.div>

        {/* Movies Grid */}
        {filteredMovies.length > 0 ? (
          <MovieGrid movies={filteredMovies} />
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No movies found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllMovies;