const User = require('../models/User');
const { generateToken } = require('../middleware/authMiddleware');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// @desc    Register a new user
// // @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'customer', // Role is always customer for public registration
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update basic info
    if (name) user.name = name;
    if (phone) user.phone = phone;

    // Update password if provided
    if (currentPassword && newPassword) {
      const isMatch = await user.comparePassword(currentPassword);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      user.password = newPassword;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
    });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'There is no user with that email',
      });
    }

    // Get reset OTP
    const resetOTP = user.getResetPasswordOTP();

    await user.save({ validateBeforeSave: false });

    // Create reset message
    const message = `Your ShowTimeX password reset OTP is:

${resetOTP}

This OTP will expire in 10 minutes.

If you did not request a password reset, please ignore this message or contact support immediately.`;
    try {
      await sendEmail({
        email: user.email,
        subject: 'ShowTimeX Password Reset OTP',
        message,
      });

      res.status(200).json({
        success: true,
        message: 'OTP sent to email',
        // Optional: Include OTP in dev mode for easy testing without ethereal
        ...(process.env.NODE_ENV !== 'production' && { dev_otp: resetOTP })
      });
    } catch (err) {
      user.resetPasswordOTP = undefined;
      user.resetPasswordOTPExpire = undefined;

      await user.save({ validateBeforeSave: false });

      console.error('Email error:', err);
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent',
      });
    }
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during forgot password',
    });
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, OTP, and new password',
      });
    }

    // Get hashed OTP
    const resetPasswordOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    const user = await User.findOne({
      email,
      resetPasswordOTP,
      resetPasswordOTPExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;
    await user.save();

    // Generate token for auto-login
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during reset password',
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
};