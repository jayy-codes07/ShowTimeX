const express = require('express');
const router = express.Router();
const {
  getAllShows,
  getShowById,
  getShowsByMovie,
  createShow,
  updateShow,
  deleteShow,
} = require('../controllers/showController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Public routes
router.get('/movie/:movieId', getShowsByMovie);
router.get('/:id', getShowById);
router.get('/', getAllShows);

// Protected routes - Admin only
router.post('/', protect, adminOnly, createShow);
router.put('/:id', protect, adminOnly, updateShow);
router.delete('/:id', protect, adminOnly, deleteShow);

module.exports = router;