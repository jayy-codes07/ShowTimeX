import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Film, TrendingUp, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MovieGrid from '../../components/Movie/MovieGrid';
import Loader from '../../components/UI/Loader';
import { movieService } from '../../services/movieService';
import toast from 'react-hot-toast';

const HomePage = () => {
  const navigate = useNavigate();
  const [nowShowing, setNowShowing] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [heroMovie, setHeroMovie] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const featuredMovies = useMemo(() => nowShowing.slice(0, 5), [nowShowing]);

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
        if (movies.length > 0) {
          setHeroMovie(movies[0]);
          setCurrentIndex(0);
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
    if (featuredMovies.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex === featuredMovies.length - 1 ? 0 : prevIndex + 1;
        setHeroMovie(featuredMovies[nextIndex]);
        return nextIndex;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [featuredMovies]);

  const handleHeroSelect = (index) => {
    const selectedMovie = featuredMovies[index];
    if (!selectedMovie) {
      return;
    }

    setCurrentIndex(index);
    setHeroMovie(selectedMovie);
  };

  if (loading) {
    return <Loader fullScreen message="Loading movies..." />;
  }

  return (
    <div className="min-h-screen bg-dark">
      {heroMovie ? (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative w-full min-h-[72svh] md:min-h-[640px] overflow-hidden text-white"
        >
          <img
            src={
              heroMovie?.backdrop ||
              heroMovie?.poster ||
              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920'
            }
            alt={heroMovie?.title || 'Featured movie'}
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/15" />

          <div className="container-custom relative z-10 flex min-h-[585px] md:min-h-[585px] items-end py-10 sm:py-14 md:py-16">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-3xl pr-0 md:pr-16"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-200 backdrop-blur-sm">
                <span className="rounded-sm bg-yellow-500 px-1.5 py-0.5 font-bold text-black">IMDb</span>
                <span>{heroMovie?.rating ? `${heroMovie.rating} / 10` : '8.6 / 10'}</span>
              </div>

              <h1 className="home-hero-title mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                {heroMovie?.title}
              </h1>

              <p className="mt-4 max-w-2xl text-sm sm:text-base leading-6 text-gray-200 line-clamp-5 sm:line-clamp-4">
                {heroMovie?.description}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => heroMovie?._id && navigate(`/movie/${heroMovie._id}`)}
                  className="btn-primary inline-flex items-center justify-center space-x-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>View Movie</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() =>
                    heroMovie?._id && navigate(`/movie/${heroMovie._id}#showtimes`)
                  }
                  className="btn-secondary inline-flex items-center justify-center space-x-2"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Book Tickets</span>
                </motion.button>
              </div>
            </motion.div>
          </div>

          <div className="absolute bottom-5 left-4 right-4 z-10 flex items-center justify-center gap-3 text-xs font-bold text-[#9CA3AF] md:bottom-10 md:left-auto md:right-10 md:top-1/2 md:-translate-y-1/2 md:flex-col md:items-end">
            {featuredMovies.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleHeroSelect(idx)}
                className="flex items-center gap-2 rounded-full px-2 py-1 transition hover:text-white"
                aria-label={`Show featured movie ${idx + 1}`}
              >
                {currentIndex === idx && <div className="h-[3px] w-4 md:w-5 rounded-md bg-white" />}
                <span className={currentIndex === idx ? 'home-hero-contrast text-[16px]' : ''}>
                  {idx + 1}
                </span>
              </button>
            ))}
          </div>
        </motion.section>
      ) : (
        <div className="flex min-h-[72svh] md:min-h-[640px] items-center justify-center bg-dark px-4 text-center text-white">
          No Movies Available to Feature
        </div>
      )}

      <section id="now-showing" className="bg-dark py-16 scroll-mt-24 sm:scroll-mt-28">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-8 flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold text-white">Now Showing</h2>
            </div>

            {nowShowing.length > 0 ? (
              <MovieGrid movies={nowShowing} />
            ) : (
              <div className="py-12 text-center">
                <p className="text-lg text-gray-400">No movies currently showing</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section id="coming-soon" className="bg-dark-lighter py-16 scroll-mt-24 sm:scroll-mt-28">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-8 flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold text-white">Coming Soon</h2>
            </div>

            {comingSoon.length > 0 ? (
              <MovieGrid movies={comingSoon} />
            ) : (
              <div className="py-12 text-center">
                <p className="text-lg text-gray-400">No upcoming movies</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="bg-dark py-16">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8"
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
              <motion.div key={index} whileHover={{ scale: 1.03 }} className="card text-center">
                <div className="mb-4 flex justify-center text-primary">{feature.icon}</div>
                <h3 className="mb-2 text-xl font-bold text-white">{feature.title}</h3>
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
