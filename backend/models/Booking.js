const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie reference is required'],
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: [true, 'Show reference is required'],
    },
    seats: [
      {
        row: {
          type: String,
          required: true,
        },
        number: {
          type: Number,
          required: true,
        },
      },
    ],
    email: {
      type: String,
      required: [true, 'Email is required'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    convenienceFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'stripe', 'wallet', 'cash'],
      default: 'razorpay',
    },
    paymentId: {
      type: String,
      default: null,
    },
    orderId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'pending', 'expired'],
      default: 'pending',
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
bookingSchema.index({ user: 1, bookingDate: -1 });
bookingSchema.index({ show: 1 });
bookingSchema.index({ movie: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ paymentStatus: 1 });

// Generate unique booking ID before saving
bookingSchema.pre('save', async function (next) {
  if (!this.bookingId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.bookingId = `BK${timestamp}${random}`;
  }
  next();
});

// Method to calculate total amount
bookingSchema.methods.calculateTotal = function (ticketPrice, seatCount) {
  this.basePrice = ticketPrice * seatCount;
  this.convenienceFee = this.basePrice * 0.05; // 5% convenience fee
  this.tax = this.basePrice * 0.18; // 18% GST
  this.totalAmount = this.basePrice + this.convenienceFee + this.tax;
  return this.totalAmount;
};

// Method to confirm booking
bookingSchema.methods.confirmBooking = function (paymentId, orderId) {
  this.status = 'confirmed';
  this.paymentStatus = 'completed';
  this.paymentId = paymentId;
  this.orderId = orderId;
  return this.save();
};

// Method to cancel booking
bookingSchema.methods.cancelBooking = async function () {
  // Only allow cancellation if show hasn't started
  await this.populate('show');
  
  if (this.show.isPast()) {
    throw new Error('Cannot cancel booking for past shows');
  }

  this.status = 'cancelled';
  return this.save();
};

// Static method to get user bookings
bookingSchema.statics.getUserBookings = function (userId, filter = {}) {
  return this.find({ user: userId, ...filter })
    .populate('movie', 'title poster duration')
    .populate('show', 'date time theater location format')
    .sort({ bookingDate: -1 });
};

// Static method to get booking by ID with details
bookingSchema.statics.getBookingDetails = function (bookingId) {
  return this.findOne({ bookingId })
    .populate('user', 'name email phone')
    .populate('movie', 'title poster duration genres languages')
    .populate('show', 'date time theater location format price');
};

// Ensure virtual fields are included
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;