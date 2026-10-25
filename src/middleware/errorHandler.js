/**
 * Global Error Handler Middleware
 * Provides centralized error handling for the application.
 */

/**
 * Custom Application Error Class
 * Extends the native Error class to include HTTP status codes
 * and operational error flags.
 */
class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Distinguishes operational errors from programming errors

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found Handler
 * Catches requests to undefined routes.
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Global Error Handler
 * Formats and sends error responses based on the environment.
 */
const errorHandler = (err, req, res, next) => {
  // Default error values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR:', {
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
    });
  }

  // Handle specific Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({
      success: false,
      status: 'fail',
      message: 'Validation error',
      errors: messages,
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map((e) => e.message);
    return res.status(409).json({
      success: false,
      status: 'fail',
      message: 'Duplicate entry',
      errors: messages,
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      status: 'fail',
      message: 'Referenced record not found',
    });
  }

  // Send error response
  const response = {
    success: false,
    status: err.status,
    message: err.message || 'Internal server error',
  };

  // Include stack trace in development mode only
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(err.statusCode).json(response);
};

module.exports = { AppError, notFoundHandler, errorHandler };
