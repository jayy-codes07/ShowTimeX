import { apiRequest } from './api';
import { API_ENDPOINTS } from '../utils/constants';

export const authService = {
  // Login user
  login: async (email, password) => {
    try {
      const response = await apiRequest.post(API_ENDPOINTS.LOGIN, {
        email,
        password,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await apiRequest.post(API_ENDPOINTS.REGISTER, userData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await apiRequest.get(API_ENDPOINTS.PROFILE);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await apiRequest.put(API_ENDPOINTS.UPDATE_PROFILE, userData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Verify token validity
  verifyToken: async () => {
    try {
      const response = await apiRequest.get(API_ENDPOINTS.PROFILE);
      return response;
    } catch (error) {
      return null;
    }
  },
};