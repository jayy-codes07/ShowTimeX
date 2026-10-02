const { test, before, after, beforeEach } = require('node:test');
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

let user;
let token;
let movie;
let show;
let seatNo = 0;

// Stubbed gateway: tests set `paymentResponse` to control fetchPayment.
let paymentResponse;
razorpayClient.createOrder = async (params) => ({
  id: `order_stub_${Date.now()}`,
  amount: params.amount,
  currency: params.currency,
  receipt: params.receipt,
});
razorpayClient.fetchPayment = async () => {
  if (paymentResponse instanceof Error) throw paymentResponse;
  return paymentResponse;
};

before(async () => {
  await startDb();
  user = await createUser();
  token = tokenFor(user);
  movie = await createMovie();
  show = await createShow(movie);
});
after(teardown);

const newBooking = async () => {
  seatNo += 1;
  return createPendingBooking(user, movie, show, [{ row: 'B', number: seatNo }]);
};

const createOrderFor = async (booking) => {
  const res = await api()
    .post('/api/payments/create')
    .set('Authorization', `Bearer ${token}`)
    .send({ bookingId: booking._id.toString() });
  assert.equal(res.status, 200);
  return res.body;
};

const verify = (booking, body) =>
  api()
    .post('/api/payments/verify')
    .set('Authorization', `Bearer ${token}`)
    .send({ bookingId: booking._id.toString(), ...body });

beforeEach(() => {
  paymentResponse = null;
});

test('order creation stores razorpayOrderId on the booking', async () => {
  const booking = await newBooking();
  const order = await createOrderFor(booking);
  const stored = await Booking.findById(booking._id);
  assert.equal(stored.razorpayOrderId, order.id);
  assert.equal(order.amount, Math.round(booking.totalAmount * 100));
});

test('bad signature returns 400', async () => {
  const booking = await newBooking();
  const order = await createOrderFor(booking);
  const res = await verify(booking, {
    razorpay_order_id: order.id,
    razorpay_payment_id: 'pay_1',
    razorpay_signature: 'deadbeef',
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'Invalid signature');
});

test('valid signature for a different order returns 400', async () => {
  const booking = await newBooking();
  await createOrderFor(booking);
  const otherOrder = 'order_belongs_to_cheap_booking';
  const res = await verify(booking, {
    razorpay_order_id: otherOrder,
    razorpay_payment_id: 'pay_2',
    razorpay_signature: sign(otherOrder, 'pay_2'),
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'Order does not match booking');
});

test('captured payment with the wrong amount returns 400', async () => {
  const booking = await newBooking();
  const order = await createOrderFor(booking);
  paymentResponse = { id: 'pay_3', order_id: order.id, status: 'captured', amount: 100 };
  const res = await verify(booking, {
    razorpay_order_id: order.id,
    razorpay_payment_id: 'pay_3',
    razorpay_signature: sign(order.id, 'pay_3'),
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'Payment does not match booking');
});

test('authorized (not captured) payment returns 400', async () => {
  const booking = await newBooking();
  const order = await createOrderFor(booking);
  paymentResponse = { id: 'pay_4', order_id: order.id, status: 'authorized', amount: order.amount };
  const res = await verify(booking, {
    razorpay_order_id: order.id,
    razorpay_payment_id: 'pay_4',
    razorpay_signature: sign(order.id, 'pay_4'),
  });
  assert.equal(res.status, 400);
});

test('gateway failure during fetch returns 502 and leaves the booking pending', async () => {
  const booking = await newBooking();
  const order = await createOrderFor(booking);
  paymentResponse = new Error('network down');
  const res = await verify(booking, {
    razorpay_order_id: order.id,
    razorpay_payment_id: 'pay_5',
    razorpay_signature: sign(order.id, 'pay_5'),
  });
  assert.equal(res.status, 502);
  const stored = await Booking.findById(booking._id);
  assert.equal(stored.status, 'pending');
});

test('matching captured payment confirms the booking and books the seats', async () => {
  const booking = await newBooking();
  const order = await createOrderFor(booking);
  paymentResponse = { id: 'pay_6', order_id: order.id, status: 'captured', amount: order.amount };
  const res = await verify(booking, {
    razorpay_order_id: order.id,
    razorpay_payment_id: 'pay_6',
    razorpay_signature: sign(order.id, 'pay_6'),
  });
  assert.equal(res.status, 200);
  const stored = await Booking.findById(booking._id);
  assert.equal(stored.status, 'confirmed');
  assert.equal(stored.paymentStatus, 'completed');
  assert.equal(stored.paymentId, 'pay_6');
  const storedShow = await Show.findById(show._id);
  assert.ok(storedShow.isSeatBooked('B', booking.seats[0].number));
});
