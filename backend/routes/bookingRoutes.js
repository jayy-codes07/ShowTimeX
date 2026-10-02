const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  getAdminStats,
  getAdminReports,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Protected routes - Customer
router.post('/create',protect, createBooking);
router.get('/user', protect, getUserBookings);
router.get('/:id', protect, getBookingById);
router.delete('/:id/cancel', protect, cancelBooking);

// Protected routes - Admin only
router.get('/', protect, adminOnly, getAllBookings);

module.exports = router;