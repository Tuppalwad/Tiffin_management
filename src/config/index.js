/**
 * Central Configuration File
 * Loads all environment variables using dotenv and exports them
 * as a structured configuration object.
 */

const dotenv = require('dotenv');
const path = require('path');

// Load .env file from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  // Server configuration
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database configuration
  db: {
    url: process.env.DATABASE_URL || null,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'homemade_tiffin_db',
    dialect: 'mysql',
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  },

  // OTP configuration
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 5,
  },
};

module.exports = config;
