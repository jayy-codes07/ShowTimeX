const mongoose = require("mongoose");

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    theater: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    format: { type: String, enum: ["2D", "3D", "IMAX", "4DX"], default: "2D" },
    
    // Core Date/Time fields
    date: { type: Date, required: true },
    time: { type: String, required: true },
    
    price: { type: Number, required: true, min: 0 },
    totalSeats: { type: Number, required: true, min: 1, default: 120 },

    // Your Custom Complex Structure (Kept as requested)
    bookedSeats: {
      type: [
        {
          date: { type: Date }, 
          time: { type: String }, 
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
    // Temporary seat holds to prevent double booking
    seatLocks: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          seats: [
            {
              row: String,
              number: Number,
            },
          ],
          expiresAt: { type: Date, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes
showSchema.index({ theater: 1, date: 1, time: 1 }, { unique: true });
showSchema.index({ movie: 1, date: 1 });
showSchema.index({ isActive: 1 });

// --- VIRTUALS ---
showSchema.virtual("availableSeats").get(function () {
  if (!this.bookedSeats) return this.totalSeats;
  const totalBooked = this.bookedSeats.reduce((acc, group) => {
    return acc + (group.seats ? group.seats.length : 0);
  }, 0);
  return this.totalSeats - totalBooked;
});

// --- HELPER METHODS (Required for your Controller) ---

// 1. Check if show is in the past
showSchema.methods.isPast = function () {
  const now = new Date();
  const showDateTime = this.getShowDateTime();
  return now > showDateTime;
};

// Combine date + time into a single Date for accurate comparisons
showSchema.methods.getShowDateTime = function () {
  const baseDate = new Date(this.date);
  if (!this.time || typeof this.time !== "string") {
    return baseDate;
  }

  const timeStr = this.time.trim();
  const match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridiem = match12[3].toUpperCase();
    if (hours === 12) hours = 0;
    if (meridiem === "PM") hours += 12;
    baseDate.setHours(hours, minutes, 0, 0);
    return baseDate;
  }

  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    baseDate.setHours(hours, minutes, 0, 0);
    return baseDate;
  }

  return baseDate;
};

// 2. Check if specific seats are already booked
showSchema.methods.isSeatBooked = function (targetRow, targetNumber) {
  // Loop through the nested structure
  for (const group of this.bookedSeats) {
    for (const seat of group.seats) {
      if (seat.row === targetRow && seat.number === targetNumber) {
        return true;
      }
    }
  }
  return false;
};

// 3. Book new seats (Adds to the complex structure)
showSchema.methods.bookSeats = function (newSeatsArray) {
  // We create a new "Booking Group" block
  this.bookedSeats.push({
    date: this.date,
    time: this.time,
    seats: newSeatsArray
  });
};

showSchema.set("toJSON", { virtuals: true });
showSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Show", showSchema);
