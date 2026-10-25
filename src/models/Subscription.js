/**
 * Subscription Model
 * Represents an active subscription of a customer to an owner's plan.
 * Tracks subscription period, payment status, and renewal settings.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { ENUM_VALUES } = require('../utils/constants');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'FK to users table - the subscribing customer',
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
  plan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'subscription_plans',
      key: 'id',
    },
    comment: 'FK to subscription_plans table',
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Subscription start date',
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Subscription end date',
  },
  status: {
    type: DataTypes.ENUM(...ENUM_VALUES.subscriptionStatuses),
    defaultValue: 'active',
    comment: 'Current subscription status',
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Total subscription amount in INR',
  },
  paid_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Amount already paid by the customer',
  },
  remaining_days: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Number of remaining days in the subscription',
  },
  auto_renew: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether to auto-renew at end of subscription period',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes or special instructions',
  },
}, {
  tableName: 'subscriptions',
  timestamps: true,
  underscored: true,
});

module.exports = Subscription;
