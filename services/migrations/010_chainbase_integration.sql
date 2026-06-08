-- Chainbase Integration Schema
-- Purpose: Multi-chain data indexing, analytics, and cross-chain data aggregation
-- Created: 2025-11-14

-- ============================================================================
-- CHAINBASE INDEXED DATA TABLE
-- ============================================================================
-- Stores indexed data from Chainbase for multiple blockchains
-- Supports flexible JSON data structure for various data types

CREATE TABLE IF NOT EXISTS chainbase_indexed_data (
    id SERIAL PRIMARY KEY,
    chain_id VARCHAR(50) NOT NULL,
    data_type VARCHAR(50) NOT NULL,  -- 'balance', 'transaction', 'token', etc.
    address VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    indexed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_chainbase_chain_address 
    ON chainbase_indexed_data(chain_id, address);

CREATE INDEX IF NOT EXISTS idx_chainbase_data_type 
    ON chainbase_indexed_data(data_type);

CREATE INDEX IF NOT EXISTS idx_chainbase_indexed_at 
    ON chainbase_indexed_data(indexed_at DESC);

CREATE INDEX IF NOT EXISTS idx_chainbase_chain_datatype 
    ON chainbase_indexed_data(chain_id, data_type);

-- JSONB index for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_chainbase_data_jsonb 
    ON chainbase_indexed_data USING GIN(data);

-- Unique constraint to prevent duplicate indexing of same data
ALTER TABLE chainbase_indexed_data 
    ADD CONSTRAINT unique_chainbase_data UNIQUE(chain_id, data_type, address);

-- ============================================================================
-- CHAINBASE SYNC STATUS TABLE
-- ============================================================================
-- Tracks synchronization progress for each blockchain

CREATE TABLE IF NOT EXISTS chainbase_sync_status (
    chain_id VARCHAR(50) PRIMARY KEY,
    last_block_synced BIGINT NOT NULL DEFAULT 0,
    last_sync_time TIMESTAMP NOT NULL DEFAULT NOW(),
    sync_status VARCHAR(20) NOT NULL DEFAULT 'syncing',  -- 'syncing', 'synced', 'error'
    error_message TEXT,
    consecutive_failures INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Performance index for monitoring sync status
CREATE INDEX IF NOT EXISTS idx_chainbase_sync_status_updated 
    ON chainbase_sync_status(updated_at DESC);

-- ============================================================================
-- CHAINBASE BALANCE HISTORY TABLE
-- ============================================================================
-- Tracks historical balance data for analytics and trend analysis

CREATE TABLE IF NOT EXISTS chainbase_balance_history (
    id SERIAL PRIMARY KEY,
    chain_id VARCHAR(50) NOT NULL,
    address VARCHAR(255) NOT NULL,
    token_address VARCHAR(255),
    balance DECIMAL(38, 18) NOT NULL,
    decimals INT,
    snapshot_timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Optimize queries by chain and address over time
CREATE INDEX IF NOT EXISTS idx_chainbase_balance_chain_address_time 
    ON chainbase_balance_history(chain_id, address, snapshot_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_chainbase_balance_token 
    ON chainbase_balance_history(chain_id, token_address);

CREATE INDEX IF NOT EXISTS idx_chainbase_balance_snapshot 
    ON chainbase_balance_history(snapshot_timestamp DESC);

-- ============================================================================
-- CHAINBASE TRANSACTION CACHE TABLE
-- ============================================================================
-- Caches transaction data for quick retrieval

CREATE TABLE IF NOT EXISTS chainbase_transaction_cache (
    id SERIAL PRIMARY KEY,
    chain_id VARCHAR(50) NOT NULL,
    tx_hash VARCHAR(255) NOT NULL UNIQUE,
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    value DECIMAL(38, 18),
    gas_price DECIMAL(38, 18),
    gas_used BIGINT,
    block_number BIGINT,
    transaction_index INT,
    status INT,  -- 0 = failed, 1 = success
    timestamp TIMESTAMP NOT NULL,
    raw_data JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Optimize common transaction queries
CREATE INDEX IF NOT EXISTS idx_chainbase_tx_chain_hash 
    ON chainbase_transaction_cache(chain_id, tx_hash);

CREATE INDEX IF NOT EXISTS idx_chainbase_tx_from_address 
    ON chainbase_transaction_cache(chain_id, from_address);

CREATE INDEX IF NOT EXISTS idx_chainbase_tx_to_address 
    ON chainbase_transaction_cache(chain_id, to_address);

CREATE INDEX IF NOT EXISTS idx_chainbase_tx_block_number 
    ON chainbase_transaction_cache(chain_id, block_number DESC);

CREATE INDEX IF NOT EXISTS idx_chainbase_tx_timestamp 
    ON chainbase_transaction_cache(timestamp DESC);

-- ============================================================================
-- CHAINBASE TOKEN REGISTRY TABLE
-- ============================================================================
-- Registry of tokens indexed across chains

CREATE TABLE IF NOT EXISTS chainbase_token_registry (
    id SERIAL PRIMARY KEY,
    chain_id VARCHAR(50) NOT NULL,
    contract_address VARCHAR(255) NOT NULL,
    symbol VARCHAR(20),
    name VARCHAR(255),
    decimals INT,
    total_supply DECIMAL(38, 18),
    is_verified BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Optimize token lookups
CREATE INDEX IF NOT EXISTS idx_chainbase_token_chain_address 
    ON chainbase_token_registry(chain_id, contract_address);

CREATE INDEX IF NOT EXISTS idx_chainbase_token_symbol 
    ON chainbase_token_registry(chain_id, symbol);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chainbase_token_unique 
    ON chainbase_token_registry(chain_id, contract_address);

-- ============================================================================
-- CHAINBASE ANALYTICS AGGREGATES TABLE
-- ============================================================================
-- Pre-aggregated analytics data for performance

CREATE TABLE IF NOT EXISTS chainbase_analytics (
    id SERIAL PRIMARY KEY,
    chain_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    total_value_locked DECIMAL(38, 18),
    transaction_volume DECIMAL(38, 18),
    transaction_count BIGINT,
    active_addresses BIGINT,
    average_gas_price DECIMAL(38, 18),
    total_gas_spent DECIMAL(38, 18),
    unique_contracts INT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Optimize analytics queries
CREATE INDEX IF NOT EXISTS idx_chainbase_analytics_chain_date 
    ON chainbase_analytics(chain_id, date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chainbase_analytics_unique 
    ON chainbase_analytics(chain_id, date);

-- ============================================================================
-- CHAINBASE API RATE LIMIT TRACKER
-- ============================================================================
-- Tracks API usage for rate limiting and monitoring

CREATE TABLE IF NOT EXISTS chainbase_api_usage (
    id SERIAL PRIMARY KEY,
    dataset_id VARCHAR(255),
    query_type VARCHAR(50),
    request_count INT DEFAULT 1,
    date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Track daily usage per dataset and query type
CREATE INDEX IF NOT EXISTS idx_chainbase_usage_dataset_date 
    ON chainbase_api_usage(dataset_id, date DESC);

-- ============================================================================
-- AUTOMATIC TIMESTAMP UPDATE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_chainbase_sync_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chainbase_sync_status_timestamp_trigger
BEFORE UPDATE ON chainbase_sync_status
FOR EACH ROW
EXECUTE FUNCTION update_chainbase_sync_status_timestamp();

CREATE OR REPLACE FUNCTION update_chainbase_token_registry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chainbase_token_registry_timestamp_trigger
BEFORE UPDATE ON chainbase_token_registry
FOR EACH ROW
EXECUTE FUNCTION update_chainbase_token_registry_timestamp();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for current chain sync status
CREATE OR REPLACE VIEW chainbase_sync_status_current AS
SELECT 
    chain_id,
    last_block_synced,
    last_sync_time,
    sync_status,
    error_message,
    EXTRACT(EPOCH FROM (NOW() - last_sync_time)) / 60 as minutes_since_sync
FROM chainbase_sync_status
ORDER BY last_sync_time DESC;

-- View for TVL by chain
CREATE OR REPLACE VIEW chainbase_tvl_by_chain AS
SELECT 
    chain_id,
    data_type,
    COUNT(DISTINCT address) as unique_addresses,
    COUNT(*) as total_entries,
    MAX(last_updated) as last_updated
FROM chainbase_indexed_data
WHERE data_type = 'balance'
GROUP BY chain_id, data_type
ORDER BY chain_id;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE chainbase_indexed_data IS 'Primary table for storing indexed blockchain data from Chainbase API';
COMMENT ON COLUMN chainbase_indexed_data.data_type IS 'Type of data: balance, transaction, token, etc.';
COMMENT ON COLUMN chainbase_indexed_data.data IS 'JSONB field for flexible data storage';

COMMENT ON TABLE chainbase_sync_status IS 'Tracks synchronization progress for each blockchain';
COMMENT ON TABLE chainbase_balance_history IS 'Historical balance snapshots for trend analysis';
COMMENT ON TABLE chainbase_transaction_cache IS 'Cached transaction data for quick access';
COMMENT ON TABLE chainbase_token_registry IS 'Registry of tokens across all chains';
COMMENT ON TABLE chainbase_analytics IS 'Pre-aggregated analytics data';

-- Migration complete
-- Total tables created: 7
-- Total indexes created: 20+
-- Total views created: 2
-- Date: 2025-11-14
