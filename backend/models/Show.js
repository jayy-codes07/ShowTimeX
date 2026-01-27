const mongoose = require('mongoose');

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Please provide a movie reference'],
    },
    date: {
      type: Date,
      required: [true, 'Please provide a show date'],
    },
    time: {
      type: String,
      required: [true, 'Please provide a show time'],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s?(AM|PM)$/i,
        'Please provide time in format HH:MM AM/PM',
      ],
    },
    theater: {
      type: String,
      required: [true, 'Please provide a theater name'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Please provide a theater location'],
      trim: true,
    },
    format: {
      type: String,
      enum: ['2D', '3D', 'IMAX', '4DX'],
      default: '2D',
    },
    price: {
      type: Number,
      required: [true, 'Please provide ticket price'],
      min: [0, 'Price cannot be negative'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'Please provide total seats'],
      min: [1, 'Total seats must be at least 1'],
      default: 120, // Default: 10 rows × 12 seats
    },
    bookedSeats: {
      type: [
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
      default: [], 
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique shows
showSchema.index({ movie: 1, date: 1, time: 1, theater: 1 }, { unique: true });

// Index for querying
showSchema.index({ date: 1, time: 1 });
showSchema.index({ theater: 1 });
showSchema.index({ isActive: 1 });

// Virtual for available seats
showSchema.virtual('availableSeats').get(function () {
  // FIX: Check if bookedSeats exists before reading length
  const bookedCount = this.bookedSeats ? this.bookedSeats.length : 0;
  return this.totalSeats - bookedCount;
});

// Method to check if show is full
showSchema.methods.isFull = function () {
  return this.bookedSeats.length >= this.totalSeats;
};

// Method to check if seat is booked
showSchema.methods.isSeatBooked = function (row, number) {
  return this.bookedSeats.some(
    (seat) => seat.row === row && seat.number === number
  );
};

// Method to book seats
showSchema.methods.bookSeats = function (seats) {
  // Validate seats are not already booked
  for (const seat of seats) {
    if (this.isSeatBooked(seat.row, seat.number)) {
      throw new Error(`Seat ${seat.row}${seat.number} is already booked`);
    }
  }

  // Check if enough seats available
  if (this.bookedSeats.length + seats.length > this.totalSeats) {
    throw new Error('Not enough seats available');
  }

  // Add seats to booked seats
  this.bookedSeats.push(...seats);
  return this.bookedSeats;
};

// Method to check if show is in the past
showSchema.methods.isPast = function () {
  const showDateTime = new Date(this.date);
  const [time, period] = this.time.split(' ');
  const [hours, minutes] = time.split(':');
  let hour = parseInt(hours);

  if (period.toUpperCase() === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }

  showDateTime.setHours(hour, parseInt(minutes), 0, 0);

  return showDateTime < new Date();
};

// Ensure virtual fields are included in JSON
showSchema.set('toJSON', { virtuals: true });
showSchema.set('toObject', { virtuals: true });

const Show = mongoose.model('Show', showSchema);

module.exports = Show;