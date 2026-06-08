-- MIGRATION: Chain Health Monitoring
-- Adds tables for tracking blockchain node health, RPC endpoint performance, and chain metrics
-- Monitors network status, gas prices, confirmations, and provider availability

-- ============================================================================
-- 1. BLOCKCHAIN NETWORKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS blockchain_networks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chain_name TEXT NOT NULL UNIQUE,
    chain_id TEXT,
    network_type TEXT NOT NULL CHECK (network_type IN ('mainnet', 'testnet', 'devnet')),
    consensus_mechanism TEXT CHECK (consensus_mechanism IN ('pow', 'pos', 'pbft', 'other')),
    is_monitored BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    native_token_symbol TEXT,
    native_token_decimals INT DEFAULT 18,
    average_block_time_ms INT,
    finality_time_ms INT,
    expected_confirmations_count INT DEFAULT 12,
    block_explorer_url TEXT,
    documentation_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blockchain_networks_name ON blockchain_networks(chain_name);
CREATE INDEX IF NOT EXISTS idx_blockchain_networks_monitored ON blockchain_networks(is_monitored) WHERE is_monitored = TRUE;
CREATE INDEX IF NOT EXISTS idx_blockchain_networks_active ON blockchain_networks(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE blockchain_networks IS 'Registry of supported blockchain networks with configuration';
COMMENT ON COLUMN blockchain_networks.expected_confirmations_count IS 'Number of block confirmations to consider transaction final';

-- ============================================================================
-- 2. RPC PROVIDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rpc_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blockchain_network_id UUID NOT NULL REFERENCES blockchain_networks(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL,
    rpc_url TEXT NOT NULL,
    wss_url TEXT,
    api_key_encrypted TEXT,
    provider_type TEXT CHECK (provider_type IN ('public', 'private', 'premium', 'custom')),
    is_active BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,
    priority INT DEFAULT 100,
    rate_limit_requests_per_second INT,
    rate_limit_requests_per_day BIGINT,
    timeout_ms INT DEFAULT 5000,
    retry_count INT DEFAULT 3,
    supports_events BOOLEAN DEFAULT TRUE,
    supports_archive BOOLEAN DEFAULT FALSE,
    geolocation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blockchain_network_id, provider_name, rpc_url)
);

