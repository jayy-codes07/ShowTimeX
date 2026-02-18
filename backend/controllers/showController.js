const Show = require('../models/Show');
const Movie = require('../models/Movie');

// @desc    Get all shows (Filtered)
// @route   GET /api/shows
// @access  Public
const getAllShows = async (req, res) => {
  try {
    const { date, theater, movieId } = req.query;
    
    let filter = { isActive: true };
    
    // FIX: Map query 'date' to model 'showDate'
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
      .sort({ showDate: 1, showTime: 1 }); // Sorted by specific date/time

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

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    let filter = { movie: movieId, isActive: true };

    // FIX: Map query 'date' to model 'showDate'
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    } else {
      filter.date = { $gte: new Date() };
    }

    const shows = await Show.find(filter)
      .populate('movie', 'title poster duration')
      .sort({ showDate: 1, showTime: 1 });

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

// @desc    Create MULTIPLE shows (Batch Generator)
// @route   POST /api/shows
// @access  Private/Admin
// @desc    Create MULTIPLE shows (Batch Generator)
// @route   POST /api/shows
// @access  Private/Admin
const createShow = async (req, res) => {
  try {
    const { 
      movieId, 
      startDate,   
      endDate,     
      timeSlots,   
      theater, 
      location, 
      format, 
      price, 
      totalSeats 
    } = req.body;

    // Validate required fields
    if (!movieId || !startDate || !endDate || !timeSlots || !theater || !price) {
      return res.status(400).json({
        success: false,
        message: 'Please provide movie, start date, end date, time slots, theater, and price',
      });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    // --- THE GENERATOR LOGIC ---
    const showsToInsert = [];
    let current = new Date(startDate);
    const end = new Date(endDate);

    // Loop through every day from Start to End
    while (current <= end) {
      // Loop through every time slot for that day
      timeSlots.forEach((slot) => {
        showsToInsert.push({
          movie: movieId,
          theater,
          location: location || '',
          format: format || '2D',
          price,
          totalSeats: totalSeats || 120,
          
          // 🔴 FIX: Use 'date' and 'time' to match your Schema!
          date: new Date(current), 
          time: slot,              
          
          bookedSeats: [] 
        });
      });
      // Increment day
      current.setDate(current.getDate() + 1);
    }

    // Bulk Insert
    try {
        await Show.insertMany(showsToInsert, { ordered: false });
    } catch (insertError) {
        if (insertError.code !== 11000) { 
            throw insertError; 
        }
    }

    res.status(201).json({
      success: true,
      message: `Successfully processed schedule! Attempted to create ${showsToInsert.length} shows.`,
    });

  } catch (error) {
    console.error('Create Show Error:', error);
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
      return res.status(404).json({ success: false, message: 'Show not found' });
    }

    // Check if show has bookings using the array length
    if (show.bookedSeats && show.bookedSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update show that has bookings. Please create a new show instead.',
      });
    }

    const updatedShow = await Show.findByIdAndUpdate(
      req.params.id,
      req.body, // Ensure body uses 'showDate'/'showTime' if updating those
      { new: true, runValidators: true }
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
      return res.status(404).json({ success: false, message: 'Show not found' });
    }

    if (show.bookedSeats && show.bookedSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete show that has bookings',
      });
    }

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