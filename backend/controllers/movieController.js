const Movie = require('../models/Movie');

// @desc    Get all movies
// @route   GET /api/movies
// @access  Public
const getAllMovies = async (req, res) => {
  try {
    const { genre, language, status } = req.query;
    
    let filter = { isActive: true };
    
    if (genre) filter.genres = genre;
    if (language) filter.languages = language;
    if (status) filter.status = status;

    const movies = await Movie.find(filter).sort({ releaseDate: -1 });

    res.status(200).json({
      success: true,
      count: movies.length,
      movies,
    });
  } catch (error) {
    console.error('Get All Movies Error:', error);
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
      movie,
    });
  } catch (error) {
    console.error('Get Movie By ID Error:', error);
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
      status: 'NOW_SHOWING',
      isActive: true,
    }).sort({ releaseDate: -1 });

    res.status(200).json({
      success: true,
      count: movies.length,
      movies,
    });
  } catch (error) {
    console.error('Get Now Showing Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching now showing movies',
    });
  }
};

// @desc    Get coming soon movies
// @route   GET /api/movies/coming-soon
// @access  Public
const getComingSoon = async (req, res) => {
  try {
    const movies = await Movie.find({
      status: 'COMING_SOON',
      isActive: true,
    }).sort({ releaseDate: 1 });

    res.status(200).json({
      success: true,
      count: movies.length,
      movies,
    });
  } catch (error) {
    console.error('Get Coming Soon Error:', error);
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
      searchFilter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ];
    }

    if (genre) searchFilter.genres = genre;
    if (language) searchFilter.languages = language;

    const movies = await Movie.find(searchFilter).sort({ releaseDate: -1 });

    res.status(200).json({
      success: true,
      count: movies.length,
      movies,
    });
  } catch (error) {
    console.error('Search Movies Error:', error);
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
    const movie = await Movie.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Movie created successfully',
      movie,
    });
  } catch (error) {
    console.error('Create Movie Error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A movie with this title already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating movie',
    });
  }
};

// @desc    Update a movie
// @route   PUT /api/movies/:id
// @access  Private/Admin
const updateMovie = async (req, res) => {
  try {
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

    res.status(200).json({
      success: true,
      message: 'Movie updated successfully',
      movie,
    });
  } catch (error) {
    console.error('Update Movie Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating movie',
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

    res.status(200).json({
      success: true,
      message: 'Movie deleted successfully',
    });
  } catch (error) {
    console.error('Delete Movie Error:', error);
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