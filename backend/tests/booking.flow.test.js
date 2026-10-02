const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const {
  api,
  startDb,
  teardown,
  createUser,
  tokenFor,
  createMovie,
  createShow,
  createPendingBooking,
  models: { Booking },
} = require('./helpers');

let userA;
let userB;
let admin;
let movie;
let show;

before(async () => {
  await startDb();
  userA = await createUser();
  userB = await createUser();
  admin = await createUser({ role: 'admin' });
  movie = await createMovie();
  show = await createShow(movie);
});
after(teardown);

const auth = (user) => `Bearer ${tokenFor(user)}`;

test('createBooking computes the total server-side and ignores client prices', async () => {
  const res = await api()
    .post('/api/bookings/create')
    .set('Authorization', auth(userA))
    .send({
      movieId: movie._id,
      showId: show._id,
      seats: [{ row: 'A', number: 5 }, { row: 'A', number: 6 }],
      email: userA.email,
      phone: userA.phone,
      totalAmount: 1,
      basePrice: 1,
    });
  assert.equal(res.status, 201);
  const booking = res.body.booking;
  // 2 seats x 100 = 200 base, +5% fee, +18% tax
  assert.equal(booking.basePrice, 200);
  assert.equal(booking.convenienceFee, 10);
  assert.equal(booking.tax, 36);
  assert.equal(booking.totalAmount, 246);
  assert.equal(booking.status, 'pending');
  assert.equal(booking.razorpayOrderId, null);
});

test('createBooking rejects more than 10 seats', async () => {
  const seats = Array.from({ length: 11 }, (_, i) => ({ row: 'J', number: i + 1 }));
  const res = await api()
    .post('/api/bookings/create')
    .set('Authorization', auth(userA))
    .send({ movieId: movie._id, showId: show._id, seats, email: userA.email, phone: userA.phone });
  assert.equal(res.status, 400);
});

test('createBooking refuses a seat held by another user', async () => {
  const lock = await api()
    .post(`/api/shows/${show._id}/lock`)
    .set('Authorization', auth(userB))
    .send({ seats: [{ row: 'B', number: 7 }] });
  assert.equal(lock.status, 200);

  const res = await api()
    .post('/api/bookings/create')
    .set('Authorization', auth(userA))
    .send({ movieId: movie._id, showId: show._id, seats: [{ row: 'B', number: 7 }], email: userA.email, phone: userA.phone });
  assert.equal(res.status, 409);
});

test('a user cannot read or cancel another user\'s booking (IDOR)', async () => {
  const booking = await createPendingBooking(userA, movie, show, [{ row: 'C', number: 9 }]);

  const read = await api().get(`/api/bookings/${booking._id}`).set('Authorization', auth(userB));
  assert.equal(read.status, 403);

  const cancel = await api().delete(`/api/bookings/${booking._id}/cancel`).set('Authorization', auth(userB));
  assert.equal(cancel.status, 403);

  const stillPending = await Booking.findById(booking._id);
  assert.equal(stillPending.status, 'pending');
});

test('owner can read and cancel their booking; admin can read it', async () => {
  const booking = await createPendingBooking(userA, movie, show, [{ row: 'C', number: 10 }]);

  const own = await api().get(`/api/bookings/${booking._id}`).set('Authorization', auth(userA));
  assert.equal(own.status, 200);

  const asAdmin = await api().get(`/api/bookings/${booking.bookingId}`).set('Authorization', auth(admin));
  assert.equal(asAdmin.status, 200);

  const cancel = await api().delete(`/api/bookings/${booking._id}/cancel`).set('Authorization', auth(userA));
  assert.equal(cancel.status, 200);
  const stored = await Booking.findById(booking._id);
  assert.equal(stored.status, 'cancelled');
});

test('customers cannot reach admin routes', async () => {
  for (const path of ['/api/admin/stats', '/api/admin/bookings', '/api/admin/users', '/api/bookings']) {
    const res = await api().get(path).set('Authorization', auth(userA));
    assert.equal(res.status, 403, path);
  }
  const refund = await api().patch('/api/admin/bookings/000000000000000000000000/refund').set('Authorization', auth(userA));
  assert.equal(refund.status, 403);
});

test('unlock releases only the caller\'s seats and show responses hide other users\' lock owners', async () => {
  const lockShow = await createShow(movie);
  const a = await api().post(`/api/shows/${lockShow._id}/lock`).set('Authorization', auth(userA)).send({ seats: [{ row: 'D', number: 1 }] });
  const b = await api().post(`/api/shows/${lockShow._id}/lock`).set('Authorization', auth(userB)).send({ seats: [{ row: 'D', number: 2 }] });
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);

  const asB = await api().get(`/api/shows/${lockShow._id}`).set('Authorization', auth(userB));
  assert.equal(asB.status, 200);
  assert.equal(asB.body.show.seatLocks, undefined);
  assert.deepEqual(asB.body.show.myLockedSeats.map((s) => `${s.row}${s.number}`), ['D2']);
  assert.equal(asB.body.show.lockedSeats.length, 2);

  const unlock = await api().post(`/api/shows/${lockShow._id}/unlock`).set('Authorization', auth(userA)).send({});
  assert.equal(unlock.status, 200);
  assert.deepEqual(unlock.body.lockedSeats.map((s) => `${s.row}${s.number}`), ['D2']);
});
