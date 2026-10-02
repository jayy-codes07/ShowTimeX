const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { startDb, teardown, models: { User, Movie, Show, Booking } } = require('./helpers');
const { runSeed, DEMO_ADMIN_EMAIL, DEMO_CUSTOMER_EMAIL, MOVIES } = require('../seed');

before(startDb);
after(teardown);

const env = { SEED_ADMIN_PASSWORD: 'AdminDemo1', SEED_CUSTOMER_PASSWORD: 'CustomerDemo1' };

test('dry run reports what it would create and writes nothing', async () => {
  const summary = await runSeed({ confirm: false, env });
  assert.equal(summary.mode, 'dry-run');
  assert.equal(summary.users.create, 2);
  assert.equal(summary.movies.create, MOVIES.length);
  assert.ok(summary.shows.create > 0);
  assert.equal(await User.countDocuments(), 0);
  assert.equal(await Movie.countDocuments(), 0);
  assert.equal(await Show.countDocuments(), 0);
});

test('--confirm without the password env vars is refused', async () => {
  await assert.rejects(() => runSeed({ confirm: true, env: {} }), /SEED_ADMIN_PASSWORD/);
  assert.equal(await User.countDocuments(), 0);
});

test('--confirm writes demo data with env-provided passwords', async () => {
  const summary = await runSeed({ confirm: true, env });
  assert.equal(summary.users.create, 2);
  assert.equal(summary.movies.create, MOVIES.length);
  assert.equal(summary.shows.create, await Show.countDocuments());
  assert.equal(summary.bookings.create, 3);

  const admin = await User.findOne({ email: DEMO_ADMIN_EMAIL }).select('+password');
  assert.equal(admin.role, 'admin');
  assert.ok(await bcrypt.compare(env.SEED_ADMIN_PASSWORD, admin.password));
  const customer = await User.findOne({ email: DEMO_CUSTOMER_EMAIL }).select('+password');
  assert.equal(customer.role, 'customer');
  assert.ok(await bcrypt.compare(env.SEED_CUSTOMER_PASSWORD, customer.password));

  // Seeded bookings are reflected in the show seat state.
  const bookings = await Booking.find({ user: customer._id });
  assert.equal(bookings.length, 3);
  for (const b of bookings) {
    const show = await Show.findById(b.show);
    for (const seat of b.seats) assert.ok(show.isSeatBooked(seat.row, seat.number));
  }
});

test('second --confirm run is idempotent (0 creates)', async () => {
  const before = {
    users: await User.countDocuments(),
    movies: await Movie.countDocuments(),
    shows: await Show.countDocuments(),
    bookings: await Booking.countDocuments(),
  };
  const summary = await runSeed({ confirm: true, env });
  assert.equal(summary.users.create, 0);
  assert.equal(summary.users.update, 2);
  assert.equal(summary.movies.create, 0);
  assert.equal(summary.shows.create, 0);
  assert.equal(summary.bookings.create, 0);
  assert.deepEqual(
    {
      users: await User.countDocuments(),
      movies: await Movie.countDocuments(),
      shows: await Show.countDocuments(),
      bookings: await Booking.countDocuments(),
    },
    before
  );
});

test('seed never contains the old hard-coded passwords', () => {
  const src = require('node:fs').readFileSync(require.resolve('../seed'), 'utf8');
  assert.ok(!src.includes('Admin@123'));
  assert.ok(!src.includes('User@123'));
});
