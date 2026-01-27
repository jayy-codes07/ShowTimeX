import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Wallet, Building2 } from 'lucide-react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';

const BookingForm = ({ onSubmit, loading }) => {
  const { bookingData, getBookingSummary } = useBooking();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [formData, setFormData] = useState({
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const summary = getBookingSummary();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, paymentMethod });
  };

  const paymentMethods = [
    {
      id: 'razorpay',
      name: 'Credit/Debit Card',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Pay with Razorpay',
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      icon: <Wallet className="w-5 h-5" />,
      description: 'Paytm, PhonePe, GPay',
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: <Building2 className="w-5 h-5" />,
      description: 'Pay using UPI',
    },
  ];

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Contact Information */}
      <div className="bg-dark-card rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            required
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+91 1234567890"
            required
          />
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-dark-card rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paymentMethods.map((method) => (
            <motion.button
              key={method.id}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPaymentMethod(method.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                paymentMethod === method.id
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-700 bg-dark-lighter hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={paymentMethod === method.id ? 'text-primary' : 'text-gray-400'}>
                  {method.icon}
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-sm">{method.name}</p>
                  <p className="text-gray-500 text-xs">{method.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Booking Summary */}
      <div className="bg-dark-card rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Booking Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-gray-400">
            <span>Tickets ({summary.seatCount})</span>
            <span>₹{summary.basePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Convenience Fee (5%)</span>
            <span>₹{summary.convenienceFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>GST (18%)</span>
            <span>₹{summary.tax.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-700 pt-3 flex justify-between text-white font-bold text-lg">
            <span>Total Amount</span>
            <span className="text-primary">₹{summary.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Selected Seats */}
      <div className="bg-dark-card rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Selected Seats</h3>
        <div className="flex flex-wrap gap-2">
          {bookingData.selectedSeats.map((seat, index) => (
            <span
              key={index}
              className="bg-primary px-3 py-1 rounded-lg text-white font-semibold"
            >
              {seat.row}{seat.number}
            </span>
          ))}
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-dark-card rounded-xl p-6">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            required
            className="mt-1 w-4 h-4 text-primary bg-dark-lighter border-gray-700 rounded focus:ring-primary"
          />
          <span className="text-sm text-gray-400">
            I agree to the terms and conditions and understand that all sales are final
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        disabled={bookingData.selectedSeats.length === 0}
      >
        Proceed to Pay ₹{summary.total.toFixed(2)}
      </Button>
    </motion.form>
  );
};

export default BookingForm;