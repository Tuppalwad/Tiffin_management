/**
 * Notification Model
 * Stores in-app notifications for users.
 * Supports different notification types and references to related entities.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'FK to users table - the notification recipient',
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Notification title/headline',
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notification body/content',
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Notification type: order, payment, subscription, skip, general',
  },
  reference_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of the related entity (order, subscription, etc.)',
  },
  reference_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Type of the related entity (order, subscription, payment, etc.)',
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the notification has been read by the user',
  },
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
});

module.exports = Notification;
