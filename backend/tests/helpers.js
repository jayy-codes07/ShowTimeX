const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

const app = require('../app');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const { generateToken } = require('../middleware/authMiddleware');

let mongod = null;

// Start an in-memory MongoDB and connect mongoose to it. app.js's route gate
// sees readyState === 1 and never touches MONGO_URI.
const startDb = async () => {
  if (mongod) return;
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};

// Every test file must call this in after() so the process can exit.
const teardown = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
};

const clearDb = async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
};

let userSeq = 0;

const createUser = async (overrides = {}) => {
  userSeq += 1;
  return User.create({
    name: `User ${userSeq}`,
    email: `user${userSeq}@example.com`,
    phone: `9${String(userSeq).padStart(9, '0')}`,
    password: 'Password1',
    role: 'customer',
    ...overrides,
  });
};

const tokenFor = (user) => generateToken(user._id);

const createMovie = async (overrides = {}) =>
  Movie.create({
    title: `Movie ${Date.now()}-${Math.random().toString(16).slice(2)}`,
    description: 'Test movie',
    genres: ['Drama'],
    languages: ['English'],
    duration: 120,
    releaseDate: new Date('2020-01-01'),
    certificate: 'U',
    ...overrides,
  });

// Show 7 days out so the 60-minute booking cutoff never triggers.
const createShow = async (movie, overrides = {}) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 7);
  date.setUTCHours(0, 0, 0, 0);
  return Show.create({
    movie: movie._id,
    theater: `Theater ${Math.random().toString(16).slice(2)}`,
    location: 'Test City',
    format: '2D',
    date,
    time: '06:00 PM',
    price: 100,
    totalSeats: 120,
    ...overrides,
  });
};

// Pending booking exactly as createBooking would leave it, without the lock.
const createPendingBooking = async (user, movie, show, seats, overrides = {}) => {
  const booking = new Booking({
    bookingId: `BK-${Date.now()}-${Math.floor(10000 + Math.random() * 90000)}`,
    user: user._id,
    movie: movie._id,
    show: show._id,
    seats,
    email: user.email,
    phone: user.phone,
    status: 'pending',
    ...overrides,
  });
  booking.calculateTotal(show.price, seats.length);
  await booking.save();
  return booking;
};

const api = () => request(app);

module.exports = {
  app,
  api,
  startDb,
  teardown,
  clearDb,
  createUser,
  tokenFor,
  createMovie,
  createShow,
  createPendingBooking,
  models: { User, Movie, Show, Booking },
};
