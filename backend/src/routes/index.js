const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const walletRoutes = require('./wallet.routes');
const tradingRoutes = require('./trading.routes');
const marketRoutes = require('./market.routes');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// API version and health check
router.get('/', (req, res) => {
  res.json({
    message: 'Crypto Exchange API',
    version: '1.0.0',
    status: 'active'
  });
});

// Public routes
router.use('/auth', authRoutes);
router.use('/market', marketRoutes);

// Protected routes
router.use('/users', authenticate, userRoutes);
router.use('/wallets', authenticate, walletRoutes);
router.use('/trading', authenticate, tradingRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} does not exist`
  });
});

module.exports = router;

