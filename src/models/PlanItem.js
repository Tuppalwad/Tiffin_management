/**
 * PlanItem Model
 * Junction table linking subscription plans to menu items.
 * Defines which menu items are included in a plan and their quantities.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlanItem = sequelize.define('PlanItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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
  menu_item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'menu_items',
      key: 'id',
    },
    comment: 'FK to menu_items table',
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: { args: [1], msg: 'Quantity must be at least 1' },
    },
    comment: 'Quantity of this item included in the plan',
  },
}, {
  tableName: 'plan_items',
  timestamps: true,
  underscored: true,
});

module.exports = PlanItem;
