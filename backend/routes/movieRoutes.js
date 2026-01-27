const express = require('express');
const router = express.Router();
const {
  getAllMovies,
  getMovieById,
  getNowShowing,
  getComingSoon,
  searchMovies,
  createMovie,
  updateMovie,
  deleteMovie,
} = require('../controllers/movieController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Public routes
router.get('/search', searchMovies);
router.get('/now-showing', getNowShowing);
router.get('/coming-soon', getComingSoon);
router.get('/', getAllMovies);
router.get('/:id', getMovieById);

// Protected routes - Admin only
router.post('/', protect, adminOnly, createMovie);
router.put('/:id', protect, adminOnly, updateMovie);
router.delete('/:id', protect, adminOnly, deleteMovie);

module.exports = router;