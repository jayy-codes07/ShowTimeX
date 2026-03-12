const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getAllMovies, getMovieById, getNowShowing,
  getComingSoon, searchMovies, createMovie,
  updateMovie, deleteMovie,
} = require('../controllers/movieController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Multer setup
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Public routes
router.get('/search', searchMovies);
router.get('/now-showing', getNowShowing);
router.get('/coming-soon', getComingSoon);
router.get('/', getAllMovies);
router.get('/:id', getMovieById);

// Protected routes - Admin only
// ↓ ADD upload.fields() here
router.post('/', protect, adminOnly, upload.fields([
  { name: 'poster', maxCount: 1 },
  { name: 'backdrop', maxCount: 1 }
]), createMovie);

router.put('/:id', protect, adminOnly, upload.fields([
  { name: 'poster', maxCount: 1 },
  { name: 'backdrop', maxCount: 1 }
]), updateMovie);

router.delete('/:id', protect, adminOnly, deleteMovie);

module.exports = router;