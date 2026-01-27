const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a movie title'],
      trim: true,
      unique: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    genres: {
      type: [String],
      required: [true, 'Please provide at least one genre'],
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: 'At least one genre is required',
      },
    },
    languages: {
      type: [String],
      required: [true, 'Please provide at least one language'],
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: 'At least one language is required',
      },
    },
    duration: {
      type: Number,
      required: [true, 'Please provide movie duration in minutes'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    releaseDate: {
      type: Date,
      required: [true, 'Please provide a release date'],
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    certificate: {
      type: String,
      enum: ['U', 'UA', 'A', 'S'],
      default: 'U',
    },
    director: {
      type: String,
      trim: true,
    },
    cast: {
      type: [String],
      default: [],
    },
    poster: {
      type: String,
      required: [true, 'Please provide a poster URL'],
      default: 'https://via.placeholder.com/300x450?text=Movie+Poster',
    },
    backdrop: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['NOW_SHOWING', 'COMING_SOON', 'ENDED'],
      default: 'NOW_SHOWING',
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

// Index for search optimization
movieSchema.index({ title: 'text', description: 'text' });
movieSchema.index({ status: 1, releaseDate: -1 });
movieSchema.index({ genres: 1 });
movieSchema.index({ languages: 1 });

// Virtual for shows
movieSchema.virtual('shows', {
  ref: 'Show',
  localField: '_id',
  foreignField: 'movie',
});

// Method to check if movie is currently showing
movieSchema.methods.isNowShowing = function () {
  return this.status === 'NOW_SHOWING' && this.isActive;
};

// Method to check if movie is coming soon
movieSchema.methods.isComingSoon = function () {
  return this.status === 'COMING_SOON' && this.isActive;
};

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;