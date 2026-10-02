const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Rate limit for credential and OTP endpoints. Tunable through env:
//   AUTH_RATE_LIMIT_MAX            requests per window per IP (default 20)
//   AUTH_RATE_LIMIT_WINDOW_MINUTES window length (default 15)
// Skipped under NODE_ENV=test unless AUTH_RATE_LIMIT_MAX is set explicitly,
// so the suite can exercise it on demand.
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES || '15', 10) * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' && !process.env.AUTH_RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many attempts. Please try again later.',
  },
});

// Validation middleware — checks for errors from express-validator
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

// Public routes
router.post(
  '/register',
  authLimiter,
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
    body('email')
      .trim()
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('phone')
      .trim()
      .matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  register,
);

router.post(
  '/login',
  authLimiter,
  [
    body('email')
      .trim()
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required'),
  ],
  validate,
  login,
);

router.post(
  '/forgotpassword',
  authLimiter,
  [
    body('email')
      .trim()
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
  ],
  validate,
  forgotPassword
);

router.put(
  '/resetpassword',
  authLimiter,
  [
    body('email')
      .trim()
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('otp')
      .trim()
      .notEmpty().withMessage('OTP is required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  resetPassword
);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/update-profile', protect, updateProfile);

module.exports = router;