const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

// Create Payment
exports.createPayment = async (req, res) => {
  try {
    const { booking, user, paymentMethod, paymentAmount, transactionId } = req.body;

    const payment = new Payment({
      booking,
      user,
      paymentMethod,
      paymentAmount,
      transactionId,
      paymentStatus: 'pending',
    });

    await payment.save();
    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('booking')
      .populate('user', 'name email phone');

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('booking')
      .populate('user', 'name email phone');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Payment
exports.updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: payment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Mark Payment Completed
exports.markPaymentCompleted = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    payment.markAsCompleted(transactionId);
    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment marked as completed',
      data: payment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Mark Payment Failed
exports.markPaymentFailed = async (req, res) => {
  try {
    const { failureReason, failureCode } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    payment.markAsFailed(failureReason, failureCode);
    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment marked as failed',
      data: payment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Initiate Refund
exports.initiateRefund = async (req, res) => {
  try {
    const { refundAmount, reason } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    payment.initiateRefund(refundAmount, reason);
    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      data: payment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Payment
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
