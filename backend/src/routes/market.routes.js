const express = require('express');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route GET /api/market/currencies
 * @desc Get list of supported cryptocurrencies
 * @access Public
 */
router.get('/currencies', async (req, res, next) => {
  try {
    const { db } = req.app.locals;
    
    const result = await db.query(
      'SELECT symbol, name, decimal_places FROM cryptocurrencies WHERE is_active = true ORDER BY name'
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        currencies: result.rows
      }
    });
  } catch (error) {
    logger.error('Get currencies error:', error);
    next(error);
  }
});

/**
 * @route GET /api/market/exchange-rates
 * @desc Get all current exchange rates
 * @access Public
 */
router.get('/exchange-rates', async (req, res, next) => {
  try {
    const { db } = req.app.locals;
    
    const result = await db.query(
      `SELECT from_currency, to_currency, rate, last_updated 
       FROM exchange_rates 
       ORDER BY from_currency, to_currency`
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        rates: result.rows
      }
    });
  } catch (error) {
    logger.error('Get exchange rates error:', error);
    next(error);
  }
});

/**
 * @route GET /api/market/exchange-rates/:fromCurrency/:toCurrency
 * @desc Get specific exchange rate
 * @access Public
 */
router.get('/exchange-rates/:fromCurrency/:toCurrency', async (req, res, next) => {
  try {
    const { fromCurrency, toCurrency } = req.params;
    const { db } = req.app.locals;
    
    const result = await db.query(
      `SELECT from_currency, to_currency, rate, last_updated 
       FROM exchange_rates 
       WHERE from_currency = $1 AND to_currency = $2`,
      [fromCurrency.toUpperCase(), toCurrency.toUpperCase()]
    );
    
    if (result.rows.length === 0) {
      return next(new ApiError('Exchange rate not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        rate: result.rows[0]
      }
    });
  } catch (error) {
    logger.error('Get exchange rate error:', error);
    next(error);
  }
});

module.exports = router;


