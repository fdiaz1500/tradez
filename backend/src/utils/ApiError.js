/**
 * Custom API Error class
 * Extends the built-in Error class with additional properties for API errors
 */
class ApiError extends Error {
    /**
     * Create a new API error
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {boolean} isOperational - Whether this is an operational error that we can anticipate
     * @param {string} stack - Error stack trace
     */
    constructor(message, statusCode = 500, isOperational = true, stack = '') {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = isOperational;
      this.name = this.constructor.name;
      
      if (stack) {
        this.stack = stack;
      } else {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }
  
  module.exports = ApiError;

