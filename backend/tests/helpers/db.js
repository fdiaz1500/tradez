const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create a pool specifically for tests
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5
});

/**
 * Initialize test database
 * Creates tables and seeds initial data for testing
 */
async function initTestDB() {
  const client = await pool.connect();
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // Drop existing tables if they exist (in reverse order to avoid foreign key constraints)
    await client.query(`
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS sessions CASCADE;
      DROP TABLE IF EXISTS exchange_rates CASCADE;
      DROP TABLE IF EXISTS cryptocurrencies CASCADE;
      DROP TABLE IF EXISTS transactions CASCADE;
      DROP TABLE IF EXISTS wallets CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP EXTENSION IF EXISTS "uuid-ossp";
    `);
    
    // Load and execute schema.sql file
    const schemaPath = path.join(__dirname, '../../..', 'db/init.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schema);
    
    // Seed test data
    await seedTestData(client);
    
    // Commit transaction
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Seed test data
 */
async function seedTestData(client) {
  // Create test user
  const passwordHash = '$2b$12$K8kRWmRtyaJVJGYK4aroA.XKKTrn1WEtVHlZo7gHWvDUxP2prq.Re'; // Password: Test123
  await client.query(`
    INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, role)
    VALUES 
      ('11111111-1111-1111-1111-111111111111', 'test@example.com', $1, 'Test', 'User', true, 'user'),
      ('22222222-2222-2222-2222-222222222222', 'admin@example.com', $1, 'Admin', 'User', true, 'admin')
  `, [passwordHash]);
  
  // Create test wallets
  await client.query(`
    INSERT INTO wallets (id, user_id, currency, balance)
    VALUES 
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'BTC', 1.5),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ETH', 10.0),
      ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'USDT', 5000.0)
  `);
  
  // Create test transactions
  await client.query(`
    INSERT INTO transactions (id, user_id, transaction_type, from_currency, to_currency, from_amount, to_amount, fee, exchange_rate)
    VALUES
      ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'exchange', 'BTC', 'ETH', 0.5, 8.0, 0.005, 16.0)
  `);
  
  // Add some exchange rates
  await client.query(`
    INSERT INTO exchange_rates (from_currency, to_currency, rate)
    VALUES
      ('BTC', 'USD', 50000),
      ('ETH', 'USD', 3000),
      ('BTC', 'ETH', 16.67),
      ('ETH', 'BTC', 0.06)
  `);
}

/**
 * Clean test database
 * Deletes all data from tables but keeps the structure
 */
async function cleanTestDB() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Clean tables in reverse order to avoid foreign key constraints
    await client.query(`
      TRUNCATE TABLE audit_logs CASCADE;
      TRUNCATE TABLE sessions CASCADE;
      TRUNCATE TABLE exchange_rates CASCADE;
      TRUNCATE TABLE transactions CASCADE;
      TRUNCATE TABLE wallets CASCADE;
      TRUNCATE TABLE users CASCADE;
    `);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close database pool
 */
async function closePool() {
  await pool.end();
}

/**
 * Get database pool instance
 */
function getPool() {
  return pool;
}

module.exports = {
  initTestDB,
  cleanTestDB,
  closePool,
  getPool
};

