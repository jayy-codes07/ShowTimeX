const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { api, startDb, teardown, models: { User, Movie, Show, Booking } } = require('./helpers');
const { runSeed, DEMO_ADMIN_EMAIL, DEMO_CUSTOMER_EMAIL } = require('../seed');

before(startDb);
after(teardown);

const env = { SEED_ADMIN_PASSWORD: 'UsersOnlyAdmin1', SEED_CUSTOMER_PASSWORD: 'UsersOnlyCust1' };

test('users-only dry run writes nothing', async () => {
  const summary = await runSeed({ confirm: false, usersOnly: true, env });
  assert.equal(summary.scope, 'users-only');
  assert.equal(summary.users.create, 2);
  assert.equal(await User.countDocuments(), 0);
});

test('users-only --confirm twice leaves exactly 2 users and no movies, shows or bookings', async () => {
  const first = await runSeed({ confirm: true, usersOnly: true, env });
  assert.equal(first.users.create, 2);
  const second = await runSeed({ confirm: true, usersOnly: true, env });
  assert.equal(second.users.create, 0);
  assert.equal(second.users.update, 2);

  assert.equal(await User.countDocuments(), 2);
  assert.equal(await Movie.countDocuments(), 0);
  assert.equal(await Show.countDocuments(), 0);
  assert.equal(await Booking.countDocuments(), 0);
});

test('both demo users can log in through the real login endpoint', async () => {
  const admin = await api().post('/api/auth/login').send({ email: DEMO_ADMIN_EMAIL, password: env.SEED_ADMIN_PASSWORD });
  assert.equal(admin.status, 200);
  assert.equal(admin.body.user.role, 'admin');
  assert.ok(admin.body.token);

  const customer = await api().post('/api/auth/login').send({ email: DEMO_CUSTOMER_EMAIL, password: env.SEED_CUSTOMER_PASSWORD });
  assert.equal(customer.status, 200);
  assert.equal(customer.body.user.role, 'customer');
  assert.ok(customer.body.token);

  const wrong = await api().post('/api/auth/login').send({ email: DEMO_ADMIN_EMAIL, password: 'not-the-password' });
  assert.equal(wrong.status, 401);
});
