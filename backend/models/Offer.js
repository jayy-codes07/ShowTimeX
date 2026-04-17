const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    offerName: {
      type: String,
      required: [true, 'Please provide an offer name'],
      trim: true,
      maxlength: [100, 'Offer name cannot exceed 100 characters'],
    },
    discountCode: {
      type: String,
      required: [true, 'Please provide a discount code'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9]{4,20}$/, 'Discount code must be 4-20 alphanumeric characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Please provide a discount value'],
      min: [0, 'Discount value cannot be negative'],
    },
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      required: [true, 'Please specify discount type: percentage or flat'],
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: [0, 'Max discount cannot be negative'],
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum purchase cannot be negative'],
    },
    validFrom: {
      type: Date,
      required: [true, 'Please provide valid from date'],
    },
    validUpto: {
      type: Date,
      required: [true, 'Please provide valid upto date'],
    },
    maxUsageLimit: {
      type: Number,
      default: null,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxUsagePerUser: {
      type: Number,
      default: 1,
      min: 1,
    },
    applicableOn: {
      type: String,
      enum: ['all', 'specific_movies', 'specific_shows'],
      default: 'all',
    },
    applicableMovies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
      },
    ],
    applicableShows: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Show',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    usedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        booking: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Booking',
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
        discountGiven: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
offerSchema.index({ discountCode: 1 });
offerSchema.index({ validFrom: 1, validUpto: 1 });
offerSchema.index({ isActive: 1 });

// Method to check if offer is valid
offerSchema.methods.isValid = function () {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.validFrom &&
    now <= this.validUpto &&
    (!this.maxUsageLimit || this.usedCount < this.maxUsageLimit)
  );
};

// Method to calculate discount amount
offerSchema.methods.calculateDiscount = function (amount) {
  let discount = 0;

  if (amount < this.minPurchaseAmount) {
    return 0; // Offer not applicable
  }

  if (this.discountType === 'percentage') {
    discount = (amount * this.discountValue) / 100;
    if (this.maxDiscountAmount) {
      discount = Math.min(discount, this.maxDiscountAmount);
    }
  } else if (this.discountType === 'flat') {
    discount = Math.min(this.discountValue, amount);
  }

  return discount;
};

// Method to check if user can use this offer
offerSchema.methods.canUserUseOffer = function (userId) {
  if (!this.isValid()) {
    return false;
  }

  if (this.maxUsagePerUser) {
    const userUsageCount = this.usedBy.filter(
      (usage) => usage.user.toString() === userId.toString()
    ).length;
    return userUsageCount < this.maxUsagePerUser;
  }

  return true;
};

// Method to mark offer as used
offerSchema.methods.markAsUsed = function (userId, bookingId, discountGiven) {
  this.usedBy.push({
    user: userId,
    booking: bookingId,
    discountGiven: discountGiven,
  });
  this.usedCount += 1;
  return this;
};

// Method to check if offer applies to specific movie
offerSchema.methods.appliesToMovie = function (movieId) {
  if (this.applicableOn === 'all') {
    return true;
  }
  if (this.applicableOn === 'specific_movies') {
    return this.applicableMovies.some(
      (id) => id.toString() === movieId.toString()
    );
  }
  return false;
};

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;
