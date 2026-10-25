/**
 * Utility Helper Functions
 * Common utility functions used across the application.
 */

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP string
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Format phone number to standard format
 * Ensures phone number starts with country code (+91 for India).
 * @param {string} phone - Raw phone number input
 * @returns {string} Formatted phone number
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return null;

  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // If number starts with 91 and is 12 digits, it already has country code
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }

  // If 10-digit number, add +91 prefix
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  // Return as-is if already formatted or unknown format
  return phone;
};

/**
 * Pagination helper
 * Calculates offset and limit from page number and page size.
 * @param {number} page - Current page number (1-indexed)
 * @param {number} pageSize - Number of items per page
 * @returns {Object} Pagination object with limit, offset, page, and pageSize
 */
const getPagination = (page = 1, pageSize = 20) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedPageSize = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const offset = (parsedPage - 1) * parsedPageSize;

  return {
    limit: parsedPageSize,
    offset,
    page: parsedPage,
    pageSize: parsedPageSize,
  };
};

/**
 * Format paginated response with metadata
 * @param {Object} data - Sequelize findAndCountAll result { count, rows }
 * @param {number} page - Current page number
 * @param {number} pageSize - Items per page
 * @returns {Object} Formatted pagination response
 */
const getPaginatedResponse = (data, page, pageSize) => {
  const { count: totalItems, rows: items } = data;
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    items,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      pageSize,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

/**
 * Format success response
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Formatted success response
 */
const successResponse = (data = null, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    status: 'success',
    statusCode,
    message,
    data,
  };
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {*} errors - Additional error details
 * @returns {Object} Formatted error response
 */
const errorResponse = (message = 'Internal server error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    status: 'error',
    statusCode,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return response;
};

/**
 * Generate a unique order number
 * Format: TF-YYYYMMDD-XXXXX (e.g., TF-20241025-00001)
 * @param {number} sequenceNumber - Sequential order number for the day
 * @returns {string} Formatted order number
 */
const generateOrderNumber = (sequenceNumber = 1) => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(sequenceNumber).padStart(5, '0');
  return `TF-${dateStr}-${seq}`;
};

module.exports = {
  generateOTP,
  formatPhoneNumber,
  getPagination,
  getPaginatedResponse,
  successResponse,
  errorResponse,
  generateOrderNumber,
};
