/**
 * SubscriptionPlan Model
 * Represents tiffin subscription plans created by owners.
 * Plans define pricing, duration, and meal frequency.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { ENUM_VALUES } = require('../utils/constants');

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'FK to users table - the owner who created this plan',
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Plan name is required' },
    },
    comment: 'Name of the subscription plan',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Detailed description of what the plan includes',
  },
  plan_type: {
    type: DataTypes.ENUM(...ENUM_VALUES.planTypes),
    allowNull: false,
    comment: 'Type of plan: daily or monthly',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Price must be a positive value' },
    },
    comment: 'Plan price in INR',
  },
  duration_days: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in days for monthly plans (e.g., 30)',
  },
  meals_per_day: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Number of meals provided per day',
  },
  delivery_charges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Additional delivery charges for the plan',
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether the plan is available for new subscriptions',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Soft delete flag',
  },
}, {
  tableName: 'subscription_plans',
  timestamps: true,
  underscored: true,
});

module.exports = SubscriptionPlan;
