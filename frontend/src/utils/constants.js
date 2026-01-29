// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://showtimex.onrender.com/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/auth/profile',
  UPDATE_PROFILE: '/auth/update-profile',

  // Movies
  MOVIES: '/movies',
  MOVIE_BY_ID: (id) => `/movies/${id}`,
  SEARCH_MOVIES: '/movies/search',
  NOW_SHOWING: '/movies/now-showing',
  COMING_SOON: '/movies/coming-soon',

  // Shows
  SHOWS: '/shows',
  SHOW_BY_ID: (id) => `/shows/${id}`,
  SHOWS_BY_MOVIE: (movieId) => `/shows/movie/${movieId}`,

  // Bookings
  BOOKINGS: '/bookings',
  BOOKING_BY_ID: (id) => `/bookings/${id}`,
  USER_BOOKINGS: '/bookings/user',
  CREATE_BOOKING: '/bookings/create',
  CANCEL_BOOKING: (id) => `/bookings/${id}/cancel`,

  // Payments
  CREATE_PAYMENT: '/payments/create',
  VERIFY_PAYMENT: '/payments/verify',

  // Admin
  ADMIN_STATS: '/admin/stats',
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_REPORTS: '/admin/reports',
};

// Seat Configuration
export const SEAT_CONFIG = {
  ROWS: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  SEATS_PER_ROW: 12,
  MAX_SEATS_PER_BOOKING: 10,
};

// Seat Status
export const SEAT_STATUS = {
  AVAILABLE: 'available',
  SELECTED: 'selected',
  BOOKED: 'booked',
};

// Movie Genres
export const GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'War',
];

// Languages
export const LANGUAGES = [
  'English',
  'Hindi',
  'Tamil',
  'Telugu',
  'Malayalam',
  'Kannada',
  'Bengali',
  'Marathi',
];

// Movie Formats
export const FORMATS = ['2D', '3D', 'IMAX', '4DX'];

// Certificate Ratings
export const CERTIFICATES = ['U', 'UA', 'A', 'S'];

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

// Payment Methods
export const PAYMENT_METHODS = {
  RAZORPAY: 'razorpay',
  STRIPE: 'stripe',
  WALLET: 'wallet',
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
};

// Time Slots
export const TIME_SLOTS = [
  '09:00 AM',
  '12:30 PM',
  '03:45 PM',
  '06:30 PM',
  '09:45 PM',
];

// Price Configuration
export const PRICE_CONFIG = {
  CONVENIENCE_FEE_PERCENT: 5,
  TAX_PERCENT: 18,
  BASE_PRICE: 200,
  PREMIUM_PRICE: 300,
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD MMM YYYY',
  API: 'YYYY-MM-DD',
  FULL: 'DD MMMM YYYY, hh:mm A',
};

// Pagination
export const PAGINATION = {
  MOVIES_PER_PAGE: 12,
  BOOKINGS_PER_PAGE: 10,
  SHOWS_PER_PAGE: 20,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  BOOKING_DRAFT: 'booking_draft',
};

// Razorpay Configuration (for frontend)
export const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_your_key_here';

// Image Placeholder
export const IMAGE_PLACEHOLDER = 'https://via.placeholder.com/300x450?text=Movie+Poster';

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  SEAT_CONFIG,
  SEAT_STATUS,
  GENRES,
  LANGUAGES,
  FORMATS,
  CERTIFICATES,
  BOOKING_STATUS,
  PAYMENT_METHODS,
  USER_ROLES,
  TIME_SLOTS,
  PRICE_CONFIG,
  DATE_FORMATS,
  PAGINATION,
  STORAGE_KEYS,
  RAZORPAY_KEY,
  IMAGE_PLACEHOLDER,
};