const Razorpay = require('razorpay');

// Thin wrapper around the Razorpay SDK. Controllers call these through the
// exported object (never destructured) so tests can replace createOrder and
// fetchPayment with stubs and never reach the real gateway.
let client = null;

const isConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const getClient = () => {
  if (!client) {
    if (!isConfigured()) {
      throw new Error('Razorpay keys are not configured');
    }
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
};

const razorpayClient = {
  isConfigured,
  // https://razorpay.com/docs/api/orders/create/
  createOrder: (params) => getClient().orders.create(params),
  // https://razorpay.com/docs/api/payments/fetch-with-id/
  // Returns { id, order_id, amount (paise), status: 'created'|'authorized'|'captured'|'refunded'|'failed', ... }
  fetchPayment: (paymentId) => getClient().payments.fetch(paymentId),
};

module.exports = razorpayClient;
