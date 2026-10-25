/**
 * JWT Authentication Middleware
 * Handles token verification and role-based access control.
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { AppError } = require('./errorHandler');

/**
 * Authentication middleware
 * Extracts JWT from Authorization header, verifies it,
 * and attaches the decoded user payload to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Access denied. Invalid token format.', 401);
    }

    // Verify the token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Attach user info to request object
    req.user = {
      id: decoded.id,
      phone: decoded.phone,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired.', 401));
    }
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * Restricts access to specific user roles.
 * @param  {...string} roles - Allowed roles (e.g., 'owner', 'customer')
 * @returns {Function} Express middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }

    next();
  };
};

module.exports = { authenticate, authorize };
