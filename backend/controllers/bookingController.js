const crypto = require("crypto");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Show = require("../models/Show");
const Movie = require("../models/Movie");
const User = require("../models/User");
const { triggerN8n } = require('../n8nService');
const Razorpay = require("razorpay");
const {
  uniqueSeats,
  getActiveLocks,
  isSeatLockedByOther,
  upsertUserLock,
  removeUserLockedSeats,
  atomicLockSeats,
} = require("../utils/seatLocks");

const DEFAULT_LOCK_MINUTES = parseInt(process.env.SEAT_LOCK_MINUTES || "10", 10);
const MIN_BOOKING_LEAD_MINUTES = parseInt(process.env.MIN_BOOKING_LEAD_MINUTES || "60", 10);
const MIN_BOOKING_LEAD_MS = MIN_BOOKING_LEAD_MINUTES * 60 * 1000;
const REFUND_PERCENTAGE_HIGH = 90;
const REFUND_PERCENTAGE_STANDARD = 70;
const REFUND_PERCENTAGE_LAST_MINUTE = 50;

const roundCurrency = (value) => Number((Number(value) || 0).toFixed(2));

const getShowDateTime = (show) =>
  typeof show?.getShowDateTime === "function" ? show.getShowDateTime() : new Date(show?.date);

const isBookingClosedForShow = (show) => {
  const showDateTime = getShowDateTime(show);
  const msUntilShow = showDateTime.getTime() - Date.now();
  return !Number.isFinite(msUntilShow) || msUntilShow <= MIN_BOOKING_LEAD_MS;
};

const getCancellationRefundPolicy = (show, totalAmount) => {
  if (!show) {
    return null;
  }

  const showDateTime =
    typeof show.getShowDateTime === "function" ? show.getShowDateTime() : new Date(show.date);
  const msUntilShow = showDateTime.getTime() - Date.now();

  if (!Number.isFinite(msUntilShow) || msUntilShow <= 0) {
    return null;
  }

  const hoursBeforeShow = msUntilShow / (1000 * 60 * 60);
  let percentage = REFUND_PERCENTAGE_LAST_MINUTE;

  if (hoursBeforeShow > 24) {
    percentage = REFUND_PERCENTAGE_HIGH;
  } else if (hoursBeforeShow >= 12) {
    percentage = REFUND_PERCENTAGE_STANDARD;
  }

  return {
    percentage,
    hoursBeforeShow: roundCurrency(hoursBeforeShow),
    eligibleAmount: roundCurrency((Number(totalAmount) || 0) * (percentage / 100)),
  };
};

const getDayRange = (dateString) => {
  const start = new Date(dateString);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  start.setHours(0, 0, 0, 0);
  return { start, end };
};

const removeSeatsFromShow = async (showId, seats, userId) => {
  if (!showId || !Array.isArray(seats) || seats.length === 0) {
    return null;
  }

  const show = await Show.findById(showId);
  if (!show) return null;

  const seatsToRemove = new Set(
    seats.map((s) => `${s.row}:${s.number}`)
  );

  const updatedBookedSeats = [];
  for (const entry of show.bookedSeats || []) {
    if (entry && Array.isArray(entry.seats)) {
      const remainingSeats = entry.seats.filter(
        (s) => !seatsToRemove.has(`${s.row}:${s.number}`)
      );
      if (remainingSeats.length > 0) {
        updatedBookedSeats.push({ ...entry.toObject?.() || entry, seats: remainingSeats });
      }
      continue;
    }

    if (entry && entry.row) {
      const key = `${entry.row}:${entry.number}`;
      if (!seatsToRemove.has(key)) {
        updatedBookedSeats.push(entry);
      }
    }
  }

  show.bookedSeats = updatedBookedSeats;
  removeUserLockedSeats(show, userId, seats);
  await show.save();
  return show;
};

const createRazorpayOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Check if keys are configured

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

    const bookingShow = await Show.findById(booking.show);
    if (!bookingShow) {
      return res
        .status(404)
        .json({ success: false, message: "Show not found" });
    }

    if (isBookingClosedForShow(bookingShow)) {
      return res.status(400).json({
        success: false,
        message: `Bookings close ${MIN_BOOKING_LEAD_MINUTES} minutes before showtime`,
      });
    }

    // Validate payment amount
    if (!booking.totalAmount || booking.totalAmount <= 0 || typeof booking.totalAmount !== 'number') {
      return res.status(400).json({
        success: false,
        message: "Invalid booking amount",
      });
    }

    // 3. Create the order
    const order = await razorpay.orders.create({
      amount: booking.totalAmount * 100,
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
    const { movieId, showId, seats, email, phone } = req.body;
    const seatsToBook = uniqueSeats(seats);

    // Validate required fields
    if (!movieId || !showId || !seats || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (!Array.isArray(seats) || seatsToBook.length === 0) {
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

    // Block booking once the lead-time cutoff window is reached.
    if (isBookingClosedForShow(show)) {
      return res.status(400).json({
        success: false,
        message: `Bookings close ${MIN_BOOKING_LEAD_MINUTES} minutes before showtime`,
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
    for (const seat of seatsToBook) {
      if (show.isSeatBooked(seat.row, seat.number)) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seat.row}${seat.number} is already booked`,
        });
      }
    }

    const activeLocks = getActiveLocks(show);
    for (const seat of seatsToBook) {
      if (isSeatLockedByOther(activeLocks, seat, req.user._id)) {
        return res.status(409).json({
          success: false,
          message: `Seat ${seat.row}${seat.number} is temporarily locked`,
        });
      }
    }

    // Check if enough seats available (No need for extra variables now)
    // Check if enough seats available
    // FIX: Use availableSeats virtual because bookedSeats.length is not accurate for nested arrays
    if (show.availableSeats < seatsToBook.length) {
      return res.status(400).json({
        success: false,
        message: "Not enough seats available",
      });
    }

    // Lock seats while user completes payment (ATOMIC operation)
    try {
      const lockedShow = await atomicLockSeats(Show, showId, req.user._id, seatsToBook, DEFAULT_LOCK_MINUTES);
      if (!lockedShow) {
        return res.status(409).json({
          success: false,
          message: "Failed to lock seats. They may have been booked by someone else.",
        });
      }
    } catch (lockError) {
      return res.status(409).json({
        success: false,
        message: lockError.message || "Could not lock seats. Please try again.",
      });
    }

    const bookingId = `BK-${Date.now()}-${Math.floor(10000 + Math.random() * 90000)}`;

    // Create booking
    const booking = new Booking({
      bookingId,
      user: req.user._id,
      movie: movieId,
      show: showId,
      seats: seatsToBook,
      email,
      phone,
      status: "pending", // 🔴 IMPORTANT
    });

    // Calculate total amount
    booking.calculateTotal(show.price, seatsToBook.length);

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

    // 🛠️ FIX: Check BOTH the custom bookingId and the MongoDB _id
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

    if (isBookingClosedForShow(booking.show)) {
      return res.status(400).json({
        success: false,
        message: `Bookings close ${MIN_BOOKING_LEAD_MINUTES} minutes before showtime`,
      });
    }

    // ✅ Idempotency check: If already confirmed, return success (for webhook retries)
    if (booking.status === "confirmed" && booking.paymentStatus === "completed") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified for this booking",
        booking,
      });
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

    const activeLocks = getActiveLocks(booking.show);
    for (const seat of booking.seats || []) {
      if (booking.show.isSeatBooked(seat.row, seat.number)) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seat.row}${seat.number} is already booked`,
        });
      }
      if (isSeatLockedByOther(activeLocks, seat, booking.user)) {
        return res.status(409).json({
          success: false,
          message: `Seat ${seat.row}${seat.number} is temporarily locked`,
        });
      }
    }

    // ✅ Start atomic operations: Book seats AND confirm booking
    try {
      // ✅ NOW book seats
      booking.show.bookSeats(booking.seats);
      removeUserLockedSeats(booking.show, booking.user, booking.seats);
      await booking.show.save();

      // ✅ Confirm booking
      booking.status = "confirmed";
      booking.paymentStatus = "completed";
      booking.orderId = razorpay_order_id;
      booking.paymentId = razorpay_payment_id;
      await booking.save();
    } catch (atomicError) {
      // If atomic operations fail, clean up
      console.error("Payment confirmation atomic operation failed:", atomicError);
      // Attempt to rollback show updates
      booking.show.save().catch(e => console.error("Rollback failed:", e));
      throw atomicError;
    }

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
    const { id } = req.params;
    let booking = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      booking = await Booking.findById(id)
        .populate("user", "name email phone")
        .populate("movie", "title poster duration genres languages")
        .populate("show", "date time theater location format price");
    }

    if (!booking) {
      booking = await Booking.findOne({ bookingId: id })
        .populate("user", "name email phone")
        .populate("movie", "title poster duration genres languages")
        .populate("show", "date time theater location format price");
    }

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
    await removeSeatsFromShow(booking.show?._id || booking.show, booking.seats || [], booking.user);

    let refundDetails = null;
    if (booking.paymentStatus === "completed" && booking.refundStatus === "none") {
      refundDetails =
        getCancellationRefundPolicy(booking.show, booking.totalAmount) || {
          percentage: REFUND_PERCENTAGE_LAST_MINUTE,
          hoursBeforeShow: null,
          eligibleAmount: roundCurrency((Number(booking.totalAmount) || 0) * (REFUND_PERCENTAGE_LAST_MINUTE / 100)),
        };

      booking.refundStatus = "initiated";
      booking.refundRequestedBy = "user";
      booking.refundReason = req.body.reason || "User requested cancellation";
      booking.refundNote = req.body.additionalNote || "";
      booking.refundInitiatedAt = new Date();
      booking.refundPercentage = refundDetails?.percentage || 0;
      booking.refundEligibleAmount = refundDetails?.eligibleAmount || 0;
      booking.refundHoursBeforeShow = refundDetails?.hoursBeforeShow ?? null;
      await booking.save();
    }

    res.status(200).json({
      success: true,
      message:
        booking.paymentStatus === "completed"
          ? `Booking cancelled. ${refundDetails?.percentage || REFUND_PERCENTAGE_LAST_MINUTE}% refund of ₹${(
              refundDetails?.eligibleAmount || 0
            ).toFixed(2)} has been initiated and will reflect in 2-3 working days.`
          : "Booking cancelled successfully",
      refund: refundDetails,
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
    const {
      status,
      paymentStatus,
      refundStatus,
      movieId,
      theater,
      date,
      search,
      page,
      limit,
    } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (refundStatus) filter.refundStatus = refundStatus;
    if (movieId) filter.movie = movieId;

    if (date) {
      const dayRange = getDayRange(date);
      if (dayRange) {
        filter.bookingDate = { $gte: dayRange.start, $lte: dayRange.end };
      }
    }

    if (theater) {
      const matchingShows = await Show.find({
        theater: { $regex: theater, $options: "i" },
      }).select("_id");

      filter.show = { $in: matchingShows.map((show) => show._id) };
    }

    const shouldPaginate = page !== undefined || limit !== undefined;

    let query = Booking.find(filter)
      .populate("user", "name email phone")
      .populate("movie", "title poster")
      .populate("show", "date time theater")
      .sort({ bookingDate: -1 });

    if (search) {
      // Escape special regex characters to prevent ReDoS attacks
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, "i");
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select("_id");

      query = query.or([
        { bookingId: searchRegex },
        { user: { $in: matchingUsers.map((user) => user._id) } },
      ]);
    }

    if (!shouldPaginate && limit) {
      query = query.limit(parseInt(limit, 10));
      const bookings = await query;

      return res.status(200).json({
        success: true,
        count: bookings.length,
        bookings,
      });
    }

    if (!shouldPaginate) {
      const bookings = await query;

      return res.status(200).json({
        success: true,
        count: bookings.length,
        bookings,
      });
    }

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;
    const total = await Booking.countDocuments(query.getFilter());

    query = query.skip(skip).limit(parsedLimit);

    const bookings = await query;

    res.status(200).json({
      success: true,
      total,
      page: parsedPage,
      limit: parsedLimit,
      hasMore: skip + bookings.length < total,
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

// @desc    Initiate booking refund (Admin)
// @route   PATCH /api/admin/bookings/:id/refund
// @access  Private/Admin
const initiateBookingRefund = async (req, res) => {
  try {
    const { approvalNote, refundedAmount, action } = req.body;

    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email")
      .populate("movie", "title")
      .populate("show", "date time theater");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.paymentStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Refund can be initiated only for completed payments",
      });
    }

    if (booking.refundStatus === "processing" || booking.refundStatus === "refunded") {
      return res.status(400).json({
        success: false,
        message: "Refund is already in progress or completed for this booking",
      });
    }

    if (action === "decline") {
      if (!["initiated", "processing"].includes(booking.refundStatus)) {
        return res.status(400).json({
          success: false,
          message: "Only initiated or processing refunds can be declined",
        });
      }

      booking.refundStatus = "failed";
      booking.refundFinalStatus = "failed";
      booking.refundApprovalNote = (approvalNote || "").trim();
      booking.refundApprovedBy = req.user._id;
      booking.refundApprovedAt = new Date();
      booking.refundCompletedAt = new Date();

      await booking.save();

      return res.status(200).json({
        success: true,
        message: "Refund declined successfully.",
        booking,
      });
    }

    const parsedRefundedAmount = Number(refundedAmount);
    const defaultRefundAmount =
      booking.refundStatus === "initiated" && booking.refundEligibleAmount > 0
        ? booking.refundEligibleAmount
        : booking.totalAmount;
    const finalRefundAmount =
      Number.isFinite(parsedRefundedAmount) && parsedRefundedAmount > 0
        ? parsedRefundedAmount
        : defaultRefundAmount;

    // Validate refund amount doesn't exceed total amount
    const maxRefundAmount = booking.totalAmount - (booking.refundedAmount || 0);
    if (finalRefundAmount > maxRefundAmount) {
      return res.status(400).json({
        success: false,
        message: `Refund amount ₹${finalRefundAmount} exceeds available refund amount ₹${maxRefundAmount}`,
      });
    }

    // Approve user-initiated refund
    if (booking.refundStatus === "initiated") {
      booking.refundStatus = "refunded";
      booking.paymentStatus = "refunded";
      booking.refundApprovedBy = req.user._id;
      booking.refundApprovedAt = new Date();
      booking.refundApprovalNote = (approvalNote || "").trim();
      booking.refundedAmount = (booking.refundedAmount || 0) + finalRefundAmount;
      booking.refundEligibleAmount = booking.refundEligibleAmount || finalRefundAmount;
      booking.refundPercentage =
        booking.refundPercentage ||
        (booking.totalAmount > 0
          ? roundCurrency((finalRefundAmount / booking.totalAmount) * 100)
          : 0);
      booking.refundFinalStatus = "refunded";
      booking.refundCompletedAt = new Date();
      await booking.save();

      await triggerN8n("refund-initiated", {
        userName: booking.user?.name || "Customer",
        userEmail: booking.user?.email || booking.email,
        bookingId: booking.bookingId,
        movieTitle: booking.movie?.title || "Movie",
        showDate: booking.show?.date,
        showTime: booking.show?.time,
        theater: booking.show?.theater,
        reason: booking.refundReason,
        note: booking.refundNote,
        timeline: "Refund completed",
        amount: finalRefundAmount,
      });

      res.status(200).json({
        success: true,
        message: "Refund approved and marked as refunded.",
        booking,
      });
    } 
    // For future: admin-initiated refunds (none/failed status)
    else if ((booking.refundStatus === "none" || booking.refundStatus === "failed") && approvalNote) {
      booking.status = "cancelled";
      booking.refundStatus = "refunded";
      booking.paymentStatus = "refunded";
      booking.refundRequestedBy = "admin";
      booking.refundReason = approvalNote.trim() || "Cancelled by admin";
      booking.refundApprovedBy = req.user._id;
      booking.refundApprovedAt = new Date();
      booking.refundApprovalNote = approvalNote.trim();
      booking.refundInitiatedAt = new Date();
      booking.refundPercentage =
        booking.totalAmount > 0 ? roundCurrency((finalRefundAmount / booking.totalAmount) * 100) : 0;
      booking.refundEligibleAmount = finalRefundAmount;
      booking.refundedAmount = finalRefundAmount;
      booking.refundFinalStatus = "refunded";
      booking.refundCompletedAt = new Date();
      await booking.save();

      await removeSeatsFromShow(booking.show?._id || booking.show, booking.seats || [], booking.user);

      await triggerN8n("refund-initiated", {
        userName: booking.user?.name || "Customer",
        userEmail: booking.user?.email || booking.email,
        bookingId: booking.bookingId,
        movieTitle: booking.movie?.title || "Movie",
        showDate: booking.show?.date,
        showTime: booking.show?.time,
        theater: booking.show?.theater,
        reason: "Admin initiated refund",
        note: approvalNote,
        timeline: "Refund completed",
        amount: finalRefundAmount,
      });

      res.status(200).json({
        success: true,
        message: "Refund completed successfully.",
        booking,
      });
    }
    else {
      res.status(400).json({
        success: false,
        message: "Cannot process refund for this booking status",
      });
    }
  } catch (error) {
    console.error("Initiate Booking Refund Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while initiating refund",
    });
  }
};

// @desc    Resend booking ticket email (Admin)
// @route   POST /api/admin/bookings/:id/resend-ticket
// @access  Private/Admin
const resendBookingTicket = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email")
      .populate("movie", "title")
      .populate("show", "date time theater");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "confirmed" || booking.paymentStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Only confirmed and paid bookings can resend tickets",
      });
    }

    await triggerN8n("ticket-booked", {
      userName: booking.user?.name || "Customer",
      userEmail: booking.user?.email || booking.email,
      movieTitle: booking.movie?.title || "Movie",
      showDate: booking.show?.date,
      showTime: booking.show?.time,
      theater: booking.show?.theater,
      seats: (booking.seats || []).map((s) => `${s.row}${s.number}`),
      bookingId: booking.bookingId,
      totalAmount: booking.totalAmount,
      resentByAdmin: true,
    });

    res.status(200).json({
      success: true,
      message: "Ticket email resent successfully",
    });
  } catch (error) {
    console.error("Resend Booking Ticket Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resending ticket",
    });
  }
};

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

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalMovies,
      totalLoggedInUsers,
      loggedInToday,
      newUsersLast7Days,
      recentLoggedInUsers,
    ] = await Promise.all([
      User.countDocuments({ role: "customer" }),
      Movie.countDocuments({ isActive: true }),
      User.countDocuments({ role: "customer", lastLoginAt: { $ne: null } }),
      User.countDocuments({ role: "customer", lastLoginAt: { $gte: startOfToday } }),
      User.countDocuments({ role: "customer", createdAt: { $gte: sevenDaysAgo } }),
      User.find({ role: "customer", lastLoginAt: { $ne: null } })
        .sort({ lastLoginAt: -1 })
        .limit(6)
        .select("name email createdAt lastLoginAt"),
    ]);

    // 2. Chart 1: Daily Revenue Raw

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

    // 5. Chart 4: Genre Performance (Revenue by genre)
    const genrePerformanceData = await Booking.aggregate([
      { $match: { status: "confirmed" } },
      { $lookup: { from: "movies", localField: "movie", foreignField: "_id", as: "movieDetails" } },
      { $unwind: "$movieDetails" },
      { $unwind: "$movieDetails.genres" },
      { $group: { _id: "$movieDetails.genres", value: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
      { $project: { name: "$_id", value: 1, count: 1, _id: 0 } },
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
        totalLoggedInUsers,
        loggedInToday,
        newUsersLast7Days,
        recentLoggedInUsers,
        totalMovies,
        totalTickets,
        revenueData,
        movieStatsData,
        formatStatsData,
        genrePerformanceData,
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

// @desc    Get admin user insights
// @route   GET /api/admin/users
// @access  Private/Admin
const getAdminUserInsights = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalLoggedInUsers,
      loggedInToday,
      newUsersLast7Days,
      totalRecentUsers,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "customer", lastLoginAt: { $ne: null } }),
      User.countDocuments({ role: "customer", lastLoginAt: { $gte: startOfToday } }),
      User.countDocuments({ role: "customer", createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ role: "customer" }),
      User.find({ role: "customer" })
        .sort({ lastLoginAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .select("name email phone isActive createdAt lastLoginAt"),
    ]);

    res.status(200).json({
      success: true,
      insights: {
        totalUsers,
        totalLoggedInUsers,
        loggedInToday,
        newUsersLast7Days,
      },
      users: recentUsers,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: totalRecentUsers,
        hasMore: skip + recentUsers.length < totalRecentUsers,
      },
    });
  } catch (error) {
    console.error("Get Admin User Insights Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user insights",
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

    // 7. Recent transactions (with pagination)
    const { page = 1, limit = 10 } = req.query; // ✅ read page & limit
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ✅ Count total matching transactions
    const totalTransactions = await Booking.countDocuments({ ...dateFilter });

    const recentTransactions = await Booking.find({ ...dateFilter })
      .populate("user", "name")
      .populate("movie", "title")
      .sort({ bookingDate: -1 })
      .skip(skip)                    // ✅ skip records
      .limit(parseInt(limit))        // ✅ only fetch 10
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

    // ✅ Send pagination info with response
    res.status(200).json({
      success: true,
      report: {
        ...stats,
        avgBookingValue: currentAvg,
        changes,
        topMovies: topMoviesRaw,
        recentTransactions: formattedTransactions,
        pagination: {                                              // ✅ added
          total: totalTransactions,
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: skip + parseInt(limit) < totalTransactions,
        }
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
  initiateBookingRefund,
  resendBookingTicket,
  getAdminStats,
  getAdminUserInsights,
  getAdminReports,
  createRazorpayOrder,
};
