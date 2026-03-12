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

// Public routes
router.get('/movie/:movieId', optionalAuth, getShowsByMovie);
router.get('/:id', optionalAuth, getShowById);
router.get('/', optionalAuth, getAllShows);

// Protected routes - Admin only
router.post('/', protect, adminOnly, createShow);
router.put('/:id', protect, adminOnly, updateShow);
router.delete('/:id', protect, adminOnly, deleteShow);

// Protected routes - Seat locks
router.post('/:id/lock', protect, lockSeats);
router.post('/:id/unlock', protect, unlockSeats);

module.exports = router;
