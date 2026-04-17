const Theater = require('../models/Theater');

// Create Theater
exports.createTheater = async (req, res) => {
  try {
    const theater = new Theater(req.body);
    await theater.save();

    res.status(201).json({
      success: true,
      message: 'Theater created successfully',
      data: theater,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Theaters
exports.getAllTheaters = async (req, res) => {
  try {
    const theaters = await Theater.find()
      .populate('managedBy', 'name email');

    res.status(200).json({
      success: true,
      data: theaters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Theaters by City
exports.getTheatersByCity = async (req, res) => {
  try {
    const { city } = req.params;

    const theaters = await Theater.find({
      city: { $regex: city, $options: 'i' },
      isActive: true,
    }).populate('managedBy', 'name email');

    res.status(200).json({
      success: true,
      data: theaters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Theater by ID
exports.getTheaterById = async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id).populate(
      'managedBy',
      'name email'
    );

    if (!theater) {
      return res.status(404).json({
        success: false,
        message: 'Theater not found',
      });
    }

    res.status(200).json({
      success: true,
      data: theater,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Theater
exports.updateTheater = async (req, res) => {
  try {
    const theater = await Theater.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!theater) {
      return res.status(404).json({
        success: false,
        message: 'Theater not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Theater updated successfully',
      data: theater,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Add Auditorium
exports.addAuditorium = async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id);

    if (!theater) {
      return res.status(404).json({
        success: false,
        message: 'Theater not found',
      });
    }

    theater.addAuditorium(req.body);
    await theater.save();

    res.status(200).json({
      success: true,
      message: 'Auditorium added successfully',
      data: theater,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove Auditorium
exports.removeAuditorium = async (req, res) => {
  try {
    const { auditoriumName } = req.body;
    const theater = await Theater.findById(req.params.id);

    if (!theater) {
      return res.status(404).json({
        success: false,
        message: 'Theater not found',
      });
    }

    theater.removeAuditorium(auditoriumName);
    await theater.save();

    res.status(200).json({
      success: true,
      message: 'Auditorium removed successfully',
      data: theater,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Theater Capacity
exports.getTheaterCapacity = async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id);

    if (!theater) {
      return res.status(404).json({
        success: false,
        message: 'Theater not found',
      });
    }

    const capacity = theater.getTheaterCapacity();

    res.status(200).json({
      success: true,
      data: { capacity },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Available Seats
exports.getAvailableSeats = async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id);

    if (!theater) {
      return res.status(404).json({
        success: false,
        message: 'Theater not found',
      });
    }

    const availableSeats = theater.getAvailableSeats();

    res.status(200).json({
      success: true,
      data: { availableSeats },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Theater Info
exports.getTheaterInfo = async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id);

    if (!theater) {
      return res.status(404).json({
        success: false,
        message: 'Theater not found',
      });
    }

    const info = theater.getTheaterInfo();

    res.status(200).json({
      success: true,
      data: info,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Theater
exports.deleteTheater = async (req, res) => {
  try {
    const theater = await Theater.findByIdAndDelete(req.params.id);

    if (!theater) {
      return res.status(404).json({
        success: false,
        message: 'Theater not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Theater deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
