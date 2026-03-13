import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, Calendar } from 'lucide-react';
import { formatDuration } from '../../utils/formatDate';
import { IMAGE_PLACEHOLDER } from '../../utils/constants';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/movie/${movie._id}`);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="movie-card bg-dark-card group w-full max-w-[17rem] mx-auto"
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] overflow-hidden rounded-t-xl bg-black/40">
        <img
          src={movie.poster || IMAGE_PLACEHOLDER}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-125 object-cover object-center opacity-70 blur-xl saturate-125"
        />
        <div className="absolute inset-0 bg-black/15" />
        <img
          src={movie.poster || IMAGE_PLACEHOLDER}
          alt={movie.title}
          className="relative z-10 h-full w-full object-contain object-center"
          onError={(e) => {
            e.target.src = IMAGE_PLACEHOLDER;
          }}
        />
        
        {/* Rating Badge */}
        {movie.rating && (
          <div className="absolute top-3 right-3 z-20 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white font-semibold text-sm">{movie.rating}</span>
          </div>
        )}

        {/* Certificate Badge */}
        {movie.certificate && (
          <div className="absolute top-3 left-3 z-20 bg-primary px-2 py-1 rounded text-white text-xs font-bold">
            {movie.certificate}
          </div>
        )}

        {/* Overlay */}
        <div className="movie-card-overlay z-20">
          <div className="absolute bottom-4 left-4 right-4">
            <button className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2 rounded-lg transition">
              Book Now
            </button>
          </div>
        </div>
      </div>

      {/* Movie Info */}
      <div className="p-4">
        <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">
          {movie.title}
        </h3>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {movie.genres?.slice(0, 2).map((genre, index) => (
            <span
              key={index}
              className="text-xs bg-dark-lighter px-2 py-1 rounded text-gray-400"
            >
              {genre}
            </span>
          ))}
        </div>

        <div className="space-y-2 text-sm text-gray-400">
          {movie.duration && (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(movie.duration)}</span>
            </div>
          )}
          
          {movie.releaseDate && (
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(movie.releaseDate).getFullYear()}</span>
            </div>
          )}
        </div>

        {/* Languages */}
        {movie.languages && movie.languages.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              {movie.languages.join(', ')}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MovieCard;
