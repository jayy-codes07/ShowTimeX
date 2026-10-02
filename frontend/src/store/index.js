import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import { setAuthTokenGetter } from '../services/api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// The Axios instance reads the token through this getter instead of importing
// the store, which keeps store -> authSlice -> authService -> api acyclic.
setAuthTokenGetter(() => store.getState().auth.token);

export default store;
