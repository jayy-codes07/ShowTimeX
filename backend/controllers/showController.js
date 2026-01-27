const Show = require('../models/Show');
const Movie = require('../models/Movie');

// @desc    Get all shows
// @route   GET /api/shows
// @access  Public
const getAllShows = async (req, res) => {
  try {
    const { date, theater, movieId } = req.query;
    
    let filter = { isActive: true };
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }
    
    if (theater) filter.theater = { $regex: theater, $options: 'i' };
    if (movieId) filter.movie = movieId;

    const shows = await Show.find(filter)
      .populate('movie', 'title poster duration genres languages certificate')
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      count: shows.length,
      shows,
    });
  } catch (error) {
    console.error('Get All Shows Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shows',
    });
  }
};

// @desc    Get show by ID
// @route   GET /api/shows/:id
// @access  Public
const getShowById = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('movie', 'title poster duration genres languages certificate');

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    res.status(200).json({
      success: true,
      show,
    });
  } catch (error) {
    console.error('Get Show By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching show',
    });
  }
};

// @desc    Get shows by movie
// @route   GET /api/shows/movie/:movieId
// @access  Public
const getShowsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { date } = req.query;

    // Verify movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    let filter = { movie: movieId, isActive: true };

    // Filter by date if provided
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    } else {
      // Only show future shows if no date specified
      filter.date = { $gte: new Date() };
    }

    const shows = await Show.find(filter)
      .populate('movie', 'title poster duration')
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      count: shows.length,
      shows,
    });
  } catch (error) {
    console.error('Get Shows By Movie Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shows',
    });
  }
};

// @desc    Create a new show
// @route   POST /api/shows
// @access  Private/Admin
const createShow = async (req, res) => {
  try {
    const { movieId, date, time, theater, location, format, price, totalSeats } = req.body;

    // Validate required fields
    if (!movieId || !date || !time || !theater || !price) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Verify movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    // Create show
    const show = await Show.create({
      movie: movieId,
      date,
      time,
      theater,
      location: location || '',
      format: format || '2D',
      price,
      totalSeats: totalSeats || 120,
    });

    const populatedShow = await Show.findById(show._id)
      .populate('movie', 'title poster duration');

    res.status(201).json({
      success: true,
      message: 'Show created successfully',
      show: populatedShow,
    });
  } catch (error) {
    console.error('Create Show Error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A show already exists for this movie at this date, time, and theater',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating show',
    });
  }
};

// @desc    Update a show
// @route   PUT /api/shows/:id
// @access  Private/Admin
const updateShow = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    // Don't allow updating if show has bookings
    if (show.bookedSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update show that has bookings. Please create a new show instead.',
      });
    }

    const updatedShow = await Show.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate('movie', 'title poster duration');

    res.status(200).json({
      success: true,
      message: 'Show updated successfully',
      show: updatedShow,
    });
  } catch (error) {
    console.error('Update Show Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating show',
    });
  }
};

// @desc    Delete a show
// @route   DELETE /api/shows/:id
// @access  Private/Admin
const deleteShow = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    // Don't allow deleting if show has bookings
    if (show.bookedSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete show that has bookings',
      });
    }

    // Soft delete
    show.isActive = false;
    await show.save();

    res.status(200).json({
      success: true,
      message: 'Show deleted successfully',
    });
  } catch (error) {
    console.error('Delete Show Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting show',
    });
  }
};

module.exports = {
  getAllShows,
  getShowById,
  getShowsByMovie,
  createShow,
  updateShow,
  deleteShow,
};