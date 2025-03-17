const express = require('express');
const { body, param, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Basic implementation without the full TradingService
 * In a complete application, the service would handle the business logic
 */

/**
 * @route GET /api/trading/rate/:fromCurrency/:toCurrency
 * @desc Get exchange rate between two currencies
 * @access Private
 */
router.get(
  '/rate/:fromCurrency/:toCurrency',
  [
    param('fromCurrency').isString().isLength({ min: 3, max: 10 }),
    param('toCurrency').isString().isLength({ min: 3, max: 10 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { fromCurrency, toCurrency } = req.params;
      const { db } = req.app.locals;
      
      // Get exchange rate from database
      const rateResult = await db.query(
        'SELECT rate FROM exchange_rates WHERE from_currency = $1 AND to_currency = $2',
        [fromCurrency.toUpperCase(), toCurrency.toUpperCase()]
      );
      
      // If no rate found, use a dummy rate for now (in a real app we'd fetch from external API)
      const rate = rateResult.rows.length > 0 
        ? rateResult.rows[0].rate 
        : getDummyRate(fromCurrency, toCurrency);

      res.json({
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        rate,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Get exchange rate error:', error);
      next(error);
    }
  }
);

/**
 * @route GET /api/trading/transactions
 * @desc Get user's transaction history
 * @access Private
 */
router.get('/transactions', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { db } = req.app.locals;
    
    // Get pagination parameters
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const transactions = await db.query(
      `SELECT * FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.status(200).json({
      status: 'success',
      data: {
        transactions: transactions.rows,
        pagination: {
          page,
          limit,
          count: transactions.rows.length
        }
      }
    });
  } catch (error) {
    logger.error('Get transactions error:', error);
    next(error);
  }
});

/**
 * @route GET /api/trading/transactions/:id
 * @desc Get details of a specific transaction
 * @access Private
 */
router.get('/transactions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { db } = req.app.locals;

    const result = await db.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return next(new ApiError('Transaction not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Get transaction details error:', error);
    next(error);
  }
});

/**
 * @route POST /api/trading/exchange
 * @desc Exchange one cryptocurrency for another
 * @access Private
 */
router.post(
  '/exchange',
  [
    body('fromCurrency').isString().isLength({ min: 3, max: 10 }),
    body('toCurrency').isString().isLength({ min: 3, max: 10 }),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // In a real implementation, this would use the TradingService
      // For now, we'll respond with a mock result
      res.status(200).json({
        status: 'success',
        message: 'This is a placeholder. In a real implementation, this would execute the trade.',
        mockTransaction: {
          transactionId: 'mock-transaction-id',
          fromCurrency: req.body.fromCurrency.toUpperCase(),
          toCurrency: req.body.toCurrency.toUpperCase(),
          fromAmount: parseFloat(req.body.amount),
          toAmount: parseFloat(req.body.amount) * getDummyRate(req.body.fromCurrency, req.body.toCurrency),
          fee: parseFloat(req.body.amount) * 0.001,
          exchangeRate: getDummyRate(req.body.fromCurrency, req.body.toCurrency),
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error('Exchange error:', error);
      next(error);
    }
  }
);

// Helper function to get dummy exchange rates for development
function getDummyRate(fromCurrency, toCurrency) {
  const rates = {
    'BTC_USD': 50000,
    'ETH_USD': 3000,
    'BTC_ETH': 16.67,
    'ETH_BTC': 0.06,
    'USDT_USD': 1,
    'USD_USDT': 1,
    'BTC_USDT': 50000,
    'ETH_USDT': 3000
  };
  
  const key = `${fromCurrency.toUpperCase()}_${toCurrency.toUpperCase()}`;
  return rates[key] || 1; // Default to 1 if not found
}

module.exports = router;

