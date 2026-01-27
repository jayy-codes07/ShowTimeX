import { apiRequest } from './api';
import { API_ENDPOINTS } from '../utils/constants';

export const movieService = {
  // Get all movies
  getAllMovies: async (params = {}) => {
    try {
      const response = await apiRequest.get(API_ENDPOINTS.MOVIES, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get movie by ID
  getMovieById: async (id) => {
    try {
      const response = await apiRequest.get(API_ENDPOINTS.MOVIE_BY_ID(id));
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Search movies
  searchMovies: async (query, filters = {}) => {
    try {
      const response = await apiRequest.get(API_ENDPOINTS.SEARCH_MOVIES, {
        params: { query, ...filters },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get now showing movies
  getNowShowing: async () => {
    try {
      const response = await apiRequest.get(API_ENDPOINTS.NOW_SHOWING);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get coming soon movies
  getComingSoon: async () => {
    try {
      const response = await apiRequest.get(API_ENDPOINTS.COMING_SOON);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get shows for a movie
  getShowsByMovie: async (movieId, date = null) => {
    try {
      const params = date ? { date } : {};
      const response = await apiRequest.get(API_ENDPOINTS.SHOWS_BY_MOVIE(movieId), { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Create movie
  createMovie: async (movieData) => {
    try {
      const response = await apiRequest.post(API_ENDPOINTS.MOVIES, movieData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Update movie
  updateMovie: async (id, movieData) => {
    try {
      const response = await apiRequest.put(API_ENDPOINTS.MOVIE_BY_ID(id), movieData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Delete movie
  deleteMovie: async (id) => {
    try {
      const response = await apiRequest.delete(API_ENDPOINTS.MOVIE_BY_ID(id));
      return response;
    } catch (error) {
      throw error;
    }
  },
};