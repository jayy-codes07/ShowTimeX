/*
 * Demo seed (dummy data only).
 *
 *   npm run seed                       dry run: prints what would be created/updated, writes nothing
 *   npm run seed -- --confirm          writes. Requires SEED_ADMIN_PASSWORD and SEED_CUSTOMER_PASSWORD.
 *   npm run seed:users                 dry run, demo users only
 *   npm run seed:users -- --confirm    upserts ONLY the two demo users; never touches movies, shows or bookings.
 *
 * Idempotent: users are matched by email, movies by title, shows by
 * (theater, date, time) and demo bookings are only created when the demo
 * customer has none. Running it twice reports 0 creates the second time.
 * Passwords never come from this file and are never printed.
 */
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Movie = require('./models/Movie');
const Show = require('./models/Show');
const Booking = require('./models/Booking');
const { confirmSeats } = require('./utils/seatLocks');

dotenv.config({ path: path.join(__dirname, '.env') });

const DEMO_ADMIN_EMAIL = 'demo.admin@example.com';
const DEMO_CUSTOMER_EMAIL = 'demo.customer@example.com';

// Fictional titles; posters use the model's placeholder default.
const MOVIES = [
  {
    title: 'The Last Projector',
    description: 'A retired projectionist discovers a reel that plays a different ending every night.',
    genres: ['Drama', 'Mystery'],
    languages: ['English'],
    duration: 118,
    releaseDate: '2026-09-01',
    certificate: 'UA',
    director: 'A. Demo',
    cast: ['Demo Actor One', 'Demo Actor Two'],
  },
  {
    title: 'Orbit Seven',
    description: 'Seven strangers wake up on a station whose orbit is slowly decaying.',
    genres: ['Sci-Fi', 'Thriller'],
    languages: ['English', 'Hindi'],
    duration: 132,
    releaseDate: '2026-09-15',
    certificate: 'UA',
    director: 'B. Demo',
    cast: ['Demo Actor Three'],
  },
  {
    title: 'Monsoon Kitchen',
    description: 'Two rival street-food stalls are forced to share one roof during the rains.',
    genres: ['Comedy', 'Romance'],
    languages: ['Hindi'],
    duration: 104,
    releaseDate: '2026-09-20',
    certificate: 'U',
    director: 'C. Demo',
    cast: ['Demo Actor Four', 'Demo Actor Five'],
  },
  {
    title: 'Paper Lanterns',
    description: 'An animated tale of a lantern maker who lights the way for lost travellers.',
    genres: ['Animation', 'Adventure'],
    languages: ['English'],
    duration: 96,
    releaseDate: '2026-09-25',
    certificate: 'U',
    director: 'D. Demo',
    cast: ['Demo Voice One'],
  },
];

const THEATERS = [
  { name: 'Aurora Cinema', location: 'Demo City Centre' },
  { name: 'Riverside Multiplex', location: 'Demo Riverside Mall' },
];

// One fixed slot per movie so (theater, date, time) never collides.
const SLOTS = ['10:00 AM', '01:30 PM', '05:00 PM', '08:30 PM'];
const SHOW_DAYS = 5;
const BASE_PRICE = 200;

const utcMidnightPlusDays = (days) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

const buildShowDocs = (moviesByTitle) => {
  const docs = [];
  MOVIES.forEach((movie, index) => {
    for (let day = 1; day <= SHOW_DAYS; day += 1) {
      for (const theater of THEATERS) {
        const format = index % 2 === 0 ? '2D' : '3D';
        docs.push({
          movie: moviesByTitle.get(movie.title)._id,
          theater: theater.name,
          location: theater.location,
          format,
          date: utcMidnightPlusDays(day),
          time: SLOTS[index % SLOTS.length],
          price: format === '3D' ? Math.round(BASE_PRICE * 1.3) : BASE_PRICE,
          totalSeats: 120,
          bookedSeats: [],
        });
      }
    }
  });
  return docs;
};

const DEMO_BOOKING_SEATS = [
  [{ row: 'E', number: 5 }, { row: 'E', number: 6 }],
  [{ row: 'C', number: 10 }],
  [{ row: 'F', number: 1 }, { row: 'F', number: 2 }, { row: 'F', number: 3 }],
];

