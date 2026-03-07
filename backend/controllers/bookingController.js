const Booking = require("../models/Booking");
const Show = require("../models/Show");
const Movie = require("../models/Movie");
const { triggerN8n } = require('../n8nService');
const Razorpay = require("razorpay");

const createRazorpayOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // 1. Check if keys are actually loading (Debugging)
    console.log("Key ID loaded:", !!process.env.RAZORPAY_KEY_ID);
    console.log("Key Secret loaded:", !!process.env.RAZORPAY_KEY_SECRET);

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Server is missing Razorpay keys in .env",
        });
    }

    // 2. Initialize Razorpay INSIDE the function
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    console.log("Frontend is trying to pay for ID:", bookingId);

    if (!bookingId) {
      return res
        .status(400)
        .json({ success: false, message: "No booking ID provided" });
    }

    let booking = await Booking.findOne({ bookingId: bookingId });
    if (!booking) {
      booking = await Booking.findById(bookingId).catch(() => null);
    }

    if (!booking) {
      console.log("❌ Could not find booking in the database!");
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // 3. Create the order
    const order = await razorpay.orders.create({
      amount: booking.totalAmount * 100, // Make sure totalAmount exists!
      currency: "INR",
      receipt: booking.bookingId,
    });

    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json(order);
  } catch (err) {
    console.error("Razorpay Order Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Create a new booking
// @route   POST /api/bookings/create
// @access  Private
const createBooking = async (req, res) => {
  try {
    console.log(
      "helloooooooooooooooooooooooooooooooo0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ooooooooooooooooooooooooooooooooooooooooooooooooooooooooo",
    );
    const { movieId, showId, seats, email, phone } = req.body;

    // Validate required fields
    if (!movieId || !showId || !seats || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one seat",
      });
    }

    // Verify show exists and get details
    const show = await Show.findById(showId).populate("movie");
    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    // Check if show is in the past
    if (show.isPast()) {
      return res.status(400).json({
        success: false,
        message: "Cannot book tickets for past shows",
      });
    }

    // -------------------------------------------------------------
    // FIX START: Handle missing 'bookedSeats' in old database data
    // -------------------------------------------------------------
    if (!show.bookedSeats) {
      show.bookedSeats = [];
    }
    // -------------------------------------------------------------
    // FIX END
    // -------------------------------------------------------------

    // NOW you can safely run the loop because bookedSeats is guaranteed to exist
    for (const seat of seats) {
      if (show.isSeatBooked(seat.row, seat.number)) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seat.row}${seat.number} is already booked`,
        });
      }
    }

    // Check if enough seats available (No need for extra variables now)
    // Check if enough seats available
    // FIX: Use availableSeats virtual because bookedSeats.length is not accurate for nested arrays
    if (show.availableSeats < seats.length) {
      return res.status(400).json({
        success: false,
        message: "Not enough seats available",
      });
    }

    const bookingId = `CB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create booking
    const booking = new Booking({
      bookingId,
      user: req.user._id,
      movie: movieId,
      show: showId,
      seats,
      email,
      phone,
      status: "pending", // 🔴 IMPORTANT
    });

    // Calculate total amount
    booking.calculateTotal(show.price, seats.length);

    // Save booking
    await booking.save();

    // Populate booking details
    const populatedBooking = await Booking.findById(booking._id)
      .populate("movie", "title poster duration")
      .populate("show", "date time theater location format price");

    res.status(201).json({
      success: true,
      message: "Booking created successfully. Please complete payment.",
      booking: populatedBooking,
      orderId: `ORDER_${booking.bookingId}`,
    });
  } catch (error) {
    console.error("Create Booking Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while creating booking",
    });
  }
};

// @desc    Verify payment and confirm booking
// @route   POST /api/payments/verify
// @access  Private

