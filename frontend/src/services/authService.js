import { apiRequest } from './api';
import { API_ENDPOINTS } from '../utils/constants';

export const authService = {
  // Login user
  login: async (email, password) => {
    const response = await apiRequest.post(API_ENDPOINTS.LOGIN, {
      email,
      password,
    });
    return response;
  },

  // Register new user
  register: async (userData) => {
    const response = await apiRequest.post(API_ENDPOINTS.REGISTER, userData);
    return response;
  },

  // Get user profile
  getProfile: async () => {
    const response = await apiRequest.get(API_ENDPOINTS.PROFILE);
    return response;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await apiRequest.put(API_ENDPOINTS.UPDATE_PROFILE, userData);
    return response;
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