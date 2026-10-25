/**
 * OrderItem Model
 * Represents individual items within an order.
 * Stores a snapshot of item details at the time of ordering.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id',
    },
    comment: 'FK to orders table',
  },
  menu_item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'menu_items',
      key: 'id',
    },
    comment: 'FK to menu_items table',
  },
  item_name: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Snapshot of menu item name at order time (preserves history)',
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: { args: [1], msg: 'Quantity must be at least 1' },
    },
    comment: 'Quantity of this item ordered',
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Price per unit at time of order',
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Total price for this line item (quantity × unit_price)',
  },
}, {
  tableName: 'order_items',
  timestamps: true,
  underscored: true,
});

module.exports = OrderItem;
