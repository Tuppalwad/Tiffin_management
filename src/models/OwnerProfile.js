/**
 * OwnerProfile Model
 * Extended profile for users with the 'owner' role.
 * Contains business details, location, and service configuration.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OwnerProfile = sequelize.define('OwnerProfile', {
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
  business_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Business name is required' },
    },
    comment: 'Name of the tiffin business',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Business description and specialities',
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Full business address',
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
    comment: 'GPS latitude for location-based services',
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    comment: 'GPS longitude for location-based services',
  },
  service_radius_km: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 5.00,
    comment: 'Maximum delivery radius in kilometers',
  },
  delivery_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether delivery service is offered',
  },
  pickup_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether pickup service is offered',
  },
  profile_image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL to profile/business image',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether the business is currently active',
  },
  opening_time: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Business opening time',
  },
  closing_time: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Business closing time',
  },
}, {
  tableName: 'owner_profiles',
  timestamps: true,
  underscored: true,
});

module.exports = OwnerProfile;