CREATE INDEX IF NOT EXISTS idx_rpc_providers_network_id ON rpc_providers(blockchain_network_id);
CREATE INDEX IF NOT EXISTS idx_rpc_providers_active ON rpc_providers(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_rpc_providers_primary ON rpc_providers(blockchain_network_id) WHERE is_primary = TRUE;

COMMENT ON TABLE rpc_providers IS 'RPC endpoint providers for blockchain network access';
COMMENT ON COLUMN rpc_providers.priority IS 'Priority for selection (lower = higher priority)';
COMMENT ON COLUMN rpc_providers.api_key_encrypted IS 'Encrypted API key for premium providers';

-- ============================================================================
-- 3. RPC PROVIDER HEALTH TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rpc_provider_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rpc_provider_id UUID NOT NULL REFERENCES rpc_providers(id) ON DELETE CASCADE,
    health_status TEXT NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
    response_time_ms DECIMAL(10, 2),
    last_checked_at TIMESTAMP WITH TIME ZONE,
    consecutive_failures INT DEFAULT 0,
    total_checks INT DEFAULT 0,
    successful_checks INT DEFAULT 0,
    failed_checks INT DEFAULT 0,
    error_message TEXT,
    last_error_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT CHECK (sync_status IN ('synced', 'syncing', 'out_of_sync')),
    current_block_height BIGINT,
    latest_block_time TIMESTAMP WITH TIME ZONE,
    availability_percent DECIMAL(5, 2) DEFAULT 100.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rpc_health_provider_id ON rpc_provider_health(rpc_provider_id);
CREATE INDEX IF NOT EXISTS idx_rpc_health_status ON rpc_provider_health(health_status);
CREATE INDEX IF NOT EXISTS idx_rpc_health_checked_at ON rpc_provider_health(last_checked_at DESC);

COMMENT ON TABLE rpc_provider_health IS 'Real-time health metrics for RPC providers';
COMMENT ON COLUMN rpc_provider_health.sync_status IS 'Whether the node is fully synced with the blockchain';

-- ============================================================================
-- 4. NETWORK METRICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS network_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blockchain_network_id UUID NOT NULL REFERENCES blockchain_networks(id) ON DELETE CASCADE,
    metrics_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    current_block_height BIGINT,
    average_block_time_ms INT,
    transaction_count_1h INT,
    transaction_count_24h INT,
    active_validators INT,
    network_hashrate TEXT,
    difficulty NUMERIC,
    mempool_size_transactions INT,
    mempool_size_bytes BIGINT,
    network_utilization_percent DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_network_metrics_network_id ON network_metrics(blockchain_network_id);
CREATE INDEX IF NOT EXISTS idx_network_metrics_timestamp ON network_metrics(metrics_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_network_metrics_block_height ON network_metrics(current_block_height DESC);

COMMENT ON TABLE network_metrics IS 'Historical metrics for blockchain network performance';

-- ============================================================================
-- 5. GAS PRICE TRACKER TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS gas_price_tracker (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blockchain_network_id UUID NOT NULL REFERENCES blockchain_networks(id) ON DELETE CASCADE,
    tracked_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    gas_price_standard DECIMAL(18, 8),
    gas_price_fast DECIMAL(18, 8),
    gas_price_fastest DECIMAL(18, 8),
    base_fee DECIMAL(18, 8),
    priority_fee DECIMAL(18, 8),
    estimated_wait_time_standard INT,
    estimated_wait_time_fast INT,
    estimated_wait_time_fastest INT,
    source_provider_id UUID REFERENCES rpc_providers(id) ON DELETE SET NULL,
    confidence_level DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gas_price_network_id ON gas_price_tracker(blockchain_network_id);
CREATE INDEX IF NOT EXISTS idx_gas_price_timestamp ON gas_price_tracker(tracked_timestamp DESC);

COMMENT ON TABLE gas_price_tracker IS 'Historical gas price data for transaction cost estimation';
COMMENT ON COLUMN gas_price_tracker.confidence_level IS 'Confidence score (0-100) in the gas price estimate';

-- ============================================================================
-- 6. BLOCK WATCHER TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS block_watcher (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blockchain_network_id UUID NOT NULL REFERENCES blockchain_networks(id) ON DELETE CASCADE,
    block_height BIGINT NOT NULL,
    block_hash TEXT NOT NULL,
    block_timestamp TIMESTAMP WITH TIME ZONE,
    parent_hash TEXT,
    miner_address TEXT,
    transaction_count INT,
    block_size_bytes INT,
    block_reward DECIMAL(18, 8),
    base_fee DECIMAL(18, 8),
    difficulty NUMERIC,
    gas_used BIGINT,
    gas_limit BIGINT,
    is_finalized BOOLEAN DEFAULT FALSE,
    finalized_at TIMESTAMP WITH TIME ZONE,
    orphaned BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blockchain_network_id, block_height, block_hash)
);

CREATE INDEX IF NOT EXISTS idx_block_watcher_network_height ON block_watcher(blockchain_network_id, block_height DESC);
CREATE INDEX IF NOT EXISTS idx_block_watcher_finalized ON block_watcher(is_finalized) WHERE is_finalized = FALSE;
CREATE INDEX IF NOT EXISTS idx_block_watcher_orphaned ON block_watcher(orphaned) WHERE orphaned = TRUE;

COMMENT ON TABLE block_watcher IS 'Tracks blockchain blocks for monitoring and analytics';

-- ============================================================================
-- 7. TRANSACTION CONFIRMATION TRACKER TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS transaction_confirmation_tracker (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    blockchain_network_id UUID NOT NULL REFERENCES blockchain_networks(id) ON DELETE CASCADE,
    tx_hash TEXT NOT NULL,
    block_height BIGINT,
    confirmation_count INT DEFAULT 0,
    is_confirmed BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    expected_confirmation_time_seconds INT,
    actual_confirmation_time_seconds INT,
    confirmation_tracking_started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blockchain_network_id, tx_hash)
);

CREATE INDEX IF NOT EXISTS idx_txn_confirmation_tx_id ON transaction_confirmation_tracker(transaction_id);
CREATE INDEX IF NOT EXISTS idx_txn_confirmation_network ON transaction_confirmation_tracker(blockchain_network_id);
CREATE INDEX IF NOT EXISTS idx_txn_confirmation_hash ON transaction_confirmation_tracker(tx_hash);
CREATE INDEX IF NOT EXISTS idx_txn_confirmation_confirmed ON transaction_confirmation_tracker(is_confirmed) WHERE is_confirmed = FALSE;

ALTER TABLE transaction_confirmation_tracker ENABLE ROW LEVEL SECURITY;
CREATE POLICY txn_confirmation_rls_policy ON transaction_confirmation_tracker
    USING (transaction_id IN (SELECT id FROM transactions WHERE user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true))));

COMMENT ON TABLE transaction_confirmation_tracker IS 'Tracks transaction confirmations and confirmation timing';

-- ============================================================================
-- 8. NETWORK ALERT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS network_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blockchain_network_id UUID NOT NULL REFERENCES blockchain_networks(id) ON DELETE CASCADE,
    rpc_provider_id UUID REFERENCES rpc_providers(id) ON DELETE SET NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('node_down', 'high_latency', 'out_of_sync', 'low_block_height', 'high_gas_price', 'network_congestion', 'finality_issue', 'other')),
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    alert_status TEXT NOT NULL DEFAULT 'active' CHECK (alert_status IN ('active', 'acknowledged', 'resolved')),
    description TEXT,
    recommended_action TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    alert_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_network_alerts_network_id ON network_alerts(blockchain_network_id);
