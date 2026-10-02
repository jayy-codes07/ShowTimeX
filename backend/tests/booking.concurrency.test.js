const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const razorpayClient = require('../utils/razorpay');
const {
  api,
  startDb,
  teardown,
  createUser,
  tokenFor,
  createMovie,
  createShow,
  createPendingBooking,
  models: { Booking, Show },
} = require('./helpers');

const sign = (orderId, paymentId) =>
  crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

// Stubbed gateway: every payment id maps to a captured payment for its order.
const payments = new Map();
razorpayClient.fetchPayment = async (paymentId) => payments.get(paymentId);

const flatBooked = (show) =>
  (show.bookedSeats || []).flatMap((g) => (g.seats || []).map((s) => `${s.row}${s.number}`));

let userA;
let userB;
let movie;

before(async () => {
  await startDb();
  userA = await createUser();
  userB = await createUser();
  movie = await createMovie();
});
after(teardown);

const verifyFor = (user, booking, paymentId) =>
  api()
    .post('/api/payments/verify')
    .set('Authorization', `Bearer ${tokenFor(user)}`)
    .send({
      bookingId: booking._id.toString(),
      razorpay_order_id: booking.razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: sign(booking.razorpayOrderId, paymentId),
    });

test('two parallel payment confirmations for the same seat: exactly one wins', async () => {
  const show = await createShow(movie);
  const seat = [{ row: 'A', number: 1 }];
  const bookingA = await createPendingBooking(userA, movie, show, seat, { razorpayOrderId: 'order_A' });
  const bookingB = await createPendingBooking(userB, movie, show, seat, { razorpayOrderId: 'order_B' });
  const paise = Math.round(bookingA.totalAmount * 100);
  payments.set('pay_A', { id: 'pay_A', order_id: 'order_A', status: 'captured', amount: paise });
  payments.set('pay_B', { id: 'pay_B', order_id: 'order_B', status: 'captured', amount: paise });

  const [resA, resB] = await Promise.all([
    verifyFor(userA, bookingA, 'pay_A'),
    verifyFor(userB, bookingB, 'pay_B'),
  ]);

  const statuses = [resA.status, resB.status].sort();
  assert.deepEqual(statuses, [200, 409]);

  const storedShow = await Show.findById(show._id);
  assert.deepEqual(flatBooked(storedShow), ['A1']);

  const confirmed = await Booking.countDocuments({ show: show._id, status: 'confirmed' });
  const pending = await Booking.countDocuments({ show: show._id, status: 'pending' });
  assert.equal(confirmed, 1);
  assert.equal(pending, 1);
});

test('two parallel lock requests for the same seat: exactly one wins', async () => {
  const show = await createShow(movie);
  const body = { seats: [{ row: 'C', number: 1 }], holdMinutes: 5 };

  const [resA, resB] = await Promise.all([
    api().post(`/api/shows/${show._id}/lock`).set('Authorization', `Bearer ${tokenFor(userA)}`).send(body),
    api().post(`/api/shows/${show._id}/lock`).set('Authorization', `Bearer ${tokenFor(userB)}`).send(body),
  ]);

  assert.deepEqual([resA.status, resB.status].sort(), [200, 409]);

  const storedShow = await Show.findById(show._id);
  const holders = storedShow.seatLocks.filter((l) => l.seats.some((s) => s.row === 'C' && s.number === 1));
  assert.equal(holders.length, 1);
});

test('locking a seat that is already booked returns 409', async () => {
  const show = await createShow(movie, {
    bookedSeats: [{ date: new Date(), time: '06:00 PM', seats: [{ row: 'D', number: 2 }] }],
  });
  const res = await api()
    .post(`/api/shows/${show._id}/lock`)
    .set('Authorization', `Bearer ${tokenFor(userA)}`)
    .send({ seats: [{ row: 'D', number: 2 }] });
  assert.equal(res.status, 409);
});

test('re-locking my own seats merges them and keeps one lock entry', async () => {
  const show = await createShow(movie);
  const auth = `Bearer ${tokenFor(userA)}`;
  const first = await api().post(`/api/shows/${show._id}/lock`).set('Authorization', auth).send({ seats: [{ row: 'E', number: 1 }] });
  const second = await api().post(`/api/shows/${show._id}/lock`).set('Authorization', auth).send({ seats: [{ row: 'E', number: 2 }] });
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.deepEqual(
    second.body.myLockedSeats.map((s) => `${s.row}${s.number}`).sort(),
    ['E1', 'E2']
  );
  const storedShow = await Show.findById(show._id);
  assert.equal(storedShow.seatLocks.length, 1);

  // Another user cannot take E1 while the lock is active.
  const other = await api().post(`/api/shows/${show._id}/lock`).set('Authorization', `Bearer ${tokenFor(userB)}`).send({ seats: [{ row: 'E', number: 1 }] });
  assert.equal(other.status, 409);
});

test('confirming a booking removes the owner lock and books the seats', async () => {
  const show = await createShow(movie);
  const auth = `Bearer ${tokenFor(userA)}`;
  const lock = await api().post(`/api/shows/${show._id}/lock`).set('Authorization', auth).send({ seats: [{ row: 'F', number: 3 }] });
  assert.equal(lock.status, 200);
  const booking = await createPendingBooking(userA, movie, show, [{ row: 'F', number: 3 }], { razorpayOrderId: 'order_F' });
  payments.set('pay_F', { id: 'pay_F', order_id: 'order_F', status: 'captured', amount: Math.round(booking.totalAmount * 100) });

  const res = await verifyFor(userA, booking, 'pay_F');
  assert.equal(res.status, 200);
  const storedShow = await Show.findById(show._id);
  assert.deepEqual(flatBooked(storedShow), ['F3']);
  assert.equal(storedShow.seatLocks.length, 0);
});
