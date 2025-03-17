const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const compression = require('compression');
const redis = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

// Initialize app
const app = express();
const PORT = process.env.PORT || 4000;

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully');
  }
});

// Make db available to routes
app.locals.db = pool;

// Initialize Redis client
let redisClient;

const initRedis = async () => {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  redisClient.on('error', (err) => {
    console.error('Redis client error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis client connected');
  });

  await redisClient.connect();
};

initRedis();

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // Parse URL-encoded bodies
app.use(morgan('combined')); // Logging

// Session management with Redis
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

async function shutdown() {
  console.log('Received shutdown signal');
  
  // Close database pool
  await pool.end();
  console.log('Database pool has ended');
  
  // Close Redis client
  if (redisClient) {
    await redisClient.quit();
    console.log('Redis client has quit');
  }
  
  console.log('Shutdown complete');
  process.exit(0);
}

module.exports = app;





