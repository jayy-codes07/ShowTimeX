import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Film, TrendingUp, Calendar } from 'lucide-react';
import MovieGrid from '../../components/Movie/MovieGrid';
import Loader from '../../components/UI/Loader';
import { movieService } from '../../services/movieService';
import toast from 'react-hot-toast';

const HomePage = () => {
  const [nowShowing, setNowShowing] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      
      // Fetch both now showing and coming soon movies
      const [nowShowingRes, comingSoonRes] = await Promise.all([
        movieService.getNowShowing(),
        movieService.getComingSoon(),
      ]);

      if (nowShowingRes.success) {
        setNowShowing(nowShowingRes.movies || []);
      }

      if (comingSoonRes.success) {
        setComingSoon(comingSoonRes.movies || []);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.error('Failed to load movies');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen message="Loading movies..." />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-[60vh] md:h-[70vh] bg-gradient-to-b from-dark-lighter to-dark overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920')] bg-cover bg-center opacity-20"></div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/50 to-transparent"></div>

        <div className="container-custom relative h-full flex items-center">
          <div className="max-w-2xl">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center space-x-2 mb-4">
                <Film className="w-8 h-8 text-primary" />
                <span className="text-primary font-semibold">Welcome to CineBook</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Book Your Favorite
                <span className="text-primary"> Movie Tickets</span>
                <br />
                Online
              </h1>
              
              <p className="text-lg text-gray-300 mb-8">
                Experience the magic of cinema with the best seats at unbeatable prices. 
                Browse movies, select showtimes, and book instantly.
              </p>

              <div className="flex flex-wrap gap-4">
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="#now-showing"
                  className="btn-primary inline-flex items-center space-x-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>Browse Movies</span>
                </motion.a>
                
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="#coming-soon"
                  className="btn-secondary inline-flex items-center space-x-2"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Coming Soon</span>
                </motion.a>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Now Showing Section */}
      <section id="now-showing" className="py-16 bg-dark">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center space-x-3 mb-8">
              <TrendingUp className="w-8 h-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold text-white">Now Showing</h2>
            </div>
            
            {nowShowing.length > 0 ? (
              <MovieGrid movies={nowShowing} />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No movies currently showing</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section id="coming-soon" className="py-16 bg-dark-lighter">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center space-x-3 mb-8">
              <Calendar className="w-8 h-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold text-white">Coming Soon</h2>
            </div>
            
            {comingSoon.length > 0 ? (
              <MovieGrid movies={comingSoon} />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No upcoming movies</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-dark">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <Film className="w-12 h-12" />,
                title: 'Wide Selection',
                description: 'Choose from hundreds of movies across all genres',
              },
              {
                icon: <TrendingUp className="w-12 h-12" />,
                title: 'Best Prices',
                description: 'Get the most competitive prices and exclusive deals',
              },
              {
                icon: <Calendar className="w-12 h-12" />,
                title: 'Easy Booking',
                description: 'Book your tickets in just a few clicks',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="card text-center"
              >
                <div className="text-primary mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;