// Returns a summary; writes only when confirm === true.
const runSeed = async ({ confirm = false, usersOnly = false, env = process.env } = {}) => {
  const summary = {
    mode: confirm ? 'write' : 'dry-run',
    scope: usersOnly ? 'users-only' : 'full',
    users: { create: 0, update: 0 },
    movies: { create: 0, skip: 0 },
    shows: { create: 0, skip: 0 },
    bookings: { create: 0, skip: 0 },
  };

  if (confirm && (!env.SEED_ADMIN_PASSWORD || !env.SEED_CUSTOMER_PASSWORD)) {
    throw new Error(
      'SEED_ADMIN_PASSWORD and SEED_CUSTOMER_PASSWORD must be set to run with --confirm'
    );
  }

  // ---- users (matched by email) ----
  const users = [
    { name: 'Demo Admin', email: DEMO_ADMIN_EMAIL, phone: '9000000001', role: 'admin', password: env.SEED_ADMIN_PASSWORD },
    { name: 'Demo Customer', email: DEMO_CUSTOMER_EMAIL, phone: '9000000002', role: 'customer', password: env.SEED_CUSTOMER_PASSWORD },
  ];
  const userDocs = new Map();
  for (const u of users) {
    const existing = await User.findOne({ email: u.email }).select('+password');
    if (existing) {
      summary.users.update += 1;
      if (confirm) {
        existing.name = u.name;
        existing.phone = u.phone;
        existing.role = u.role;
        existing.password = u.password; // hashed by the pre-save hook
        await existing.save();
      }
      userDocs.set(u.email, existing);
    } else {
      summary.users.create += 1;
      if (confirm) {
        userDocs.set(u.email, await User.create(u));
      }
    }
  }

  if (usersOnly) {
    return summary;
  }

  // ---- movies (matched by title) ----
  const moviesByTitle = new Map();
  for (const m of MOVIES) {
    const existing = await Movie.findOne({ title: m.title });
    if (existing) {
      summary.movies.skip += 1;
      moviesByTitle.set(m.title, existing);
    } else {
      summary.movies.create += 1;
      if (confirm) {
        moviesByTitle.set(m.title, await Movie.create(m));
      }
    }
  }

  // ---- shows (matched by theater + date + time) ----
  if (confirm) {
    for (const doc of buildShowDocs(moviesByTitle)) {
      const result = await Show.updateOne(
        { theater: doc.theater, date: doc.date, time: doc.time },
        { $setOnInsert: doc },
        { upsert: true }
      );
      if (result.upsertedCount > 0) summary.shows.create += 1;
      else summary.shows.skip += 1;
    }
  } else {
    // Dry run: count without the movie ids (they may not exist yet).
    const total = MOVIES.length * SHOW_DAYS * THEATERS.length;
    let existing = 0;
    for (const movie of MOVIES) {
      if (!moviesByTitle.has(movie.title)) continue;
      const index = MOVIES.indexOf(movie);
      for (let day = 1; day <= SHOW_DAYS; day += 1) {
        for (const theater of THEATERS) {
          const found = await Show.exists({
            theater: theater.name,
            date: utcMidnightPlusDays(day),
            time: SLOTS[index % SLOTS.length],
          });
          if (found) existing += 1;
        }
      }
    }
    summary.shows.skip = existing;
    summary.shows.create = total - existing;
  }

  // ---- demo bookings for the demo customer (only if they have none) ----
  const customer = userDocs.get(DEMO_CUSTOMER_EMAIL);
  const existingBookings = customer
    ? await Booking.countDocuments({ user: customer._id })
    : 0;
  if (existingBookings > 0) {
    summary.bookings.skip = existingBookings;
  } else {
    summary.bookings.create = DEMO_BOOKING_SEATS.length;
    if (confirm) {
      const shows = await Show.find({ theater: THEATERS[0].name })
        .sort({ date: 1, time: 1 })
        .limit(DEMO_BOOKING_SEATS.length);
      summary.bookings.create = 0;
      for (let i = 0; i < shows.length; i += 1) {
        const show = shows[i];
        const seats = DEMO_BOOKING_SEATS[i];
        const written = await confirmSeats(show, customer._id, seats);
        if (!written) continue;
        const booking = new Booking({
          bookingId: `BK-${Date.now()}-${10000 + i}`,
          user: customer._id,
          movie: show.movie,
          show: show._id,
          seats,
          email: customer.email,
          phone: customer.phone,
          status: 'confirmed',
          paymentStatus: 'completed',
          paymentMethod: 'razorpay',
          paymentId: `pay_seed_${i}`,
          orderId: `order_seed_${i}`,
          razorpayOrderId: `order_seed_${i}`,
        });
        booking.calculateTotal(show.price, seats.length);
        await booking.save();
        summary.bookings.create += 1;
      }
    }
  }

  return summary;
};

const printSummary = (summary) => {
  const line = (label, parts) =>
    console.log(`  ${label.padEnd(9)} ${Object.entries(parts).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  console.log(
    `\nSeed ${summary.mode === 'dry-run' ? 'DRY RUN (nothing written)' : 'WRITE'}` +
      `${summary.scope === 'users-only' ? ' (demo users only)' : ''}:`
  );
  line('users', summary.users);
  if (summary.scope !== 'users-only') {
    line('movies', summary.movies);
    line('shows', summary.shows);
    line('bookings', summary.bookings);
  }
  console.log(`\nDemo accounts: ${DEMO_ADMIN_EMAIL} (admin), ${DEMO_CUSTOMER_EMAIL} (customer)`);
  console.log('Passwords come from SEED_ADMIN_PASSWORD / SEED_CUSTOMER_PASSWORD and are not printed.');
  if (summary.mode === 'dry-run') {
    console.log('\nRe-run with --confirm to write.');
  }
};

const main = async () => {
  const confirm = process.argv.includes('--confirm');
  const usersOnly = process.argv.includes('--users-only');
  try {
    await connectDB();
    const summary = await runSeed({ confirm, usersOnly });
    printSummary(summary);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

module.exports = { runSeed, DEMO_ADMIN_EMAIL, DEMO_CUSTOMER_EMAIL, MOVIES };
