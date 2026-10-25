/**
 * MenuItem Model
 * Represents food items offered by tiffin owners.
 * Each item belongs to an owner and has pricing, availability, and meal type info.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { ENUM_VALUES } = require('../utils/constants');

const MenuItem = sequelize.define('MenuItem', {
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
    comment: 'FK to users table - the owner who created this item',
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Menu item name is required' },
    },
    comment: 'Name of the menu item',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Detailed description of the item',
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL to the item image',
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Category: Full Tiffin, Roti Only, Sabji, Custom, etc.',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Price must be a positive value' },
    },
    comment: 'Price per serving in INR',
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether the item is currently available for ordering',
  },
  meal_type: {
    type: DataTypes.ENUM(...ENUM_VALUES.mealTypes),
    allowNull: true,
    comment: 'Meal time category: breakfast, lunch, dinner, snack',
  },
  serving_size: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Serving size description (e.g., "1 plate", "250g")',
  },
  delivery_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this item can be delivered',
  },
  pickup_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this item is available for pickup',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Soft delete flag',
  },
}, {
  tableName: 'menu_items',
  timestamps: true,
  underscored: true,
});

module.exports = MenuItem;
