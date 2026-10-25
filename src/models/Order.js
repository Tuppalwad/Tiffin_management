/**
 * Order Model
 * Represents individual tiffin orders (both from subscriptions and extra orders).
 * Tracks order status, delivery info, payment, and amounts.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { ENUM_VALUES } = require('../utils/constants');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  order_number: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
    comment: 'Auto-generated unique order number (e.g., TF-20241025-00001)',
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'FK to users table - the ordering customer',
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
  subscription_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'subscriptions',
      key: 'id',
    },
    comment: 'FK to subscriptions table - null for extra/non-subscription orders',
  },
  order_type: {
    type: DataTypes.ENUM(...ENUM_VALUES.orderTypes),
    allowNull: false,
    comment: 'Type of order: daily, extra, or subscription',
  },
  order_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Date of the order',
  },
  meal_timing: {
    type: DataTypes.ENUM(...ENUM_VALUES.mealTypes),
    allowNull: true,
    comment: 'Meal time: breakfast, lunch, dinner, snack',
  },
  delivery_type: {
    type: DataTypes.ENUM(...ENUM_VALUES.deliveryTypes),
    allowNull: true,
    comment: 'Delivery method: delivery or pickup',
  },
  delivery_address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Delivery address for this specific order',
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Subtotal before delivery charges and discounts',
  },
  delivery_charges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Delivery charges for this order',
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Discount applied to this order',
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Final total amount (subtotal + delivery - discount)',
  },
  payment_status: {
    type: DataTypes.ENUM('paid', 'pending', 'partial'),
    defaultValue: 'pending',
    comment: 'Payment status for this order',
  },
  order_status: {
    type: DataTypes.ENUM(...ENUM_VALUES.orderStatuses),
    defaultValue: 'order_received',
    comment: 'Current status in the order lifecycle',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Special instructions or notes for the order',
  },
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
});

module.exports = Order;
