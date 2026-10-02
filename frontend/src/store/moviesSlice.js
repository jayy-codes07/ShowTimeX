import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { movieService } from '../services/movieService';

// Public catalogue lists shared across pages. Each list keeps its own status
// so a page can show cached items while a refresh is in flight.
const listState = () => ({ items: [], status: 'idle', error: null });

export const fetchNowShowing = createAsyncThunk('movies/fetchNowShowing', async () => {
  const response = await movieService.getNowShowing();
  if (!response?.success) throw new Error(response?.message || 'Failed to load movies');
  return response.movies || [];
});

export const fetchComingSoon = createAsyncThunk('movies/fetchComingSoon', async () => {
  const response = await movieService.getComingSoon();
  if (!response?.success) throw new Error(response?.message || 'Failed to load movies');
  return response.movies || [];
});

const addListCases = (builder, thunk, key) => {
  builder
    .addCase(thunk.pending, (state) => {
      state[key].status = 'loading';
      state[key].error = null;
    })
    .addCase(thunk.fulfilled, (state, action) => {
      state[key].status = 'succeeded';
      state[key].items = action.payload;
    })
    .addCase(thunk.rejected, (state, action) => {
      state[key].status = 'failed';
      state[key].error = action.error?.message || 'Failed to load movies';
    });
};

const moviesSlice = createSlice({
  name: 'movies',
  initialState: {
    nowShowing: listState(),
    comingSoon: listState(),
  },
  reducers: {},
  extraReducers: (builder) => {
    addListCases(builder, fetchNowShowing, 'nowShowing');
    addListCases(builder, fetchComingSoon, 'comingSoon');
  },
});

export const selectMovies = (state) => state.movies;

export default moviesSlice.reducer;
