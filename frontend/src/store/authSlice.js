import { createSlice } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { STORAGE_KEYS } from '../utils/constants';

// Session persistence. The token and the user JSON stay in localStorage under
// the same keys as before, so existing sessions survive this change and the
// Axios 401 handler (which clears both and hard-redirects) keeps working.
const persist = (token, user) => {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

const clearPersisted = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
};

// Read synchronously at store creation, so there is no "loading" phase.
// A token without a user (e.g. right after a password reset) is kept so the
// Axios interceptor still sends it, but the UI stays logged out.
export const loadSession = () => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const userData = localStorage.getItem(STORAGE_KEYS.USER);
  let user = null;

  if (token && userData) {
    try {
      user = JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      clearPersisted();
      return { token: null, user: null, isAuthenticated: false };
    }
  }

  return { token: token || null, user, isAuthenticated: Boolean(token && user) };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: loadSession(),
  reducers: {
    credentialsSet(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    userUpdated(state, action) {
      state.user = action.payload;
    },
    loggedOut(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { credentialsSet, userUpdated, loggedOut } = authSlice.actions;

// Thunks return the same shapes AuthContext did, so Login/Register/Profile
// keep their existing logic: { success: true, user } or { success: false, message }.
export const login = (email, password) => async (dispatch) => {
  try {
    const response = await authService.login(email, password);

    if (response.success) {
      persist(response.token, response.user);
      dispatch(credentialsSet({ token: response.token, user: response.user }));
      toast.success('Login successful!');
      return { success: true, user: response.user };
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Login failed. Please try again.';
    toast.error(message);
    return { success: false, message };
  }
};

export const register = (userData) => async (dispatch) => {
  try {
    const response = await authService.register(userData);

    if (response.success) {
      persist(response.token, response.user);
      dispatch(credentialsSet({ token: response.token, user: response.user }));
      toast.success('Registration successful!');
      return { success: true, user: response.user };
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Registration failed. Please try again.';
    toast.error(message);
    return { success: false, message };
  }
};

export const logout = () => (dispatch) => {
  clearPersisted();
  dispatch(loggedOut());
  toast.success('Logged out successfully');
};

export const updateProfile = (updatedData) => async (dispatch, getState) => {
  try {
    const response = await authService.updateProfile(updatedData);

    if (response.success) {
      const updatedUser = { ...getState().auth.user, ...response.user };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      dispatch(userUpdated(updatedUser));
      toast.success('Profile updated successfully!');
      return { success: true };
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Update failed. Please try again.';
    toast.error(message);
    return { success: false, message };
  }
};

export const selectAuth = (state) => state.auth;
export const selectToken = (state) => state.auth.token;

export default authSlice.reducer;
