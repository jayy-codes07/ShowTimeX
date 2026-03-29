import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, Calendar, Ticket } from 'lucide-react';
import { formatDuration } from '../../utils/formatDate';
import { IMAGE_PLACEHOLDER } from '../../utils/constants';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const movieLanguages = movie.languages && movie.languages.length > 0 ? movie.languages : ['N/A'];
  const visibleLanguages = movieLanguages.slice(0, 2);
  const extraLanguageCount = Math.max(movieLanguages.length - visibleLanguages.length, 0);

  const handleClick = () => {
    navigate(`/movie/${movie._id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="movie-card-shell bg-dark-card group w-full max-w-[17rem] mx-auto rounded-2xl border border-gray-800 transition-all duration-200 hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-col h-full"
    >
      {/* Poster Image Area */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-black/40">
        <img
          src={movie.poster || IMAGE_PLACEHOLDER}
          alt={movie.title}
          className="absolute inset-0 h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          onError={(e) => {
            e.target.src = IMAGE_PLACEHOLDER;
          }}
        />
        
        {/* Rating Badge */}
        {movie.rating && (
          <div className="absolute top-3 right-3 z-20 bg-black/70 px-2.5 py-1 rounded-full flex items-center space-x-1 border border-white/10 shadow-lg">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-white font-bold text-[11px] leading-none mt-0.5">{movie.rating}</span>
          </div>
        )}

        {/* Certificate Badge */}
        {movie.certificate && (
          <div
            className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full text-white text-[10px] font-extrabold uppercase tracking-wide shadow-lg border border-white/20 leading-none flex items-center justify-center"
            style={{ backgroundColor: 'var(--app-accent)' }}
          >
            {movie.certificate}
          </div>
        )}

        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex items-center justify-center">
          <div className="transform translate-y-3 group-hover:translate-y-0 transition-transform duration-200 ease-out">
            <button
              className="text-white font-bold py-2.5 px-5 rounded-full shadow-[0_8px_20px_var(--app-accent-soft-strong)] flex items-center justify-center gap-2 border border-white/10 transition-colors duration-200"
              style={{ backgroundColor: 'var(--app-accent)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--app-accent-strong)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--app-accent)';
              }}
            >
              <Ticket className="w-4 h-4" />
              Book Tickets
            </button>
          </div>
        </div>
      </div>

      {/* Details Area */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="movie-card-title text-white font-extrabold text-[16px] mb-2 line-clamp-1 transition-colors duration-200">
          {movie.title}
        </h3>
        
        <div className="flex flex-wrap gap-1.5 mb-3">
          {visibleLanguages.map((language, index) => (
            <span
              key={index}
              className="text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-gray-300 px-2 py-0.5 rounded-md border border-gray-700/50"
            >
              {language}
            </span>
          ))}
          {extraLanguageCount > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-gray-300 px-2 py-0.5 rounded-md border border-gray-700/50">
              +{extraLanguageCount}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between text-xs text-gray-400 font-medium pt-3 border-t border-gray-800/60 w-full">
          {movie.duration ? (
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{formatDuration(movie.duration)}</span>
            </div>
          ) : <span />}
          
          {movie.releaseDate ? (
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>{new Date(movie.releaseDate).getFullYear()}</span>
            </div>
          ) : <span />}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