// @desc    Verify payment and confirm booking
// @route   POST /api/payments/verify
// @access  Private
const crypto = require("crypto");

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = req.body;

    console.log("Verifying payment for ID:", bookingId);

    if (!bookingId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Missing booking ID in verification",
        });
    }

    // 🛠️ FIX: Check BOTH the custom CB-ID and the MongoDB _id
    let booking = await Booking.findOne({ bookingId: bookingId }).populate(
      "show",
    );

    // If not found by CB-ID, try finding it by MongoDB _id
    if (!booking) {
      booking = await Booking.findById(bookingId)
        .populate("show")
        .catch(() => null);
    }

    if (!booking) {
      console.log("❌ Could not find booking during verification!");
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // 🔐 Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      console.log("❌ Signature mismatch!");
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    // ✅ NOW book seats
    booking.show.bookSeats(booking.seats);
    await booking.show.save();

    // ✅ Confirm booking
    // ✅ Confirm booking
    booking.status = "confirmed";
    booking.paymentId = razorpay_payment_id;
    await booking.save();

    // Populate for email details
    const confirmedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('movie', 'title')
      .populate('show', 'date time theater');

    // 🔔 Trigger n8n - send confirmation email
    await triggerN8n('ticket-booked', {
      userName: confirmedBooking.user?.name || 'Customer',
      userEmail: confirmedBooking.user?.email || booking.email,
      movieTitle: confirmedBooking.movie?.title || 'Movie',
      showDate: confirmedBooking.show?.date,
      showTime: confirmedBooking.show?.time,
      theater: confirmedBooking.show?.theater,
      seats: booking.seats.map(s => `${s.row}${s.number}`),
      bookingId: booking.bookingId,
      totalAmount: booking.totalAmount,
    });

    console.log("✅ Payment verified and seats booked!");
    res.json({ success: true, booking });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings/user
// @access  Private
const getUserBookings = async (req, res) => {
  try {
    const { status } = req.query;

    let filter = {};
    if (status) filter.status = status;

    const bookings = await Booking.getUserBookings(req.user._id, filter);

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get User Bookings Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching bookings",
    });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("movie", "title poster duration genres languages")
      .populate("show", "date time theater location format price");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user owns this booking or is admin
    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to booking",
      });
    }

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Get Booking By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching booking",
    });
  }
};

// @desc    Cancel booking
// @route   DELETE /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("show");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to cancel this booking",
      });
    }

    // Check if already cancelled
    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    // Cancel booking
    await booking.cancelBooking();

    // Remove seats from show
    const show = await Show.findById(booking.show._id);
    if (show) {
      show.bookedSeats = show.bookedSeats.filter(
        (seat) =>
          !booking.seats.some(
            (bookedSeat) =>
              bookedSeat.row === seat.row && bookedSeat.number === seat.number,
          ),
      );
      await show.save();
    }

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel Booking Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while cancelling booking",
    });
  }
};

// @desc    Get all bookings (Admin only)
// @route   GET /api/bookings
// @access  Private/Admin
const getAllBookings = async (req, res) => {
  try {
    const { status, limit } = req.query;

    let filter = {};
    if (status) filter.status = status;

    let query = Booking.find(filter)
      .populate("user", "name email phone")
      .populate("movie", "title poster")
      .populate("show", "date time theater")
      .sort({ bookingDate: -1 });

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const bookings = await query;

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get All Bookings Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching bookings",
    });
  }
};

