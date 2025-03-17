const winston = require('winston');

// Define log format
const logFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'crypto-exchange' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    })
  ]
});

// In production, we'll use console logging only
// This avoids the permission issues with creating log directories
if (process.env.NODE_ENV === 'production') {
  console.log('Running in production mode - using console logging only');
}

// Export a streamable object for Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;