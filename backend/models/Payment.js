const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'stripe', 'wallet', 'cash'],
      required: [true, 'Payment method is required'],
    },
    paymentAmount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    paymentGateway: {
      type: String,
      enum: ['razorpay', 'stripe', 'internal'],
      default: 'razorpay',
    },
    orderId: {
      type: String,
      trim: true,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: '',
      trim: true,
    },
    failureCode: {
      type: String,
      default: '',
      trim: true,
    },
    refundStatus: {
      type: String,
      enum: ['none', 'initiated', 'processing', 'completed', 'failed'],
      default: 'none',
    },
    refundAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    refundTransactionId: {
      type: String,
      default: '',
      trim: true,
    },
    refundDate: {
      type: Date,
      default: null,
    },
    refundReason: {
      type: String,
      default: '',
      trim: true,
    },
    paymentNotes: {
      type: String,
      default: '',
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
paymentSchema.index({ booking: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ paymentDate: -1 });

// Method to mark payment as completed
paymentSchema.methods.markAsCompleted = function (transactionId) {
  this.paymentStatus = 'completed';
  this.transactionId = transactionId;
  this.paymentDate = new Date();
  return this;
};

// Method to mark payment as failed
paymentSchema.methods.markAsFailed = function (failureReason, failureCode) {
  this.paymentStatus = 'failed';
  this.failureReason = failureReason;
  this.failureCode = failureCode;
  return this;
};

// Method to initiate refund
paymentSchema.methods.initiateRefund = function (refundAmount, reason) {
  if (refundAmount > this.paymentAmount) {
    throw new Error('Refund amount cannot exceed payment amount');
  }
  this.refundStatus = 'initiated';
  this.refundAmount = refundAmount;
  this.refundReason = reason;
  return this;
};

// Method to complete refund
paymentSchema.methods.completeRefund = function (refundTransactionId) {
  this.refundStatus = 'completed';
  this.refundTransactionId = refundTransactionId;
  this.refundDate = new Date();
  return this;
};

// Method to get payment details
paymentSchema.methods.getPaymentDetails = function () {
  return {
    paymentId: this._id,
    booking: this.booking,
    user: this.user,
    amount: this.paymentAmount,
    status: this.paymentStatus,
    method: this.paymentMethod,
    transactionId: this.transactionId,
    paymentDate: this.paymentDate,
  };
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