// @desc    Get admin statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
// @desc    Get admin statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments({ status: "confirmed" });

    // 1. Basic Stats
    const revenueAgg = await Booking.aggregate([
      { $match: { status: "confirmed" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
          tickets: { $sum: { $size: "$seats" } }
        }
      },
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const totalTickets = revenueAgg[0]?.tickets || 0;

    const totalUsers = await require("../models/User").countDocuments({ role: "customer" });
    const totalMovies = await Movie.countDocuments({ isActive: true });

    // 2. Chart 1: Daily Revenue Raw
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRevenueRaw = await Booking.aggregate([
      { $match: { status: "confirmed", bookingDate: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$bookingDate" } },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueData = dailyRevenueRaw.map((item) => {
      const d = new Date(item._id);
      return {
        date: d.toLocaleDateString("en-US", { weekday: "short" }),
        revenue: item.revenue,
      };
    });

    // 3. Chart 2: Top Movies
    const topMoviesRaw = await Booking.aggregate([
      { $match: { status: "confirmed" } },
      {
        $group: {
          _id: "$movie",
          tickets: { $sum: { $size: "$seats" } },
        },
      },
      { $sort: { tickets: -1 } },
      { $limit: 4 },
      {
        $lookup: {
          from: "movies",
          localField: "_id",
          foreignField: "_id",
          as: "movieDetails",
        },
      },
      {
        $project: {
          title: { $arrayElemAt: ["$movieDetails.title", 0] },
          tickets: 1,
        },
      },
    ]);

    const movieStatsData = topMoviesRaw.map((m) => ({
      name: m.title || "Unknown",
      value: m.tickets,
    }));

    // 4. Chart 3: Format Popularity
    const formatStatsData = await Booking.aggregate([
      { $match: { status: "confirmed" } },
      { $lookup: { from: "shows", localField: "show", foreignField: "_id", as: "showDetails" } },
      { $unwind: "$showDetails" },
      { $group: { _id: "$showDetails.format", value: { $sum: "$totalAmount" } } },
      { $project: { name: { $ifNull: ["$_id", "2D"] }, value: 1, _id: 0 } },
      { $sort: { value: -1 } }
    ]);

    // ---------------------------------------------------------
    // 🟢 DYNAMIC PERCENTAGE MATH (Current 30 Days vs Previous 30 Days)
    // ---------------------------------------------------------
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Get stats for the last 30 days
    const currentPeriod = await Booking.aggregate([
      { $match: { status: "confirmed", bookingDate: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, revenue: { $sum: "$totalAmount" }, bookings: { $sum: 1 }, tickets: { $sum: { $size: "$seats" } } } }
    ]);

    // Get stats for the 30 days before that
    const prevPeriod = await Booking.aggregate([
      { $match: { status: "confirmed", bookingDate: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
      { $group: { _id: null, revenue: { $sum: "$totalAmount" }, bookings: { $sum: 1 }, tickets: { $sum: { $size: "$seats" } } } }
    ]);

    // Helper function to calculate percentage change safely
    const calcChange = (current, previous) => {
      if (!previous || previous === 0) return current > 0 ? 100 : 0;
      return (((current - previous) / previous) * 100).toFixed(1);
    };

    const currStats = currentPeriod[0] || { revenue: 0, bookings: 0, tickets: 0 };
    const prvStats = prevPeriod[0] || { revenue: 0, bookings: 0, tickets: 0 };

    const percentageChanges = {
      revenue: parseFloat(calcChange(currStats.revenue, prvStats.revenue)),
      bookings: parseFloat(calcChange(currStats.bookings, prvStats.bookings)),
      tickets: parseFloat(calcChange(currStats.tickets, prvStats.tickets)),
      avgValue: parseFloat(calcChange(
        currStats.bookings > 0 ? currStats.revenue / currStats.bookings : 0,
        prvStats.bookings > 0 ? prvStats.revenue / prvStats.bookings : 0
      ))
    };
    // ---------------------------------------------------------

    res.status(200).json({
      success: true,
      stats: {
        totalBookings,
        totalRevenue,
        totalUsers,
        totalMovies,
        totalTickets,
        revenueData,
        movieStatsData,
        formatStatsData,
        changes: percentageChanges
      },
    });
  } catch (error) {
    console.error("Get Admin Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching statistics",
    });
  }
};

// @desc    Get admin reports with dynamic date range percentage changes
// @route   GET /api/admin/reports
// @access  Private/Admin
const getAdminReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // 1. Calculate Current Period Filter
    let currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - 30); // Default to last 30 days
    let currentEnd = new Date();

    if (startDate && endDate) {
      currentStart = new Date(startDate);
      currentEnd = new Date(endDate);
      // Set to end of day to capture all bookings on the final day
      currentEnd.setHours(23, 59, 59, 999); 
    }

    const dateFilter = {
      bookingDate: { $gte: currentStart, $lte: currentEnd },
    };

    // 2. Calculate PREVIOUS Period Filter (for custom % change)
    // Find out how many days the user selected
    const diffTime = Math.abs(currentEnd - currentStart);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    // Shift dates backward by that exact number of days
    const prevEnd = new Date(currentStart);
    const prevStart = new Date(currentStart);
    prevStart.setDate(prevStart.getDate() - diffDays);

    const prevDateFilter = {
      bookingDate: { $gte: prevStart, $lt: prevEnd },
    };

    // 3. Current Period Totals
    const totalStats = await Booking.aggregate([
      { $match: { status: "confirmed", ...dateFilter } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalBookings: { $sum: 1 },
          totalTickets: { $sum: { $size: "$seats" } },
        },
      },
    ]);

    const stats = totalStats[0] || { totalRevenue: 0, totalBookings: 0, totalTickets: 0 };
    const currentAvg = stats.totalBookings > 0 ? stats.totalRevenue / stats.totalBookings : 0;

    // 4. Previous Period Totals
    const prevTotalStats = await Booking.aggregate([
      { $match: { status: "confirmed", ...prevDateFilter } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalBookings: { $sum: 1 },
          totalTickets: { $sum: { $size: "$seats" } },
        },
      },
    ]);

    const prevStats = prevTotalStats[0] || { totalRevenue: 0, totalBookings: 0, totalTickets: 0 };
    const prevAvg = prevStats.totalBookings > 0 ? prevStats.totalRevenue / prevStats.totalBookings : 0;

    // 5. Calculate Percentage Changes
    const calcChange = (current, previous) => {
      if (!previous || previous === 0) return current > 0 ? 100 : 0;
      return (((current - previous) / previous) * 100).toFixed(1);
    };

    const changes = {
      revenue: parseFloat(calcChange(stats.totalRevenue, prevStats.totalRevenue)),
      bookings: parseFloat(calcChange(stats.totalBookings, prevStats.totalBookings)),
      tickets: parseFloat(calcChange(stats.totalTickets, prevStats.totalTickets)),
      avgValue: parseFloat(calcChange(currentAvg, prevAvg)),
    };

    // 6. Top performing movies
    const topMoviesRaw = await Booking.aggregate([
      { $match: { status: "confirmed", ...dateFilter } },
      {
        $group: {
          _id: "$movie",
          bookings: { $sum: 1 },
          tickets: { $sum: { $size: "$seats" } },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      { $lookup: { from: "movies", localField: "_id", foreignField: "_id", as: "movieDetails" } },
      {
        $project: {
          title: { $arrayElemAt: ["$movieDetails.title", 0] },
          bookings: 1,
          tickets: 1,
          revenue: 1,
        },
      },
    ]);

    // 7. Recent transactions
    const recentTransactions = await Booking.find({ ...dateFilter })
      .populate("user", "name")
      .populate("movie", "title")
      .sort({ bookingDate: -1 })
      .limit(20)
      .select("bookingId user movie seats totalAmount status bookingDate");

    const formattedTransactions = recentTransactions.map((t) => ({
      date: t.bookingDate,
      bookingId: t.bookingId,
      customer: t.user?.name || "N/A",
      movie: t.movie?.title || "N/A",
      tickets: t.seats?.length || 0,
      amount: t.totalAmount,
      status: t.status,
    }));

    // Send everything to the frontend!
    res.status(200).json({
      success: true,
      report: {
        ...stats,
        avgBookingValue: currentAvg,
        changes, // 🟢 This magically feeds your custom % UI!
        topMovies: topMoviesRaw,
        recentTransactions: formattedTransactions,
      },
    });
  } catch (error) {
    console.error("Get Admin Reports Error:", error);
    res.status(500).json({ success: false, message: "Server error while generating reports" });
  }
};

module.exports = {
  createBooking,
  verifyPayment,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  getAdminStats,
  getAdminReports,
  createRazorpayOrder,
};
