const ShowSeat = require('../models/ShowSeat');
const Show = require('../models/Show');

// Create ShowSeat
exports.createShowSeat = async (req, res) => {
  try {
    const showSeat = new ShowSeat(req.body);
    await showSeat.save();

    res.status(201).json({
      success: true,
      message: 'Show seat created successfully',
      data: showSeat,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Seats for a Show
exports.getShowSeats = async (req, res) => {
  try {
    const { showId } = req.params;

    const seats = await ShowSeat.find({ show: showId }).populate(
      'show',
      'theater location date time'
    );

    res.status(200).json({
      success: true,
      data: seats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Available Seats for a Show
exports.getAvailableSeats = async (req, res) => {
  try {
    const { showId } = req.params;

    const seats = await ShowSeat.find({
      show: showId,
      seatStatus: 'available',
    }).select('seatRow seatNumber seatType price isAisle');

    res.status(200).json({
      success: true,
      data: seats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Seat by ID
exports.getSeatById = async (req, res) => {
  try {
    const seat = await ShowSeat.findById(req.params.id).populate(
      'show booking lockedBy'
    );

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: 'Seat not found',
      });
    }

    res.status(200).json({
      success: true,
      data: seat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Lock Seat
exports.lockSeat = async (req, res) => {
  try {
    const { lockDurationMinutes } = req.body;
    const seat = await ShowSeat.findById(req.params.id);

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: 'Seat not found',
      });
    }

    seat.lockSeat(req.user._id, lockDurationMinutes);
    await seat.save();

    res.status(200).json({
      success: true,
      message: 'Seat locked successfully',
      data: seat,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Unlock Seat
exports.unlockSeat = async (req, res) => {
  try {
    const seat = await ShowSeat.findById(req.params.id);

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: 'Seat not found',
      });
    }

    seat.unlockSeat();
    await seat.save();

    res.status(200).json({
      success: true,
      message: 'Seat unlocked successfully',
      data: seat,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Book Seat
exports.bookSeat = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const seat = await ShowSeat.findById(req.params.id);

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: 'Seat not found',
      });
    }

    seat.bookSeat(bookingId);
    await seat.save();

    res.status(200).json({
      success: true,
      message: 'Seat booked successfully',
      data: seat,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Release Seat
exports.releaseSeat = async (req, res) => {
  try {
    const seat = await ShowSeat.findById(req.params.id);

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: 'Seat not found',
      });
    }

    seat.releaseSeat();
    await seat.save();

    res.status(200).json({
      success: true,
      message: 'Seat released successfully',
      data: seat,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Block Seat (Admin)
exports.blockSeat = async (req, res) => {
  try {
    const seat = await ShowSeat.findById(req.params.id);

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: 'Seat not found',
      });
    }

    seat.blockSeat();
    await seat.save();

    res.status(200).json({
      success: true,
      message: 'Seat blocked successfully',
      data: seat,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Seat
exports.updateSeat = async (req, res) => {
  try {
    const seat = await ShowSeat.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: 'Seat not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Seat updated successfully',
      data: seat,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Seat
exports.deleteSeat = async (req, res) => {
  try {
    const seat = await ShowSeat.findByIdAndDelete(req.params.id);

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: 'Seat not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Seat deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
