-- Migration: Create transactions table and indexes
-- Timestamp: 2025-01-15
-- Description: Main transactions table for tracking multi-chain transactions

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    
    -- Transaction hash and blockchain data
    tx_hash TEXT UNIQUE,
    tx_type TEXT NOT NULL DEFAULT 'send',
    status TEXT NOT NULL DEFAULT 'pending',
    
    -- Addresses and amounts
    from_address TEXT,
    to_address TEXT,
    amount TEXT NOT NULL,
    amount_in_usd DECIMAL(18, 2),
    
    -- Token information
    token_symbol TEXT,
    token_decimal INT,
    
    -- Fee information
    fee_amount TEXT,
    fee_in_usd DECIMAL(18, 2),
    
    -- Blockchain information
    chain TEXT NOT NULL,
    gas_used TEXT,
    nonce INT,
    block_number BIGINT,
    confirmations INT DEFAULT 0,
    
    -- Additional data and error handling
    transaction_data JSONB,
    error_message TEXT,
    retries INT DEFAULT 0,
    
    -- Idempotency and timestamps
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for common queries
-- Index for user transaction history
CREATE INDEX IF NOT EXISTS idx_transactions_user_id 
    ON transactions(user_id) 
    WHERE status != 'cancelled';

-- Index for wallet transaction history
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id 
    ON transactions(wallet_id) 
    WHERE status != 'cancelled';

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_transactions_status 
    ON transactions(status);

-- Index for chain filtering
CREATE INDEX IF NOT EXISTS idx_transactions_chain 
    ON transactions(chain);

-- Compound index for user + chain + status (common query pattern)
CREATE INDEX IF NOT EXISTS idx_transactions_user_chain_status 
    ON transactions(user_id, chain, status);

-- Index for pending transaction queries
CREATE INDEX IF NOT EXISTS idx_transactions_pending 
    ON transactions(created_at DESC) 
    WHERE status = 'pending';

-- Index for tx_hash lookups
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash 
    ON transactions(tx_hash) 
    WHERE tx_hash IS NOT NULL;

-- Index for created_at (for sorting)
CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
    ON transactions(created_at DESC);

-- Index for completed transactions (historical queries)
CREATE INDEX IF NOT EXISTS idx_transactions_completed_at 
    ON transactions(completed_at DESC) 
    WHERE completed_at IS NOT NULL;

-- Constraint: Valid transaction types
ALTER TABLE transactions 
    ADD CONSTRAINT check_tx_type 
    CHECK (tx_type IN ('send', 'receive', 'swap', 'deposit', 'withdraw', 'stake', 'bridge'));

-- Constraint: Valid statuses
ALTER TABLE transactions 
    ADD CONSTRAINT check_status 
    CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled'));

-- Constraint: Valid chains
ALTER TABLE transactions 
    ADD CONSTRAINT check_chain 
    CHECK (chain IN ('sui', 'ethereum', 'bitcoin', 'solana', 'arbitrum', 'polygon'));

-- Constraint: Positive amounts (when numeric)
ALTER TABLE transactions 
    ADD CONSTRAINT check_amount_positive 
    CHECK (amount::NUMERIC > 0);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_transactions_updated_at ON transactions;
CREATE TRIGGER trigger_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_transactions_updated_at();

-- Create materialized view for transaction statistics (optional, for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS transaction_stats_summary AS
SELECT
    user_id,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
    COUNT(DISTINCT chain) as unique_chains,
    SUM(CASE WHEN tx_type = 'send' THEN amount::NUMERIC ELSE 0 END) as total_sent,
    SUM(CASE WHEN tx_type = 'receive' THEN amount::NUMERIC ELSE 0 END) as total_received,
    SUM(CASE WHEN fee_amount IS NOT NULL THEN fee_amount::NUMERIC ELSE 0 END) as total_fees,
    AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) FILTER (WHERE completed_at IS NOT NULL) as avg_confirmation_time_seconds,
    MIN(created_at) as first_transaction_at,
    MAX(created_at) as last_transaction_at
FROM transactions
GROUP BY user_id;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_transaction_stats_summary_user_id 
    ON transaction_stats_summary(user_id);

-- Grant appropriate permissions (if using role-based access)
-- GRANT SELECT ON transactions TO app_user;
-- GRANT INSERT, UPDATE ON transactions TO app_user;
-- GRANT SELECT ON transaction_stats_summary TO app_user;