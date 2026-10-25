/**
 * Auth Controller
 * Handles user authentication: OTP send, OTP verify, role selection, profile.
 */

const jwt = require('jsonwebtoken');
const { User, OwnerProfile, CustomerProfile } = require('../models');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');
const { generateOTP, formatPhoneNumber, successResponse } = require('../utils/helpers');

/**
 * Generate JWT token for user
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      phone: user.phone,
      role: user.role,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Send OTP to user phone number
 * POST /api/auth/send-otp
 */
const sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      throw new AppError('Phone number is required', 400);
    }

    const formattedPhone = formatPhoneNumber(phone);
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

    // Find or create user by phone
    let [user] = await User.findOrCreate({
      where: { phone: formattedPhone },
      defaults: {
        phone: formattedPhone,
        otp,
        otp_expires_at: otpExpiresAt,
      },
    });

    // Update existing user with new OTP
    user.otp = otp;
    user.otp_expires_at = otpExpiresAt;
    await user.save();

    console.log(`📲 OTP for ${formattedPhone}: ${otp}`);

    return res.status(200).json(
      successResponse(
        {
          phone: formattedPhone,
          // Expose OTP in development for testing convenience
          ...(config.nodeEnv !== 'production' && { otp }),
          expiresIn: `${config.otp.expiryMinutes} minutes`,
        },
        'OTP sent successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP and login / register
 * POST /api/auth/verify-otp
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      throw new AppError('Phone number and OTP are required', 400);
    }

    const formattedPhone = formatPhoneNumber(phone);
    const user = await User.findOne({
      where: { phone: formattedPhone },
      include: [
        { model: OwnerProfile, as: 'ownerProfile' },
        { model: CustomerProfile, as: 'customerProfile' },
      ],
    });

    if (!user) {
      throw new AppError('User not found. Please request an OTP first.', 404);
    }

    // Allow master OTP '123456' in non-production for easy demo/testing
    const isMasterOtp = config.nodeEnv !== 'production' && otp === '123456';
    const isMatchingOtp = user.otp === otp;
    const isNotExpired = user.otp_expires_at && new Date() <= new Date(user.otp_expires_at);

    if (!isMasterOtp && (!isMatchingOtp || !isNotExpired)) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    // Mark as verified and record login
    user.is_verified = true;
    user.last_login_at = new Date();
    user.otp = null;
    user.otp_expires_at = null;
    await user.save();

    const token = generateToken(user);

    return res.status(200).json(
      successResponse(
        {
          token,
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.is_verified,
            hasProfile: !!(user.ownerProfile || user.customerProfile),
            ownerProfile: user.ownerProfile,
            customerProfile: user.customerProfile,
          },
        },
        'OTP verified successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Select user role (Owner or Customer)
 * POST /api/auth/select-role
 */
const selectRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role || !['owner', 'customer'].includes(role)) {
      throw new AppError('Valid role (owner or customer) is required', 400);
    }

    const user = await User.findByPk(req.user.id, {
      include: [
        { model: OwnerProfile, as: 'ownerProfile' },
        { model: CustomerProfile, as: 'customerProfile' },
      ],
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.role = role;
    await user.save();

    // Create default profile if not exists
    if (role === 'owner' && !user.ownerProfile) {
      await OwnerProfile.create({
        user_id: user.id,
        business_name: user.name ? `${user.name}'s Tiffin` : 'My Tiffin Service',
      });
    } else if (role === 'customer' && !user.customerProfile) {
      await CustomerProfile.create({
        user_id: user.id,
      });
    }

    // Refresh user with profile
    await user.reload({
      include: [
        { model: OwnerProfile, as: 'ownerProfile' },
        { model: CustomerProfile, as: 'customerProfile' },
      ],
    });

    // Re-generate token with new role
    const token = generateToken(user);

    return res.status(200).json(
      successResponse(
        {
          token,
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            role: user.role,
            ownerProfile: user.ownerProfile,
            customerProfile: user.customerProfile,
          },
        },
        `Role set to ${role} successfully`
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['otp', 'otp_expires_at'] },
      include: [
        { model: OwnerProfile, as: 'ownerProfile' },
        { model: CustomerProfile, as: 'customerProfile' },
      ],
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return res.status(200).json(
      successResponse(
        {
          user,
        },
        'Profile retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update basic user profile (name, email)
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    await user.save();

    return res.status(200).json(
      successResponse(
        {
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        'Profile updated successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  return res.status(200).json(
    successResponse(null, 'Logged out successfully')
  );
};

module.exports = {
  sendOtp,
  verifyOtp,
  selectRole,
  getProfile,
  updateProfile,
  logout,
};

