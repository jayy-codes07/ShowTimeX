const Show = require("../models/Show");
const Movie = require("../models/Movie");
const {
  uniqueSeats,
  getActiveLocks,
  buildLockResponse,
  isSeatLockedByOther,
  upsertUserLock,
  removeUserLockedSeats,
} = require("../utils/seatLocks");

const DEFAULT_LOCK_MINUTES = parseInt(process.env.SEAT_LOCK_MINUTES || "10", 10);
const MAX_LOCK_MINUTES = 30;
const MAX_LOCK_SEATS = 10;

const formatShowForClient = (show, userId) => {
  const showObj = show.toObject ? show.toObject() : { ...show };
  const { lockedSeats, myLockedSeats, myLockExpiresAt } = buildLockResponse(show, userId);
  showObj.lockedSeats = lockedSeats;
  if (userId) {
    showObj.myLockedSeats = myLockedSeats;
    showObj.myLockExpiresAt = myLockExpiresAt;
  }
  delete showObj.seatLocks;
  return showObj;
};

// @desc    Get all shows (Filtered)
// @route   GET /api/shows
// @access  Public
const getAllShows = async (req, res) => {
  try {
    const { date, theater, movieId, page, limit, sortBy, order } = req.query;

    let filter = { isActive: true };

    // FIX: Map query 'date' to model 'showDate'
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    if (theater) filter.theater = { $regex: theater, $options: "i" };
    if (movieId) filter.movie = movieId;

    const sortDirection = order === "desc" ? -1 : 1;
    let sortCriteria = { date: 1, time: 1 };

    if (sortBy === "createdAt") {
      sortCriteria = { createdAt: sortDirection };
    } else if (sortBy === "date") {
      sortCriteria = { date: sortDirection, time: sortDirection };
    }

    const shouldPaginate = page !== undefined || limit !== undefined;

    if (!shouldPaginate) {
      const shows = await Show.find(filter)
        .populate("movie", "title poster duration genres languages certificate")
        .sort(sortCriteria);

      const userId = req.user?._id;
      const formattedShows = shows.map((show) => formatShowForClient(show, userId));

      return res.status(200).json({
        success: true,
        count: formattedShows.length,
        shows: formattedShows,
      });
    }

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (parsedPage - 1) * parsedLimit;
    const total = await Show.countDocuments(filter);

    const shows = await Show.find(filter)
      .populate("movie", "title poster duration genres languages certificate")
      .sort(sortCriteria)
      .skip(skip)
      .limit(parsedLimit);

    const userId = req.user?._id;
    const formattedShows = shows.map((show) => formatShowForClient(show, userId));
    const hasMore = skip + formattedShows.length < total;

    res.status(200).json({
      success: true,
      total,
      page: parsedPage,
      limit: parsedLimit,
      hasMore,
      count: formattedShows.length,
      shows: formattedShows,
    });
  } catch (error) {
    console.error("Get All Shows Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching shows",
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
      return res
        .status(404)
        .json({ success: false, message: "Movie not found" });
    }

    // 🟢 FIX 1: Removed `isActive: true` so it catches all created shows
    let filter = { movie: movieId };
    console.log("Filter:", filter);
    if (date) {
      const startDate = new Date(date + "T00:00:00.000Z");
      const endDate = new Date(date + "T23:59:59.999Z");

      filter.date = { $gte: startDate, $lte: endDate };
    } else {
      // If no date is passed, just show everything from today onwards
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      filter.date = { $gte: today };
    }

    const shows = await Show.find(filter)
      .populate("movie", "title poster duration")
      // 🟢 FIX 3: Changed 'showDate' to 'date' and 'showTime' to 'time' to match your DB schema
      .sort({ date: 1, time: 1 });

    const userId = req.user?._id;
    const formattedShows = shows.map((show) => formatShowForClient(show, userId));

    res.status(200).json({
      success: true,
      count: formattedShows.length,
      shows: formattedShows,
    });
  } catch (error) {
    console.error("Get Shows By Movie Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching shows",
    });
  }
};

