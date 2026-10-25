/**
 * Request Validation Middleware
 * Uses express-validator to validate incoming request data.
 */

const { validationResult } = require('express-validator');

/**
 * Validation middleware
 * Checks for validation errors from express-validator chains.
 * If errors exist, returns a 400 response with error details.
 * Otherwise, passes control to the next middleware.
 *
 * Usage:
 *   router.post('/endpoint',
 *     [body('field').notEmpty().withMessage('Field is required')],
 *     validate,
 *     controller.method
 *   );
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Extract and format validation errors
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    return res.status(400).json({
      success: false,
      status: 'fail',
      message: 'Validation failed',
      errors: extractedErrors,
    });
  }

  next();
};

module.exports = validate;
