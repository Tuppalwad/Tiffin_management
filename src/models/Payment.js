/**
 * Payment Model
 * Tracks all payments made by customers to owners.
 * Supports payments for subscriptions, extra orders, and other purposes.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { ENUM_VALUES } = require('../utils/constants');

const Payment = sequelize.define('Payment', {
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
    comment: 'FK to users table - the paying customer',
  },
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'FK to users table - the receiving owner',
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id',
    },
    comment: 'FK to orders table - null if payment is for subscription only',
  },
  subscription_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'subscriptions',
      key: 'id',
    },
    comment: 'FK to subscriptions table - null if payment is for single order',
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Amount must be a positive value' },
    },
    comment: 'Payment amount in INR',
  },
  payment_method: {
    type: DataTypes.ENUM(...ENUM_VALUES.paymentMethods),
    allowNull: false,
    comment: 'Method of payment: cash, upi, or online',
  },
  payment_purpose: {
    type: DataTypes.ENUM(...ENUM_VALUES.paymentPurposes),
    allowNull: false,
    comment: 'Purpose: subscription, extra_order, or other',
  },
  payment_status: {
    type: DataTypes.ENUM(...ENUM_VALUES.paymentStatuses),
    defaultValue: 'pending',
    comment: 'Current payment status',
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date when payment was made',
  },
  transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'External transaction/reference ID (for UPI/online payments)',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes about the payment',
  },
}, {
  tableName: 'payments',
  timestamps: true,
  underscored: true,
});

module.exports = Payment;
