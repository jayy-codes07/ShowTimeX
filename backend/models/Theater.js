const mongoose = require('mongoose');

const theaterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide theater name'],
      trim: true,
      maxlength: [100, 'Theater name cannot exceed 100 characters'],
    },
    location: {
      type: String,
      required: [true, 'Please provide theater location'],
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    city: {
      type: String,
      required: [true, 'Please provide city name'],
      trim: true,
    },
    state: {
      type: String,
      default: '',
      trim: true,
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    postalCode: {
      type: String,
      default: '',
      trim: true,
      match: [/^[0-9]{6}$/, 'Please provide a valid 6-digit postal code'],
    },
    latitude: {
      type: Number,
      default: null,
      min: [-90, 'Invalid latitude'],
      max: [90, 'Invalid latitude'],
    },
    longitude: {
      type: Number,
      default: null,
      min: [-180, 'Invalid longitude'],
      max: [180, 'Invalid longitude'],
    },
    contactNumber: {
      type: String,
      default: '',
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    email: {
      type: String,
      default: '',
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    totalCapacity: {
      type: Number,
      required: [true, 'Please provide total theater capacity'],
      min: [1, 'Capacity must be at least 1'],
    },
    numberOfAuditoriums: {
      type: Number,
      required: [true, 'Please provide number of auditoriums'],
      min: [1, 'Theater must have at least 1 auditorium'],
    },
    auditoriums: [
      {
        auditoriumName: {
          type: String,
          required: true,
        },
        capacity: {
          type: Number,
          required: true,
          min: 1,
        },
        rows: {
          type: Number,
          required: true,
          min: 1,
        },
        seatsPerRow: {
          type: Number,
          required: true,
          min: 1,
        },
        format: {
          type: String,
          enum: ['2D', '3D', 'IMAX', '4DX'],
          default: '2D',
        },
      },
    ],
    amenities: [String], // ["Parking", "Cafeteria", "Wheelchair Accessible"]
    imageUrl: {
      type: String,
      default: '',
    },
    mapUrl: {
      type: String,
      default: '',
    },
    operatingHours: {
      openTime: {
        type: String,
        default: '10:00 AM',
      },
      closeTime: {
        type: String,
        default: '11:00 PM',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
theaterSchema.index({ city: 1 });
theaterSchema.index({ name: 'text', location: 'text', city: 'text' });
theaterSchema.index({ isActive: 1 });
theaterSchema.index({ latitude: 1, longitude: 1 });

// Method to get theater capacity
theaterSchema.methods.getTheaterCapacity = function () {
  return this.totalCapacity;
};

// Method to calculate available seats across all auditoriums
theaterSchema.methods.getAvailableSeats = function () {
  if (!this.auditoriums || this.auditoriums.length === 0) {
    return 0;
  }
  return this.auditoriums.reduce((total, aud) => total + aud.capacity, 0);
};

// Method to get auditorium by name
theaterSchema.methods.getAuditorium = function (auditoriumName) {
  return this.auditoriums.find(
    (aud) => aud.auditoriumName.toLowerCase() === auditoriumName.toLowerCase()
  );
};

// Method to add auditorium
theaterSchema.methods.addAuditorium = function (auditoriumData) {
  if (
    this.auditoriums.some(
      (aud) =>
        aud.auditoriumName.toLowerCase() ===
        auditoriumData.auditoriumName.toLowerCase()
    )
  ) {
    throw new Error('Auditorium with this name already exists');
  }

  // Calculate and validate capacity
  const calculatedCapacity =
    auditoriumData.rows * auditoriumData.seatsPerRow;
  if (calculatedCapacity !== auditoriumData.capacity) {
    throw new Error(
      'Capacity mismatch: rows × seatsPerRow should equal capacity'
    );
  }

  this.auditoriums.push(auditoriumData);
  this.totalCapacity += auditoriumData.capacity;
  this.numberOfAuditoriums = this.auditoriums.length;

  return this;
};

// Method to remove auditorium
theaterSchema.methods.removeAuditorium = function (auditoriumName) {
  const auditorium = this.getAuditorium(auditoriumName);
  if (!auditorium) {
    throw new Error('Auditorium not found');
  }

  this.totalCapacity -= auditorium.capacity;
  this.auditoriums = this.auditoriums.filter(
    (aud) => aud.auditoriumName !== auditoriumName
  );
  this.numberOfAuditoriums = this.auditoriums.length;

  return this;
};

// Method to get theater information
theaterSchema.methods.getTheaterInfo = function () {
  return {
    id: this._id,
    name: this.name,
    location: this.location,
    city: this.city,
    totalCapacity: this.totalCapacity,
    numberOfAuditoriums: this.numberOfAuditoriums,
    auditoriums: this.auditoriums.map((aud) => ({
      name: aud.auditoriumName,
      capacity: aud.capacity,
      format: aud.format,
    })),
    amenities: this.amenities,
    contactNumber: this.contactNumber,
  };
};

// Method to check if theater is accessible
theaterSchema.methods.isWheelchairAccessible = function () {
  return this.amenities.includes('Wheelchair Accessible');
};

const Theater = mongoose.model('Theater', theaterSchema);

module.exports = Theater;
