/**
 * Database Reset Script
 * 
 * This script drops and recreates all tables in the database,
 * then seeds it with initial data including the demo account.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/crypto_exchange',
});

async function resetDatabase() {
  console.log('Starting database reset...');
  
  const client = await pool.connect();
  try {
    // Read the SQL initialization script
    const initSqlPath = path.join(__dirname, '..', 'db', 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Drop existing tables if they exist (in reverse order to avoid foreign key constraints)
    console.log('Dropping existing tables...');
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
    
    // Execute the initialization SQL
    console.log('Creating tables and seeding data...');
    await client.query(initSql);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Database reset completed successfully!');
    console.log('Demo account created with:');
    console.log('  Email: demo@example.com');
    console.log('  Password: Demo123!');
    
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error resetting database:', error);
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
    await pool.end();
  }
}

// Run the script
resetDatabase().catch(err => {
  console.error('Failed to reset database:', err);
  process.exit(1);
});

