const express = require('express');
const router = express.Router();

const {
  getAllBookings,
  getAdminStats,
  getAdminReports,
  getAdminUserInsights,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// All routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// Admin routes
router.get('/stats', getAdminStats);
router.get('/reports', getAdminReports);
router.get('/bookings', getAllBookings);
router.get('/users', getAdminUserInsights);

module.exports = router;