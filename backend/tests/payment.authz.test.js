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
} = require('./helpers');

let userA;
let userB;
let booking;

before(async () => {
  await startDb();
  userA = await createUser();
  userB = await createUser();
  const movie = await createMovie();
  const show = await createShow(movie);
  booking = await createPendingBooking(userA, movie, show, [{ row: 'A', number: 1 }]);
});
after(teardown);

test('another user cannot create a Razorpay order for my booking', async () => {
  const res = await api()
    .post('/api/payments/create')
    .set('Authorization', `Bearer ${tokenFor(userB)}`)
    .send({ bookingId: booking._id.toString() });
  assert.equal(res.status, 403);
  assert.equal(res.body.success, false);
});

test('another user cannot verify payment for my booking', async () => {
  const res = await api()
    .post('/api/payments/verify')
    .set('Authorization', `Bearer ${tokenFor(userB)}`)
    .send({
      bookingId: booking._id.toString(),
      razorpay_order_id: 'order_x',
      razorpay_payment_id: 'pay_x',
      razorpay_signature: 'sig',
    });
  assert.equal(res.status, 403);
});

test('unauthenticated verify is rejected with 401', async () => {
  const res = await api()
    .post('/api/payments/verify')
    .send({ bookingId: booking._id.toString() });
  assert.equal(res.status, 401);
});

test('owner with a non-pending booking cannot create an order', async () => {
  booking.status = 'cancelled';
  await booking.save();
  const res = await api()
    .post('/api/payments/create')
    .set('Authorization', `Bearer ${tokenFor(userA)}`)
    .send({ bookingId: booking._id.toString() });
  assert.equal(res.status, 400);
  booking.status = 'pending';
  await booking.save();
});
