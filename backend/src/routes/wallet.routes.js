const express = require('express');
const { body, param, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const WalletService = require('../services/wallet.service');

const router = express.Router();

/**
 * Initialize wallet service
 */
function getWalletService(req) {
  const { db } = req.app.locals;
  return new WalletService(db);
}

/**
 * @route GET /api/wallets
 * @desc Get all user wallets
 * @access Private
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const walletService = getWalletService(req);
    
    const wallets = await walletService.getUserWallets(userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        wallets
      }
    });
  } catch (error) {
    logger.error('Get wallets error:', error);
    next(error);
  }
});

/**
 * @route GET /api/wallets/:currency
 * @desc Get a specific wallet
 * @access Private
 */
router.get('/:currency', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currency } = req.params;
    const walletService = getWalletService(req);
    
    try {
      const wallet = await walletService.getWallet(userId, currency.toUpperCase());
      
      res.status(200).json({
        status: 'success',
        data: {
          wallet
        }
      });
    } catch (error) {
      // Pass ApiError directly to the error handler
      if (error instanceof ApiError) {
        return next(error);
      }
      throw error;
    }
  } catch (error) {
    logger.error('Get wallet error:', error);
    next(error);
  }
});

/**
 * @route POST /api/wallets
 * @desc Create a new wallet
 * @access Private
 */
router.post(
  '/',
  [
    body('currency')
      .notEmpty()
      .withMessage('Currency is required')
      .isLength({ min: 3, max: 10 })
      .withMessage('Currency code must be between 3 and 10 characters')
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Currency code must contain only uppercase letters and numbers')
  ],
  async (req, res, next) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const userId = req.user.id;
      const { currency } = req.body;
      const walletService = getWalletService(req);
      
      try {
        const wallet = await walletService.createWallet(userId, currency.toUpperCase());
        
        res.status(201).json({
          status: 'success',
          message: `Wallet for ${currency.toUpperCase()} created successfully`,
          data: {
            wallet
          }
        });
      } catch (error) {
        // Pass ApiError directly to the error handler
        if (error instanceof ApiError) {
          return next(error);
        }
        throw error;
      }
    } catch (error) {
      logger.error('Create wallet error:', error);
      next(error);
    }
  }
);

/**
 * @route GET /api/wallets/balance/total
 * @desc Get total balance in USD
 * @access Private
 */
router.get('/balance/total', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const walletService = getWalletService(req);
    
    const totalBalance = await walletService.getTotalBalanceInUSD(userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        totalBalanceUSD: totalBalance
      }
    });
  } catch (error) {
    logger.error('Get total balance error:', error);
    next(error);
  }
});

module.exports = router;

