/**
 * Database Configuration
 * Initializes Sequelize ORM with MySQL connection settings.
 * Reads configuration from environment variables via config/index.js.
 */

const { Sequelize } = require('sequelize');
const config = require('./index');

// Create Sequelize instance with MySQL connection
const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: config.nodeEnv === 'development' ? console.log : false,
    timezone: '+05:30', // IST timezone for India

    // Connection pool configuration
    pool: {
      max: 10,       // Maximum number of connections in pool
      min: 0,        // Minimum number of connections in pool
      acquire: 30000, // Maximum time (ms) to acquire a connection
      idle: 10000,    // Maximum time (ms) a connection can be idle
    },

    // Model definition defaults
    define: {
      timestamps: true,       // Add createdAt and updatedAt
      underscored: true,      // Use snake_case for auto-generated fields
      freezeTableName: true,  // Don't pluralize table names automatically
    },
  }
);

module.exports = sequelize;
