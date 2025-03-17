const axios = require('axios');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class TradingService {
  constructor(db, redisClient) {
    this.db = db;
    this.redisClient = redisClient;
    this.CRYPTO_API_KEY = process.env.CRYPTO_API_KEY;
    this.CRYPTO_API_URL = process.env.CRYPTO_API_URL || 'https://api.coingecko.com/api/v3';
    this.TRANSACTION_FEE = 0.001; // 0.1% fee
  }

  /**
   * Get current exchange rate between two currencies
   */
  async getExchangeRate(fromCurrency, toCurrency) {
    try {
      // Check cache first
      const cacheKey = `rate:${fromCurrency}:${toCurrency}`;
      const cachedRate = await this.redisClient.get(cacheKey);
      
      if (cachedRate) {
        return parseFloat(cachedRate);
      }
      
      // Not in cache, fetch from database or API
      const dbResult = await this.db.query(
        'SELECT rate, last_updated FROM exchange_rates WHERE from_currency = $1 AND to_currency = $2',
        [fromCurrency, toCurrency]
      );
      
      // If rate exists in DB and was updated in the last 5 minutes, use it
      const FIVE_MINUTES = 5 * 60 * 1000;
      if (dbResult.rows.length > 0 && 
          (new Date() - new Date(dbResult.rows[0].last_updated)) < FIVE_MINUTES) {
        
        // Store in Redis cache for 5 minutes
        await this.redisClient.set(cacheKey, dbResult.rows[0].rate, { EX: 300 });
        return parseFloat(dbResult.rows[0].rate);
      }
      
      // Fetch from external API
      const rate = await this._fetchExchangeRateFromAPI(fromCurrency, toCurrency);
      
      // Update database
      await this.db.query(
        `INSERT INTO exchange_rates (from_currency, to_currency, rate) 
         VALUES ($1, $2, $3)
         ON CONFLICT (from_currency, to_currency) 
         DO UPDATE SET rate = $3, last_updated = NOW()`,
        [fromCurrency, toCurrency, rate]
      );
      
      // Store in Redis cache for 5 minutes
      await this.redisClient.set(cacheKey, rate.toString(), { EX: 300 });
      
      return rate;
    } catch (error) {
      logger.error('Error getting exchange rate:', error);
      throw new ApiError('Failed to get exchange rate', 500);
    }
  }

  /**
   * Execute a trade between two cryptocurrencies
   */
  async executeTrade(userId, fromCurrency, toCurrency, fromAmount) {
    // Start a database transaction
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Validate amounts
      if (fromAmount <= 0) {
        throw new ApiError('Amount must be greater than zero', 400);
      }
      
      // Check if user has enough balance
      const walletResult = await client.query(
        'SELECT balance FROM wallets WHERE user_id = $1 AND currency = $2 FOR UPDATE',
        [userId, fromCurrency]
      );
      
      if (walletResult.rows.length === 0 || walletResult.rows[0].balance < fromAmount) {
        throw new ApiError(`Insufficient ${fromCurrency} balance`, 400);
      }
      
      // Get current exchange rate
      const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);
      
      // Calculate fee and final amounts
      const fee = fromAmount * this.TRANSACTION_FEE;
      const fromAmountAfterFee = fromAmount - fee;
      const toAmount = fromAmountAfterFee * exchangeRate;
      
      // Update source wallet (deduct funds)
      await client.query(
        'UPDATE wallets SET balance = balance - $1 WHERE user_id = $2 AND currency = $3',
        [fromAmount, userId, fromCurrency]
      );
      
      // Update or create destination wallet (add funds)
      const destWalletResult = await client.query(
        'SELECT id FROM wallets WHERE user_id = $1 AND currency = $2',
        [userId, toCurrency]
      );
      
      if (destWalletResult.rows.length === 0) {
        // Create wallet if it doesn't exist
        await client.query(
          'INSERT INTO wallets (user_id, currency, balance) VALUES ($1, $2, $3)',
          [userId, toCurrency, toAmount]
        );
      } else {
        // Update existing wallet
        await client.query(
          'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2 AND currency = $3',
          [toAmount, userId, toCurrency]
        );
      }
      
      // Record the transaction
      const txResult = await client.query(
        `INSERT INTO transactions 
         (id, user_id, transaction_type, from_currency, to_currency, from_amount, to_amount, fee, exchange_rate)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          uuidv4(),
          userId,
          'exchange',
          fromCurrency,
          toCurrency,
          fromAmount,
          toAmount,
          fee,
          exchangeRate
        ]
      );
      
      // Commit transaction
      await client.query('COMMIT');
      
      return {
        transactionId: txResult.rows[0].id,
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount,
        fee,
        exchangeRate,
        timestamp: new Date()
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Trade execution error:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Failed to execute trade', 500);
    } finally {
      client.release();
    }
  }

  /**
   * Fetch exchange rate from external API
   * This is a private method used internally
   */
  async _fetchExchangeRateFromAPI(fromCurrency, toCurrency) {
    try {
      // Using CoinGecko API as an example
      const response = await axios.get(`${this.CRYPTO_API_URL}/simple/price`, {
        params: {
          ids: this._mapCurrencyToId(fromCurrency),
          vs_currencies: this._mapCurrencyToId(toCurrency),
          api_key: this.CRYPTO_API_KEY
        }
      });
      
      // Extract rate from response
      const fromId = this._mapCurrencyToId(fromCurrency);
      const toId = this._mapCurrencyToId(toCurrency).toLowerCase();
      
      if (!response.data[fromId] || !response.data[fromId][toId]) {
        throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
      }
      
      return response.data[fromId][toId];
    } catch (error) {
      logger.error('API exchange rate fetch error:', error);
      throw new ApiError('Could not fetch current exchange rate', 503);
    }
  }
  
  /**
   * Map currency symbol to CoinGecko ID
   */
  _mapCurrencyToId(currency) {
    // This is a simplified mapping. In a real application, you would have a more comprehensive mapping
    // or fetch the list from the API
    const mapping = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
      'USDC': 'usd-coin',
      'BNB': 'binancecoin',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'SOL': 'solana',
      'DOGE': 'dogecoin',
      'DOT': 'polkadot',
      'USD': 'usd',
      'EUR': 'eur'
    };
    
    return mapping[currency] || currency.toLowerCase();
  }
  
  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(userId, limit = 20, offset = 0) {
    try {
      const result = await this.db.query(
        `SELECT * FROM transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching transaction history:', error);
      throw new ApiError('Failed to fetch transaction history', 500);
    }
  }
}



