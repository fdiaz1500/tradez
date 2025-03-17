/**
 * Application configuration
 * Load environment variables and define app settings
 */

// Default configuration
const config = {
  // Node environment
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Server settings
  server: {
    port: parseInt(process.env.PORT || '4000', 10),
    host: process.env.HOST || '0.0.0.0',
  },
  
  // Database settings
  database: {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/crypto_exchange',
    maxPoolSize: parseInt(process.env.DB_POOL_SIZE || '20', 10),
    connectionTimeoutMillis: 2000,
  },
  
  // Redis settings
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
  },
  
  // JWT settings
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  
  // Crypto API settings
  cryptoApi: {
    url: process.env.CRYPTO_API_URL || 'https://api.coingecko.com/api/v3',
    key: process.env.CRYPTO_API_KEY || '',
    timeout: parseInt(process.env.API_TIMEOUT || '5000', 10),
  },
  
  // CORS origins
  corsOrigins: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['http://localhost:3000', 'http://localhost'],
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    pretty: process.env.NODE_ENV !== 'production',
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per windowMs
  },
  
  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  },
  
  // Trading
  trading: {
    defaultFee: parseFloat(process.env.DEFAULT_TRADING_FEE || '0.001'), // 0.1%
    minAmount: parseFloat(process.env.MIN_TRADING_AMOUNT || '0.0001'),
  },
};

// Environment-specific overrides
if (config.nodeEnv === 'production') {
  // Production specific settings
  Object.assign(config, {
    // Override any settings for production
  });
} else if (config.nodeEnv === 'test') {
  // Test specific settings
  Object.assign(config, {
    // Override any settings for testing
  });
}

// Validation
const requiredEnvVars = ['JWT_SECRET', 'SESSION_SECRET'];
if (config.nodeEnv === 'production') {
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      console.warn(`[WARNING] Missing required environment variable in production: ${envVar}`);
    }
  });
}

module.exports = config;



