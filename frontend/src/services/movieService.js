import { apiRequest } from './api';
import { API_ENDPOINTS } from '../utils/constants';

export const movieService = {
  // Get all movies
  getAllMovies: async (params = {}) => {
    const response = await apiRequest.get(API_ENDPOINTS.MOVIES, { params });
    return response;
  },

  // Get movie by ID
  getMovieById: async (id) => {
    const response = await apiRequest.get(API_ENDPOINTS.MOVIE_BY_ID(id));
    return response;
  },

  // Search movies
  searchMovies: async (query, filters = {}) => {
    const response = await apiRequest.get(API_ENDPOINTS.SEARCH_MOVIES, {
      params: { query, ...filters },
    });
    return response;
  },

  // Get now showing movies
  getNowShowing: async () => {
    const response = await apiRequest.get(API_ENDPOINTS.NOW_SHOWING);
    return response;
  },

  // Get coming soon movies
  getComingSoon: async () => {
    const response = await apiRequest.get(API_ENDPOINTS.COMING_SOON);
    return response;
  },

  // Get shows for a movie
  getShowsByMovie: async (movieId, date = null) => {
    const params = date ? { date } : {};
    const response = await apiRequest.get(API_ENDPOINTS.SHOWS_BY_MOVIE(movieId), { params });
    return response;
  },

  // Admin: Create movie
  createMovie: async (movieData) => {
    const response = await apiRequest.post(API_ENDPOINTS.MOVIES, movieData);
    return response;
  },

  // Admin: Update movie
  updateMovie: async (id, movieData) => {
    const response = await apiRequest.put(API_ENDPOINTS.MOVIE_BY_ID(id), movieData);
    return response;
  },

  // Admin: Delete movie
  deleteMovie: async (id) => {
    const response = await apiRequest.delete(API_ENDPOINTS.MOVIE_BY_ID(id));
    return response;
  },
};