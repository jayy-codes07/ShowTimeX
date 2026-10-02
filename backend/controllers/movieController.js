const Movie = require('../models/Movie');
const { triggerN8n } = require('../n8nService');
const User = require('../models/User');
const { escapeRegex } = require('../utils/strings');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Posters and backdrops are stored as external URLs only (no file upload).
const IMAGE_URL_RE = /^https?:\/\/\S+$/i;

const validateImageUrls = (data) => {
  for (const field of ['poster', 'backdrop']) {
    const value = data[field];
    if (value === undefined || value === null || value === '') continue;
    if (typeof value !== 'string' || !IMAGE_URL_RE.test(value)) {
      return `${field} must be an http(s) URL`;
    }
  }
  return null;
};

const computeStatusFromDates = (releaseDate, endDate) => {
  const today = getToday();
  const release = releaseDate ? new Date(releaseDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (end && end <= today) {
    return 'ENDED';
  }

  if (release && release > today) {
    return 'COMING_SOON';
  }

  return 'NOW_SHOWING';
};

const buildStatusFilter = (status) => {
  const today = getToday();
  if (!status) return {};

  if (status === 'COMING_SOON') {
    return { releaseDate: { $gt: today } };
  }

  if (status === 'NOW_SHOWING') {
    return {
      releaseDate: { $lte: today },
      $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gt: today } }],
    };
  }

  if (status === 'ENDED') {
    return { endDate: { $lte: today } };
  }

  return {};
};

const withComputedStatus = (movie) => {
  const data = movie.toObject();
  data.status = computeStatusFromDates(data.releaseDate, data.endDate);
  return data;
};

// @desc    Get all movies
// @route   GET /api/movies
// @access  Public
const getAllMovies = async (req, res) => {
  try {
    const { genre, language, status, page, limit } = req.query;
    
    let filter = { isActive: true };
    
    if (genre) filter.genres = genre;
    if (language) filter.languages = language;
    if (status) {
      Object.assign(filter, buildStatusFilter(status));
    }

    const shouldPaginate = page !== undefined || limit !== undefined;

    if (!shouldPaginate) {
      const movies = await Movie.find(filter).sort({ releaseDate: -1 });

      return res.status(200).json({
        success: true,
        count: movies.length,
        movies: movies.map(withComputedStatus),
      });
    }

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (parsedPage - 1) * parsedLimit;
    const total = await Movie.countDocuments(filter);

    const movies = await Movie.find(filter)
      .sort({ releaseDate: -1 })
      .skip(skip)
      .limit(parsedLimit);

    const hasMore = skip + movies.length < total;

    res.status(200).json({
      success: true,
      total,
      page: parsedPage,
      limit: parsedLimit,
      hasMore,
      count: movies.length,
      movies: movies.map(withComputedStatus),
    });
  } catch (error) {
    logger.error('Get All Movies Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching movies',
    });
  }
};

// @desc    Get movie by ID
// @route   GET /api/movies/:id
// @access  Public
const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    res.status(200).json({
      success: true,
      movie: withComputedStatus(movie),
    });
  } catch (error) {
    logger.error('Get Movie By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching movie',
    });
  }
};

// @desc    Get now showing movies
// @route   GET /api/movies/now-showing
// @access  Public
const getNowShowing = async (req, res) => {
  try {
    const movies = await Movie.find({
      isActive: true,
      ...buildStatusFilter('NOW_SHOWING'),
    }).sort({ releaseDate: -1 });

    res.status(200).json({
      success: true,
      count: movies.length,
      movies: movies.map(withComputedStatus),
    });
  } catch (error) {
    logger.error('Get Now Showing Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching now showing movies',
    });
  }
};

// @desc    Get coming soon movies (by status OR future release date)
// @route   GET /api/movies/coming-soon
// @access  Public
const getComingSoon = async (req, res) => {
  try {
    const movies = await Movie.find({
      isActive: true,
      ...buildStatusFilter('COMING_SOON'),
    }).sort({ releaseDate: 1 });

    res.status(200).json({
      success: true,
      count: movies.length,
      movies: movies.map(withComputedStatus),
    });
  } catch (error) {
    logger.error('Get Coming Soon Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching coming soon movies',
    });
  }
};

// @desc    Search movies
// @route   GET /api/movies/search
// @access  Public
const searchMovies = async (req, res) => {
  try {
    const { query, genre, language } = req.query;

    let searchFilter = { isActive: true };

    if (query) {
      const safeQuery = escapeRegex(query);
      searchFilter.$or = [
        { title: { $regex: safeQuery, $options: 'i' } },
        { description: { $regex: safeQuery, $options: 'i' } },
      ];
    }

    if (genre) searchFilter.genres = genre;
    if (language) searchFilter.languages = language;

    const movies = await Movie.find(searchFilter).sort({ releaseDate: -1 });

    res.status(200).json({
      success: true,
      count: movies.length,
      movies: movies.map(withComputedStatus),
    });
  } catch (error) {
    logger.error('Search Movies Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching movies',
    });
  }
};

// @desc    Create a new movie
// @route   POST /api/movies
// @access  Private/Admin
const createMovie = async (req, res) => {
  try {
    const movieData = { ...req.body };

    const imageError = validateImageUrls(movieData);
    if (imageError) {
      return res.status(400).json({ success: false, message: imageError });
    }

    const movie = await Movie.create(movieData);
    await cache.invalidate('movies', 'shows');

    // 🔔 Trigger n8n - notify all users about new movie (unchanged)
    const subscribers = await User.find({ role: 'customer' }, 'email').lean();
    await triggerN8n('new-movie', {
      movieTitle: movie.title,
      genre: movie.genres?.join(', ') || '',
      language: movie.languages?.join(', ') || '',
      releaseDate: movie.releaseDate,
      description: movie.description,
      posterUrl: movie.poster || '',
      status: movie.status,
      subscribers: subscribers.map(u => u.email),
    });

    res.status(201).json({
      success: true,
      message: 'Movie created successfully',
      movie,
    });
  } catch (error) {
    logger.error('Create Movie Error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A movie with this title already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating movie',
    });
  }
};

// @desc    Update a movie
// @route   PUT /api/movies/:id
// @access  Private/Admin
const updateMovie = async (req, res) => {
  try {
    const imageError = validateImageUrls(req.body);
    if (imageError) {
      return res.status(400).json({ success: false, message: imageError });
    }

    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    await cache.invalidate('movies', 'shows');

    res.status(200).json({
      success: true,
      message: 'Movie updated successfully',
      movie,
    });
  } catch (error) {
    logger.error('Update Movie Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating movie',
    });
  }
};

// @desc    Delete a movie
// @route   DELETE /api/movies/:id
// @access  Private/Admin
const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    // Soft delete - just set isActive to false
    movie.isActive = false;
    await movie.save();
    await cache.invalidate('movies', 'shows');

    res.status(200).json({
      success: true,
      message: 'Movie deleted successfully',
    });
  } catch (error) {
    logger.error('Delete Movie Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting movie',
    });
  }
};

module.exports = {
  getAllMovies,
  getMovieById,
  getNowShowing,
  getComingSoon,
  searchMovies,
  createMovie,
  updateMovie,
  deleteMovie,
};
