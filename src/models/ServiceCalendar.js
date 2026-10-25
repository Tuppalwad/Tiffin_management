/**
 * ServiceCalendar Model
 * Manages owner's service calendar including holidays and off days.
 * Used to prevent orders on days when the owner is not serving.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceCalendar = sequelize.define('ServiceCalendar', {
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
    comment: 'FK to users table - the tiffin owner',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'The calendar date',
  },
  is_holiday: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this date is a holiday/off day',
  },
  reason: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Reason for the holiday (e.g., festival, personal day)',
  },
}, {
  tableName: 'service_calendar',
  timestamps: true,
  underscored: true,
});

module.exports = ServiceCalendar;
