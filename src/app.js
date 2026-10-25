/**
 * Homemade Tiffin Management App - Main Application Entry Point
 *
 * This is the main Express application file that:
 * - Loads environment configuration
 * - Sets up Express middleware (CORS, JSON parsing, logging)
 * - Mounts API route handlers
 * - Applies global error handling
 * - Syncs database models with Sequelize
 * - Starts the HTTP server
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const { sequelize } = require('./models');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Import route modules
const authRoutes = require('./routes/auth.routes');
const ownerRoutes = require('./routes/owner.routes');
const customerRoutes = require('./routes/customer.routes');
const notificationRoutes = require('./routes/notification.routes');

// Create Express application
const app = express();

// ============================================================
// Global Middleware
// ============================================================

// Enable CORS for all origins (configure in production)
app.use(cors());

// Parse JSON request bodies (limit to 10mb for image uploads)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging (dev format for development)
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// ============================================================
// Health Check Endpoint
// ============================================================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Homemade Tiffin API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// ============================================================
// API Route Mounting
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/notifications', notificationRoutes);

// ============================================================
// Error Handling
// ============================================================

// Handle 404 - Route not found
app.use(notFoundHandler);

// Global error handler (must be last middleware)
app.use(errorHandler);

// ============================================================
// Database Sync & Server Startup
// ============================================================

const PORT = config.port;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync all models with database
    // alter: true will modify existing tables to match models (use with caution in production)
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synced successfully.');

    // Start the HTTP server
    app.listen(PORT, () => {
      console.log(`\n🚀 Homemade Tiffin API Server started successfully!`);
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
