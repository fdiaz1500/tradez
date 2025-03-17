-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create wallets table
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL,
    balance DECIMAL(24, 8) DEFAULT 0.0,
    address VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, currency)
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    transaction_type VARCHAR(20) NOT NULL,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    from_amount DECIMAL(24, 8) NOT NULL,
    to_amount DECIMAL(24, 8) NOT NULL,
    fee DECIMAL(24, 8) DEFAULT 0.0,
    exchange_rate DECIMAL(24, 8) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    external_tx_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create cryptocurrency table
CREATE TABLE cryptocurrencies (
    symbol VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    decimal_places INTEGER DEFAULT 8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create exchange rates table for caching
CREATE TABLE exchange_rates (
    id SERIAL PRIMARY KEY,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    rate DECIMAL(24, 8) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_currency, to_currency)
);

-- Create sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Add some common cryptocurrencies
INSERT INTO cryptocurrencies (symbol, name, decimal_places) VALUES
('BTC', 'Bitcoin', 8),
('ETH', 'Ethereum', 18),
('USDT', 'Tether', 6),
('USDC', 'USD Coin', 6),
('BNB', 'Binance Coin', 18),
('XRP', 'Ripple', 6),
('ADA', 'Cardano', 6),
('SOL', 'Solana', 9),
('DOGE', 'Dogecoin', 8),
('DOT', 'Polkadot', 10);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_wallets_modtime
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_transactions_modtime
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_cryptocurrencies_modtime
    BEFORE UPDATE ON cryptocurrencies
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Add default exchange rates for testing
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
('BTC', 'USD', 50000.00),
('ETH', 'USD', 3000.00),
('BTC', 'ETH', 16.67),
('ETH', 'BTC', 0.06),
('USDT', 'USD', 1.00),
('USD', 'USDT', 1.00),
('BTC', 'USDT', 50000.00),
('ETH', 'USDT', 3000.00);

-- Add default testing user
-- Password: Demo123! (hashed with bcrypt)
INSERT INTO users (id, email, password_hash, first_name, last_name, role) VALUES 
('00000000-0000-0000-0000-000000000000', 'demo@example.com', '$2b$12$K8kRWmRtyaJVJGYK4aroA.XKKTrn1WEtVHlZo7gHWvDUxP2prq.Re', 'Demo', 'User', 'user');

-- Add default wallets with some funds
INSERT INTO wallets (user_id, currency, balance) VALUES
('00000000-0000-0000-0000-000000000000', 'BTC', 1.50000000),
('00000000-0000-0000-0000-000000000000', 'ETH', 20.00000000),
('00000000-0000-0000-0000-000000000000', 'USDT', 10000.00000000);

-- Add some sample transactions for the demo user
INSERT INTO transactions (user_id, transaction_type, from_currency, to_currency, from_amount, to_amount, fee, exchange_rate) VALUES
('00000000-0000-0000-0000-000000000000', 'exchange', 'BTC', 'ETH', 0.10000000, 1.66700000, 0.00100000, 16.67000000),
('00000000-0000-0000-0000-000000000000', 'exchange', 'USDT', 'BTC', 5000.00000000, 0.10000000, 5.00000000, 0.00002000);


