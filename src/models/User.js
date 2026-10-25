/**
 * User Model
 * Represents application users (both owners and customers).
 * Users authenticate via phone + OTP and are assigned roles after onboarding.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Phone number is required' },
    },
    comment: 'User phone number (unique identifier for auth)',
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Full name of the user',
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: { msg: 'Please provide a valid email address' },
    },
    comment: 'Email address (optional)',
  },
  role: {
    type: DataTypes.ENUM('owner', 'customer'),
    allowNull: true,
    comment: 'User role - can be null initially until role is selected',
  },
  otp: {
    type: DataTypes.STRING(6),
    allowNull: true,
    comment: 'Current OTP for verification',
  },
  otp_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'OTP expiration timestamp',
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the user has verified their phone number',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Soft delete flag - false means account is deactivated',
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp of last successful login',
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

module.exports = User;
