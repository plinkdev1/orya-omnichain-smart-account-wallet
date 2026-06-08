-- PHASE 1: Foundation Schema
-- Database initialization for ORYA Wallet
-- This migration sets up all core tables for wallet, user, and transaction management

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    privy_user_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    phone_number TEXT,
    username TEXT UNIQUE,
    profile_picture_url TEXT,
    is_kyc_verified BOOLEAN DEFAULT FALSE,
    kyc_provider TEXT,
    kyc_verification_id TEXT,
    kyc_verified_at TIMESTAMP WITH TIME ZONE,
    kyc_data JSONB,
    device_fingerprint TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_privy_user_id ON users(privy_user_id);
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Enable RLS for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_rls_policy ON users
    USING (privy_user_id = current_setting('app.current_user_id', true));

-- ============================================================================
-- 2. WALLETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_name TEXT DEFAULT 'Default Wallet',
    wallet_type TEXT CHECK (wallet_type IN ('embedded', 'imported', 'hardware')),
    chain TEXT NOT NULL CHECK (chain IN ('sui', 'ethereum', 'solana', 'btc', 'aptos')),
    public_address TEXT NOT NULL,
    derivation_path TEXT,
    custody_type TEXT CHECK (custody_type IN ('mpc', 'custodial', 'self')),
    is_primary BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    balance_cache JSONB DEFAULT '{"usd": 0, "native": "0"}',
    balance_cache_updated_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, chain, public_address)
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_chain ON wallets(chain) WHERE is_archived = FALSE;
CREATE INDEX idx_wallets_public_address ON wallets(public_address);
CREATE INDEX idx_wallets_created_at ON wallets(created_at DESC);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY wallets_rls_policy ON wallets
    USING (user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true)));

-- ============================================================================
-- 3. TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    tx_hash TEXT UNIQUE,
    tx_type TEXT NOT NULL CHECK (tx_type IN ('send', 'receive', 'swap', 'deposit', 'withdraw', 'stake', 'bridge')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
    from_address TEXT,
    to_address TEXT,
    amount TEXT NOT NULL,
    amount_in_usd DECIMAL(18, 2),
    token_symbol TEXT,
    token_decimal INT DEFAULT 18,
    fee_amount TEXT,
    fee_in_usd DECIMAL(18, 2),
    chain TEXT NOT NULL,
    gas_used TEXT,
    nonce INT,
    block_number BIGINT,
    confirmations INT DEFAULT 0,
    transaction_data JSONB,
    error_message TEXT,
    retries INT DEFAULT 0,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash) WHERE tx_hash IS NOT NULL;
CREATE INDEX idx_transactions_status ON transactions(status) WHERE status IN ('pending', 'failed');
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_idempotency_key ON transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY transactions_rls_policy ON transactions
    USING (user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true)));

-- ============================================================================
-- 4. SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL UNIQUE,
    device_id TEXT,
    device_name TEXT,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_device_id ON sessions(device_id) WHERE revoked_at IS NULL;

-- ============================================================================
-- 5. PORTFOLIO TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    total_balance_usd DECIMAL(18, 2) DEFAULT 0,
    total_24h_change_usd DECIMAL(18, 2) DEFAULT 0,
    total_24h_change_percent DECIMAL(6, 2) DEFAULT 0,
    total_pnl_usd DECIMAL(18, 2) DEFAULT 0,
    total_pnl_percent DECIMAL(6, 2) DEFAULT 0,
    asset_allocation JSONB DEFAULT '{}',
    last_update_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY portfolios_rls_policy ON portfolios
    USING (user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true)));

-- ============================================================================
-- 6. PORTFOLIO HISTORY TABLE (for analytics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS portfolio_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_value_usd DECIMAL(18, 2),
    asset_breakdown JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_portfolio_history_user_id_created_at ON portfolio_history(user_id, created_at DESC);

-- ============================================================================
-- 7. TOKENS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT UNIQUE NOT NULL,
    chain TEXT NOT NULL,
    contract_address TEXT,
    decimals INT DEFAULT 18,
    name TEXT,
    logo_url TEXT,
    price_usd DECIMAL(18, 8),
    price_change_24h_percent DECIMAL(6, 2),
    market_cap_usd DECIMAL(18, 2),
    volume_24h_usd DECIMAL(18, 2),
    last_price_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chain, contract_address)
);

CREATE INDEX idx_tokens_symbol ON tokens(symbol);
CREATE INDEX idx_tokens_chain ON tokens(chain);

-- ============================================================================
-- 8. LEDGER TABLE (for multi-currency ledger tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
    currency TEXT NOT NULL,
    amount TEXT NOT NULL,
    balance_after TEXT NOT NULL,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('credit', 'debit', 'hold', 'release')),
    reference_type TEXT,
    reference_id TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ledger_entries_user_id ON ledger_entries(user_id, created_at DESC);
CREATE INDEX idx_ledger_entries_wallet_id ON ledger_entries(wallet_id);
CREATE INDEX idx_ledger_entries_currency ON ledger_entries(currency);

-- ============================================================================
-- 9. KYC VERIFICATION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS kyc_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_verification_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
    verification_data JSONB,
    rejection_reason TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kyc_verifications_user_id ON kyc_verifications(user_id);
CREATE INDEX idx_kyc_verifications_status ON kyc_verifications(status);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for wallets
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for transactions
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for portfolios
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for tokens
CREATE TRIGGER update_tokens_updated_at BEFORE UPDATE ON tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for kyc_verifications
CREATE TRIGGER update_kyc_verifications_updated_at BEFORE UPDATE ON kyc_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

-- Insert common tokens
INSERT INTO tokens (symbol, chain, name, decimals, price_usd)
VALUES
    ('SUI', 'sui', 'Sui', 9, 3.50),
    ('ETH', 'ethereum', 'Ethereum', 18, 2100.00),
    ('SOL', 'solana', 'Solana', 9, 210.00),
    ('BTC', 'btc', 'Bitcoin', 8, 52000.00),
    ('USDC', 'ethereum', 'USD Coin', 6, 1.00),
    ('USDT', 'ethereum', 'Tether', 6, 1.00)
ON CONFLICT (symbol, chain) DO NOTHING;

-- ============================================================================
-- Migration complete
-- ============================================================================