import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectAuth,
  login as loginThunk,
  register as registerThunk,
  logout as logoutThunk,
  updateProfile as updateProfileThunk,
} from '../store/authSlice';

// Same surface AuthContext's useAuth() exposed, backed by the Redux auth slice.
// `loading` is always false: the session is read synchronously at store creation.
export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(selectAuth);

  const login = useCallback((email, password) => dispatch(loginThunk(email, password)), [dispatch]);
  const register = useCallback((userData) => dispatch(registerThunk(userData)), [dispatch]);
  const logout = useCallback(() => dispatch(logoutThunk()), [dispatch]);
  const updateProfile = useCallback((data) => dispatch(updateProfileThunk(data)), [dispatch]);

  return { user, isAuthenticated, loading: false, login, register, logout, updateProfile };
};

export default useAuth;
