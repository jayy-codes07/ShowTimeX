const express = require('express');
const router = express.Router();
const { verifyPayment,createRazorpayOrder } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// Payment routes

router.post('/verify', protect, verifyPayment);
router.post('/create', protect, createRazorpayOrder);

module.exports = router;