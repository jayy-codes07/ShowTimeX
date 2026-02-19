const Booking = require("../models/Booking");
const Show = require("../models/Show");
const Movie = require("../models/Movie");

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
    booking.status = "confirmed";
    booking.paymentId = razorpay_payment_id;
    await booking.save();

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
const getAdminStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments({ status: "confirmed" });
    const totalRevenue = await Booking.aggregate([
      { $match: { status: "confirmed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const totalUsers = await require("../models/User").countDocuments({
      role: "customer",
    });
    const totalMovies = await Movie.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      stats: {
        totalBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalUsers,
        totalMovies,
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

// @desc    Get admin reports
// @route   GET /api/admin/reports
// @access  Private/Admin
const getAdminReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        bookingDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    // Top performing movies
    const topMovies = await Booking.aggregate([
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
          bookings: 1,
          tickets: 1,
          revenue: 1,
        },
      },
    ]);

    // Recent transactions
    const recentTransactions = await Booking.find({ ...dateFilter })
      .populate("user", "name")
      .populate("movie", "title")
      .populate("show", "date time")
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

    // Calculate totals
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

    const stats = totalStats[0] || {
      totalRevenue: 0,
      totalBookings: 0,
      totalTickets: 0,
    };

    res.status(200).json({
      success: true,
      report: {
        ...stats,
        avgBookingValue:
          stats.totalBookings > 0
            ? stats.totalRevenue / stats.totalBookings
            : 0,
        topMovies,
        recentTransactions: formattedTransactions,
      },
    });
    const dailyRevenue = await Booking.aggregate([
      {
        $match: { status: "confirmed" },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$bookingDate" },
          },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  } catch (error) {
    console.error("Get Admin Reports Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while generating reports",
    });
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
