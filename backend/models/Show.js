const mongoose = require("mongoose");

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: [true, "Please provide a movie reference"],
    },
    startDate: {
      type: Date,
      required: [true, "Please provide start date"],
    },
    endDate: {
      type: Date,
      required: [true, "Please provide end date"],
    },
    timeSlots: {
      type: [String],
      required: [true, "Please provide time slots"],
    },

    theater: {
      type: String,
      required: [true, "Please provide a theater name"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Please provide a theater location"],
      trim: true,
    },
    format: {
      type: String,
      enum: ["2D", "3D", "IMAX", "4DX"],
      default: "2D",
    },
    price: {
      type: Number,
      required: [true, "Please provide ticket price"],
      min: [0, "Price cannot be negative"],
    },
    totalSeats: {
      type: Number,
      required: [true, "Please provide total seats"],
      min: [1, "Total seats must be at least 1"],
      default: 120, // Default: 10 rows × 12 seats
    },
    bookedSeats: {
      type: [
        {
          date: {
            type: Date,
            required: true,
          },
          time: {
            type: String,
            required: true,
          },
          seats: [
            {
              row: String,
              number: Number,
            },
          ],
        },
      ],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to ensure unique shows
showSchema.index({ movie: 1, theater: 1, startDate: 1, endDate: 1 });
showSchema.index({ startDate: 1, endDate: 1 });
showSchema.index({ isActive: 1 });


// Virtual for available seats
showSchema.virtual("availableSeats").get(function () {
  // FIX: Check if bookedSeats exists before reading length
 showSchema.virtual('availableSeats').get(function () {
  return this.totalSeats;
});

});

// Method to check if show is full


// Method to check if seat is booked


// Method to book seats


// Ensure virtual fields are included in JSON
showSchema.set("toJSON", { virtuals: true });
showSchema.set("toObject", { virtuals: true });

const Show = mongoose.model("Show", showSchema);

module.exports = Show;
