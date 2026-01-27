const express = require('express');
const router = express.Router();
const { verifyPayment } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// Payment routes
router.post('/verify', protect, verifyPayment);

module.exports = router;