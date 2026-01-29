import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
// Added missing icon imports here
import { Film, TrendingUp, Calendar, Search, Menu, PlayCircle } from 'lucide-react';
import MovieGrid from '../../components/Movie/MovieGrid';
import Loader from '../../components/UI/Loader';
import { movieService } from '../../services/movieService';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import AllMovies from './Allmovies';

const HomePage = () => {
  const [nowShowing, setNowShowing] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [heroMovie, setHeroMovie] = useState(null); // Added this state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      
      const [nowShowingRes, comingSoonRes] = await Promise.all([
        movieService.getNowShowing(),
        movieService.getComingSoon(),
      ]);

      if (nowShowingRes.success) {
        const movies = nowShowingRes.movies || [];
        setNowShowing(movies);
        // Set the first movie from your MongoDB as the hero movie
        if (movies.length > 0) {
          setHeroMovie(movies[0]);
        }
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
  useEffect(() => {
    if (nowShowing.length === 0) return;

    // Change movie every 5 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex === nowShowing.length - 1 ? 0 : prevIndex + 1;
        setHeroMovie(nowShowing[nextIndex]);
        return nextIndex;
      });
    }, 10000); 

    return () => clearInterval(interval); // Cleanup timer on unmount
  }, [nowShowing]);

  // Keep the loader here to ensure data is ready before rendering the hero
  if (loading) {
    return <Loader fullScreen message="Loading movies..." />;
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero Section */}
      {heroMovie ? (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative  w-full h-[600px] text-white overflow-hidden bg-cover bg-center "
          style={{
            backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${heroMovie?.backdrop || heroMovie?.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920'})`,
          }}
        >
          
          

          {/* Description Box */}
          <div className="absolute top-[158px] left-[98px] w-[40%] z-10">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-[48px] font-bold leading-[56px] mb-4">
                {heroMovie?.title}
              </h1>

              <div className="flex items-center gap-8 mb-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="bg-yellow-500 text-black px-1 font-bold rounded-sm">IMDb</span>
                  <span>{heroMovie?.rating ? `${heroMovie.rating} / 10` : "8.6 / 10"}</span>
                </div>
                
              </div>

              <p className="text-[14px] font-medium leading-[18px] w-full text-gray-200 mb-6">
                {heroMovie?.description}
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

          {/* Pagination */}
          <div className="absolute right-[36px] top-[245px] flex flex-col items-end gap-[10px] z-10 text-[12px] font-bold text-[#9CA3AF]">
            {nowShowing.slice(0, 5).map((_, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {currentIndex === idx && <div className="w-5 h-[3px] bg-white rounded-md"></div>}
                <span className={currentIndex === idx ? "text-white text-[16px]" : ""}>
                  {idx + 1}
                </span>
              </div>
            ))}
          </div>
          
        </motion.section>
      ) : (
        <div className="h-[600px] flex items-center justify-center bg-dark text-white">
           No Movies Available to Feature
        </div>
      )}

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