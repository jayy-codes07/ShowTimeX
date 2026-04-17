const mongoose = require('mongoose');

const showSeatSchema = new mongoose.Schema(
  {
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: [true, 'Show reference is required'],
    },
    seatRow: {
      type: String,
      required: [true, 'Seat row is required'],
      trim: true,
      match: [/^[A-Z]$/, 'Seat row must be a single uppercase letter'],
    },
    seatNumber: {
      type: Number,
      required: [true, 'Seat number is required'],
      min: [1, 'Seat number must be at least 1'],
    },
    seatStatus: {
      type: String,
      enum: ['available', 'booked', 'locked', 'blocked'],
      default: 'available',
    },
    seatType: {
      type: String,
      enum: ['normal', 'recliner', 'premium', 'wheelchair'],
      default: 'normal',
    },
    price: {
      type: Number,
      required: [true, 'Seat price is required'],
      min: [0, 'Price cannot be negative'],
    },
    isAisle: {
      type: Boolean,
      default: false,
    },
    isCorner: {
      type: Boolean,
      default: false,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    bookingDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index for show and seat position
showSeatSchema.index(
  { show: 1, seatRow: 1, seatNumber: 1 },
  { unique: true }
);

// Indexes for efficient queries
showSeatSchema.index({ show: 1, seatStatus: 1 });
showSeatSchema.index({ show: 1, seatType: 1 });
showSeatSchema.index({ booking: 1 });
showSeatSchema.index({ lockedUntil: 1 });

// Method to check if seat is available
showSeatSchema.methods.isAvailable = function () {
  // Check if seat is locked and lock has expired
  if (
    this.seatStatus === 'locked' &&
    this.lockedUntil &&
    new Date() > this.lockedUntil
  ) {
    this.seatStatus = 'available';
    this.lockedBy = null;
    this.lockedUntil = null;
    return true;
  }

  return this.seatStatus === 'available';
};

// Method to book a seat
showSeatSchema.methods.bookSeat = function (bookingId) {
  if (!this.isAvailable()) {
    throw new Error('Seat is not available for booking');
  }
  this.seatStatus = 'booked';
  this.booking = bookingId;
  this.bookingDate = new Date();
  this.lockedBy = null;
  this.lockedUntil = null;
  return this;
};

// Method to lock a seat
showSeatSchema.methods.lockSeat = function (userId, lockDurationMinutes = 15) {
  if (this.seatStatus !== 'available') {
    throw new Error('Seat cannot be locked - it is not available');
  }
  this.seatStatus = 'locked';
  this.lockedBy = userId;
  this.lockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
  return this;
};

// Method to unlock a seat
showSeatSchema.methods.unlockSeat = function () {
  this.seatStatus = 'available';
  this.lockedBy = null;
  this.lockedUntil = null;
  return this;
};

// Method to release booking
showSeatSchema.methods.releaseSeat = function () {
  this.seatStatus = 'available';
  this.booking = null;
  this.bookingDate = null;
  this.lockedBy = null;
  this.lockedUntil = null;
  return this;
};

// Method to block a seat (admin only)
showSeatSchema.methods.blockSeat = function () {
  this.seatStatus = 'blocked';
  return this;
};

// Method to get seat identifier
showSeatSchema.methods.getSeatId = function () {
  return `${this.seatRow}${this.seatNumber}`;
};

// Method to get seat details
showSeatSchema.methods.getSeatDetails = function () {
  return {
    seatId: this.getSeatId(),
    seatStatus: this.seatStatus,
    seatType: this.seatType,
    price: this.price,
    isAisle: this.isAisle,
    isCorner: this.isCorner,
  };
};

const ShowSeat = mongoose.model('ShowSeat', showSeatSchema);

module.exports = ShowSeat;
