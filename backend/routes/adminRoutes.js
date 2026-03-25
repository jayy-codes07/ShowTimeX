const express = require('express');
const router = express.Router();

const {
  getAllBookings,
  getAdminStats,
  getAdminReports,
  getAdminUserInsights,
  initiateBookingRefund,
  resendBookingTicket,
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
router.patch('/bookings/:id/refund', initiateBookingRefund);
router.post('/bookings/:id/resend-ticket', resendBookingTicket);

module.exports = router;