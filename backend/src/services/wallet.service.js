const { v4: uuidv4 } = require('uuid');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class WalletService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get all wallets for a user
   */
  async getUserWallets(userId) {
    try {
      const result = await this.db.query(
        `SELECT w.*, c.name as currency_name 
         FROM wallets w
         JOIN cryptocurrencies c ON w.currency = c.symbol
         WHERE w.user_id = $1
         ORDER BY w.currency`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching user wallets:', error);
      throw new ApiError('Failed to fetch wallets', 500);
    }
  }

  /**
   * Get a specific wallet for a user
   */
  async getWallet(userId, currency) {
    try {
      const result = await this.db.query(
        `SELECT w.*, c.name as currency_name 
         FROM wallets w
         JOIN cryptocurrencies c ON w.currency = c.symbol
         WHERE w.user_id = $1 AND w.currency = $2`,
        [userId, currency]
      );
      
      if (result.rows.length === 0) {
        throw new ApiError(`Wallet for ${currency} not found`, 404);
      }
      
      return result.rows[0];
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error fetching wallet:', error);
      throw new ApiError('Failed to fetch wallet', 500);
    }
  }

  /**
   * Create a new wallet for a user
   */
  async createWallet(userId, currency) {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if currency is valid
      const currencyResult = await client.query(
        'SELECT symbol FROM cryptocurrencies WHERE symbol = $1 AND is_active = true',
        [currency]
      );
      
      if (currencyResult.rows.length === 0) {
        throw new ApiError(`Invalid or unsupported currency: ${currency}`, 400);
      }
      
      // Check if wallet already exists
      const walletResult = await client.query(
        'SELECT id FROM wallets WHERE user_id = $1 AND currency = $2',
        [userId, currency]
      );
      
      if (walletResult.rows.length > 0) {
        throw new ApiError(`Wallet for ${currency} already exists`, 409);
      }
      
      // Create new wallet
      const walletId = uuidv4();
      await client.query(
        'INSERT INTO wallets (id, user_id, currency, balance) VALUES ($1, $2, $3, $4)',
        [walletId, userId, currency, 0]
      );
      
      // Log wallet creation
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'create', 'wallet', walletId, JSON.stringify({ currency })]
      );
      
      await client.query('COMMIT');
      
      // Return the new wallet
      const newWallet = await this.getWallet(userId, currency);
      return newWallet;
      
    } catch (error) {
      await client.query('ROLLBACK');
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      logger.error('Error creating wallet:', error);
      throw new ApiError('Failed to create wallet', 500);
    } finally {
      client.release();
    }
  }

  /**
   * Get wallet balance 
   */
  async getWalletBalance(userId, currency) {
    try {
      const result = await this.db.query(
        'SELECT balance FROM wallets WHERE user_id = $1 AND currency = $2',
        [userId, currency]
      );
      
      if (result.rows.length === 0) {
        throw new ApiError(`Wallet for ${currency} not found`, 404);
      }
      
      return result.rows[0].balance;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      logger.error('Error fetching wallet balance:', error);
      throw new ApiError('Failed to fetch wallet balance', 500);
    }
  }

  /**
   * Get total balance in USD equivalent
   */
  async getTotalBalanceInUSD(userId) {
    try {
      const wallets = await this.getUserWallets(userId);
      let totalUSDValue = 0;
      
      // For a real implementation, you'd need to fetch all exchange rates to USD
      // This is simplified
      for (const wallet of wallets) {
        if (wallet.currency === 'USD' || wallet.currency === 'USDT' || wallet.currency === 'USDC') {
          // Stablecoins are counted at face value
          totalUSDValue += parseFloat(wallet.balance);
        } else {
          // For other currencies, you would fetch the current USD rate
          // Here we're assuming you have a trading service with a method to get rates
          // const rate = await tradingService.getExchangeRate(wallet.currency, 'USD');
          // totalUSDValue += parseFloat(wallet.balance) * rate;
          
          // For simplicity, we're using a placeholder rate
          // In a real app, you would fetch the actual rates
          const mockRates = {
            'BTC': 50000,
            'ETH': 3000,
            'BNB': 300,
            'XRP': 0.5,
            'ADA': 1.2,
            'SOL': 100,
            'DOGE': 0.1,
            'DOT': 20
          };
          
          const rate = mockRates[wallet.currency] || 1;
          totalUSDValue += parseFloat(wallet.balance) * rate;
        }
      }
      
      return totalUSDValue;
    } catch (error) {
      logger.error('Error calculating total balance:', error);
      throw new ApiError('Failed to calculate total balance', 500);
    }
  }
}

module.exports = WalletService;