CREATE INDEX IF NOT EXISTS idx_network_alerts_status ON network_alerts(alert_status) WHERE alert_status IN ('active', 'acknowledged');
CREATE INDEX IF NOT EXISTS idx_network_alerts_severity ON network_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_network_alerts_created ON network_alerts(created_at DESC);

COMMENT ON TABLE network_alerts IS 'Alerts for blockchain network anomalies and issues';

-- ============================================================================
-- 9. CHAIN PERFORMANCE HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS chain_performance_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blockchain_network_id UUID NOT NULL REFERENCES blockchain_networks(id) ON DELETE CASCADE,
    performance_date DATE NOT NULL,
    average_block_time_ms INT,
    average_transaction_cost_usd DECIMAL(18, 2),
    total_transactions_count INT,
    average_confirmation_time_seconds INT,
    provider_uptime_percent DECIMAL(5, 2),
    network_status TEXT,
    summary_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blockchain_network_id, performance_date)
);

CREATE INDEX IF NOT EXISTS idx_chain_perf_network_id ON chain_performance_history(blockchain_network_id);
CREATE INDEX IF NOT EXISTS idx_chain_perf_date ON chain_performance_history(performance_date DESC);

COMMENT ON TABLE chain_performance_history IS 'Daily summary of blockchain network performance';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_blockchain_networks_updated_at BEFORE UPDATE ON blockchain_networks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rpc_providers_updated_at BEFORE UPDATE ON rpc_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rpc_provider_health_updated_at BEFORE UPDATE ON rpc_provider_health
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_block_watcher_updated_at BEFORE UPDATE ON block_watcher
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_confirmation_tracker_updated_at BEFORE UPDATE ON transaction_confirmation_tracker
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_network_alerts_updated_at BEFORE UPDATE ON network_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: Blockchain Networks
-- ============================================================================

INSERT INTO blockchain_networks (chain_name, chain_id, network_type, consensus_mechanism, is_monitored, is_active, native_token_symbol, native_token_decimals, average_block_time_ms, expected_confirmations_count)
VALUES
    ('Ethereum', '1', 'mainnet', 'pos', TRUE, TRUE, 'ETH', 18, 12000, 12),
    ('Polygon', '137', 'mainnet', 'pos', TRUE, TRUE, 'MATIC', 18, 2500, 128),
    ('Solana', '101', 'mainnet', 'pos', TRUE, TRUE, 'SOL', 9, 400, 32),
    ('SUI', '0', 'mainnet', 'pos', TRUE, TRUE, 'SUI', 9, 3000, 10),
    ('Bitcoin', NULL, 'mainnet', 'pow', TRUE, TRUE, 'BTC', 8, 600000, 6),
    ('Arbitrum One', '42161', 'mainnet', 'pos', TRUE, TRUE, 'ETH', 18, 250, 1),
    ('Optimism', '10', 'mainnet', 'pos', TRUE, TRUE, 'ETH', 18, 2000, 1),
    ('Base', '8453', 'mainnet', 'pos', TRUE, TRUE, 'ETH', 18, 2000, 1),
    ('Aptos', NULL, 'mainnet', 'pos', TRUE, TRUE, 'APT', 8, 1000, 30),
    ('Cosmos Hub', NULL, 'mainnet', 'pos', TRUE, TRUE, 'ATOM', 6, 7000, 1)
ON CONFLICT (chain_name) DO NOTHING;

-- ============================================================================
-- SEED DATA: RPC Providers
-- ============================================================================

INSERT INTO rpc_providers (blockchain_network_id, provider_name, rpc_url, provider_type, is_active, is_primary, priority)
SELECT id, 'Alchemy', 'https://eth-mainnet.g.alchemy.com/v2/demo', 'premium', TRUE, TRUE, 10
FROM blockchain_networks WHERE chain_name = 'Ethereum'
ON CONFLICT DO NOTHING;

INSERT INTO rpc_providers (blockchain_network_id, provider_name, rpc_url, provider_type, is_active, is_primary, priority)
SELECT id, 'Infura', 'https://mainnet.infura.io/v3/demo', 'premium', TRUE, FALSE, 20
FROM blockchain_networks WHERE chain_name = 'Ethereum'
ON CONFLICT DO NOTHING;

INSERT INTO rpc_providers (blockchain_network_id, provider_name, rpc_url, provider_type, is_active, is_primary, priority)
SELECT id, 'QuickNode', 'https://api.quicknode.com/rpc/solana/mainnet-beta/demo', 'premium', TRUE, TRUE, 10
FROM blockchain_networks WHERE chain_name = 'Solana'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Migration complete
-- ============================================================================