// @desc    Create MULTIPLE shows (Batch Generator)
// @route   POST /api/shows
// @access  Private/Admin
// @desc    Create MULTIPLE shows (Batch Generator)
// @route   POST /api/shows
// @access  Private/Admin
// @desc    Create MULTIPLE shows (Batch Generator)
// @route   POST /api/shows
// @access  Private/Admin
// Bulk Insert

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
      totalSeats,
    } = req.body;

    if (!movieId || !startDate || !endDate || !timeSlots?.length || !theater || !price) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after end date",
      });
    }

    let currentDate = new Date(start);
    const showsToInsert = [];

    while (currentDate <= end) {
      for (const slot of timeSlots) {
        showsToInsert.push({
          movie: movieId,
          theater,
          location: location || "",
          format: format || "2D",
          price,
          totalSeats: totalSeats || 120,
          date: new Date(currentDate),
          time: slot,
          bookedSeats: [],
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log("Total generated:", showsToInsert.length);

    if (showsToInsert.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No shows generated",
      });
    }

    const result = await Show.insertMany(showsToInsert, { ordered: false });

    res.status(201).json({
      success: true,
      message: `Successfully scheduled ${result.length} shows!`,
    });

  } catch (error) {
    console.error("Create Show Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Get single show details (Used by the frontend Seat Map!)
// @route   GET /api/shows/:id
// @access  Public
const getShowById = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id).populate("movie");

    if (!show) {
      return res
        .status(404)
        .json({ success: false, message: "Show not found" });
    }

    const userId = req.user?._id;
    const showObj = formatShowForClient(show, userId);

    // Extract all seats from all transactions and put them in one simple list
    let flatBookedSeats = [];
    if (showObj.bookedSeats && Array.isArray(showObj.bookedSeats)) {
      showObj.bookedSeats.forEach((transaction) => {
        if (transaction.seats && Array.isArray(transaction.seats)) {
          flatBookedSeats.push(...transaction.seats);
        }
      });
    }

    // Overwrite the complex array with the simple flat array before sending to React
    showObj.bookedSeats = flatBookedSeats;

    res.status(200).json({
      success: true,
      show: showObj,
    });
  } catch (error) {
    console.error("Get Show By ID Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while fetching show" });
  }
};

// @desc    Lock seats for a short duration
// @route   POST /api/shows/:id/lock
// @access  Private
const lockSeats = async (req, res) => {
  try {
    const { seats, holdMinutes } = req.body;
    const requestedSeats = uniqueSeats(seats);

    if (!requestedSeats.length) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one seat to lock",
      });
    }

    if (requestedSeats.length > MAX_LOCK_SEATS) {
      return res.status(400).json({
        success: false,
        message: `You can lock a maximum of ${MAX_LOCK_SEATS} seats`,
      });
    }

    const show = await Show.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ success: false, message: "Show not found" });
    }

    if (!show.bookedSeats) {
      show.bookedSeats = [];
    }

    const activeLocks = getActiveLocks(show);
    for (const seat of requestedSeats) {
      if (show.isSeatBooked(seat.row, seat.number)) {
        return res.status(409).json({
          success: false,
          message: `Seat ${seat.row}${seat.number} is already booked`,
        });
      }
      if (isSeatLockedByOther(activeLocks, seat, req.user._id)) {
        return res.status(409).json({
          success: false,
          message: `Seat ${seat.row}${seat.number} is temporarily locked`,
        });
      }
    }

    const minutes = Math.min(
      Math.max(parseInt(holdMinutes || DEFAULT_LOCK_MINUTES, 10), 1),
      MAX_LOCK_MINUTES
    );
    const lockResult = upsertUserLock(show, req.user._id, requestedSeats, minutes);
    await show.save();

    res.status(200).json({
      success: true,
      message: "Seats locked successfully",
      ...lockResult,
    });
  } catch (error) {
    console.error("Lock Seats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while locking seats",
    });
  }
};

// @desc    Unlock seats
// @route   POST /api/shows/:id/unlock
// @access  Private
const unlockSeats = async (req, res) => {
  try {
    const { seats } = req.body;
    const show = await Show.findById(req.params.id);

    if (!show) {
      return res.status(404).json({ success: false, message: "Show not found" });
    }

    if (!seats || seats.length === 0) {
      const activeLocks = getActiveLocks(show);
      show.seatLocks = activeLocks.filter(
        (lock) => !lock.user || lock.user.toString() !== req.user._id.toString()
      );
    } else {
      removeUserLockedSeats(show, req.user._id, seats);
    }

    await show.save();

    const { lockedSeats, myLockedSeats, myLockExpiresAt } = buildLockResponse(show, req.user._id);
    res.status(200).json({
      success: true,
      message: "Seats unlocked",
      lockedSeats,
      myLockedSeats,
      myLockExpiresAt,
    });
  } catch (error) {
    console.error("Unlock Seats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while unlocking seats",
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
      return res
        .status(404)
        .json({ success: false, message: "Show not found" });
    }

    // Check if show has bookings using the array length
    if (show.bookedSeats && show.bookedSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot update show that has bookings. Please create a new show instead.",
      });
    }

    const updatedShow = await Show.findByIdAndUpdate(
      req.params.id,
      req.body, // Ensure body uses 'showDate'/'showTime' if updating those
      { new: true, runValidators: true },
    ).populate("movie", "title poster duration");

    res.status(200).json({
      success: true,
      message: "Show updated successfully",
      show: updatedShow,
    });
  } catch (error) {
    console.error("Update Show Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while updating show",
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
      return res
        .status(404)
        .json({ success: false, message: "Show not found" });
    }

    if (show.bookedSeats && show.bookedSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete show that has bookings",
      });
    }

    show.isActive = false;
    await show.save();

    res.status(200).json({
      success: true,
      message: "Show deleted successfully",
    });
  } catch (error) {
    console.error("Delete Show Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting show",
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
  lockSeats,
  unlockSeats,
};
