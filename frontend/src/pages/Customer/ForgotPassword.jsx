import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, KeyRound, ArrowLeft } from 'lucide-react';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import { validateForm } from '../../utils/validators';
import toast from 'react-hot-toast';
import logo from '../../assets/images/Showtime_logo.png';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // We might automatically login the user, or let the backend return the token
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    
    const validationRules = {
      email: { required: true, type: 'email', label: 'Email' },
    };

    const validation = validateForm({ email: formData.email }, validationRules);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/forgotpassword', { email: formData.email });
      if (response.success) {
        toast.success(response.message || 'OTP has been sent to your email.');
        setStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    const validationRules = {
      otp: { required: true, label: 'OTP' },
      password: { required: true, minLength: 8, label: 'Password' },
    };

    const validation = validateForm(
      { otp: formData.otp, password: formData.password }, 
      validationRules
    );
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/auth/resetpassword', {
        email: formData.email,
        otp: formData.otp,
        password: formData.password,
      });

      if (response.success) {
        toast.success(response.message || 'Password reset successfully!');
        
        // Auto-login logic using the token returned by the backend
        if (response.token) {
          localStorage.setItem('token', response.token);
          window.location.href = '/'; // Hard redirect to force context update or we can just navigate
        } else {
          navigate('/login');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark py-12 px-4 relative overflow-hidden">
      {/* Background Ornaments (consistent with premium feel) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={logo} className="h-14 w-auto" alt="ShowTimeX" />
          </div>
          <h2 className="text-3xl font-bold text-white">Account Recovery</h2>
          <p className="text-gray-400 mt-2">
            {step === 1 ? "Enter your email to receive an OTP." : "Enter the OTP and your new password."}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-dark-card rounded-xl p-6 sm:p-8 shadow-2xl border border-gray-800 relative">
          
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleRequestOTP} 
                className="space-y-6"
              >
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  error={errors.email}
                  icon={<Mail className="w-5 h-5 text-gray-400" />}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  className="hover-lift"
                >
                  Send OTP
                </Button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleResetPassword} 
                className="space-y-6"
              >
                <div className="text-sm text-gray-400 mb-4 bg-dark-lighter p-3 rounded-lg border border-gray-800">
                  <span className="block mb-1">We sent a 6-digit code to:</span>
                  <strong className="text-white">{formData.email}</strong>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="ml-2 text-primary hover:text-primary-light text-xs transition"
                  >
                    Change
                  </button>
                </div>

                <Input
                  label="6-Digit OTP"
                  name="otp"
                  type="text"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="Enter 6-digit code"
                  error={errors.otp}
                  maxLength={6}
                  icon={<KeyRound className="w-5 h-5 text-gray-400" />}
                  required
                />

                <Input
                  label="New Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  error={errors.password}
                  icon={<Lock className="w-5 h-5 text-gray-400" />}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  className="hover-lift"
                >
                  Reset Password
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Back to Login Link */}
          <div className="mt-8 text-center pt-6 border-t border-gray-800">
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 text-gray-400 hover:text-white font-medium transition group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
