const express = require('express');
const router = express.Router();
const {
  getAllShows,
  getShowById,
  getShowsByMovie,
  createShow,
  updateShow,
  deleteShow,
  lockSeats,
  unlockSeats,
} = require('../controllers/showController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { optionalAuth } = require('../middleware/optionalAuth');
const { cacheMiddleware } = require('../utils/cache');

// Show lists include the caller's own held seats when a token is present, so
// they are cached for anonymous requests only. GET /:id feeds the seat map and
// is never cached.
const cached = cacheMiddleware('shows', { bypassWhenAuthorized: true });

// Public routes
router.get('/movie/:movieId', cached, optionalAuth, getShowsByMovie);
router.get('/:id', optionalAuth, getShowById);
router.get('/', cached, optionalAuth, getAllShows);

// Protected routes - Admin only
router.post('/', protect, adminOnly, createShow);
router.put('/:id', protect, adminOnly, updateShow);
router.delete('/:id', protect, adminOnly, deleteShow);

// Protected routes - Seat locks
router.post('/:id/lock', protect, lockSeats);
router.post('/:id/unlock', protect, unlockSeats);

module.exports = router;
