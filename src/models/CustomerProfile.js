/**
 * CustomerProfile Model
 * Extended profile for users with the 'customer' role.
 * Contains delivery address, location, and food preferences.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CustomerProfile = sequelize.define('CustomerProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'FK to users table - one-to-one relationship',
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Residential address',
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  pincode: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    comment: 'GPS latitude for delivery location',
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    comment: 'GPS longitude for delivery location',
  },
  delivery_address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Preferred delivery address (may differ from residential)',
  },
  food_preferences: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Dietary preferences, allergies, or special instructions',
  },
}, {
  tableName: 'customer_profiles',
  timestamps: true,
  underscored: true,
});

module.exports = CustomerProfile;
