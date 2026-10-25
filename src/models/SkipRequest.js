/**
 * SkipRequest Model
 * Represents customer requests to skip a meal day within a subscription.
 * Supports credit tracking for skipped days.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { ENUM_VALUES } = require('../utils/constants');

const SkipRequest = sequelize.define('SkipRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  subscription_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'subscriptions',
      key: 'id',
    },
    comment: 'FK to subscriptions table',
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'FK to users table - the requesting customer',
  },
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'FK to users table - the tiffin owner',
  },
  skip_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'The date to be skipped',
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for skipping the meal',
  },
  status: {
    type: DataTypes.ENUM(...ENUM_VALUES.skipRequestStatuses),
    defaultValue: 'requested',
    comment: 'Current status of the skip request',
  },
  credit_applied: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether credit has been applied for this skip',
  },
  credit_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Credit amount applied for the skipped day',
  },
}, {
  tableName: 'skip_requests',
  timestamps: true,
  underscored: true,
});

module.exports = SkipRequest;
