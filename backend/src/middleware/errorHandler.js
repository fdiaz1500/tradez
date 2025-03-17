const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Global error handler middleware
 * Responsible for sending standardized error responses
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error
  logger.error(`${err.name}: ${err.message}`, { 
    url: req.originalUrl,
    method: req.method,
    errorStack: err.stack,
    errorName: err.name,
    userId: req.user?.id || 'unauthenticated'
  });
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error = new ApiError(messages.join(', '), 400);
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    error = new ApiError('Duplicate field value entered', 400);
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError('Invalid token', 401);
  }
  
  if (err.name === 'TokenExpiredError') {
    error = new ApiError('Token expired', 401);
  }
  
  // PostgreSQL errors
  if (err.code === '23505') { // Unique violation
    error = new ApiError('Duplicate entry', 400);
  }
  
  // Send error response
  res.status(error.statusCode || err.statusCode || 500).json({
    status: 'error',
    message: error.message || err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

