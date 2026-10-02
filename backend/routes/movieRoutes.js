const express = require('express');
const router = express.Router();
const {
  getAllMovies, getMovieById, getNowShowing,
  getComingSoon, searchMovies, createMovie,
  updateMovie, deleteMovie,
} = require('../controllers/movieController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { cacheMiddleware } = require('../utils/cache');

// Public list responses are cached (read-through, optional Redis). getMovieById
// is not a list and is left uncached.
const cached = cacheMiddleware('movies');

// Public routes
router.get('/search', cached, searchMovies);
router.get('/now-showing', cached, getNowShowing);
router.get('/coming-soon', cached, getComingSoon);
router.get('/', cached, getAllMovies);
router.get('/:id', getMovieById);

// Protected routes - Admin only
// Posters and backdrops are URLs only (TMDB lookup or pasted link); there is
// no file upload.
router.post('/', protect, adminOnly, createMovie);

router.put('/:id', protect, adminOnly, updateMovie);

router.delete('/:id', protect, adminOnly, deleteMovie);

module.exports = router;