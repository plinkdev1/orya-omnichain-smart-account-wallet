-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS transactions;
CREATE SCHEMA IF NOT EXISTS portfolio;
CREATE SCHEMA IF NOT EXISTS defi;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS cache;

-- Users Schema
CREATE TABLE users.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  wallet_address VARCHAR(255) UNIQUE NOT NULL,
  kyc_status VARCHAR(50) DEFAULT 'pending',
  kyc_data JSONB DEFAULT NULL,
  profile_data JSONB DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(255) NOT NULL,
  chain VARCHAR(50) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, wallet_address, chain)
);

-- SUI MPC/AA Key Shards Schema
CREATE TABLE users.sui_key_shards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  public_key BYTEA NOT NULL,
  address VARCHAR(66) NOT NULL,
  shard_1_id VARCHAR(255) NOT NULL,
  shard_2_id VARCHAR(255) NOT NULL,
  shard_3_encrypted BYTEA NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, address),
  INDEX ON (user_id),
  INDEX ON (address)
);

-- Transactions Schema
CREATE TABLE transactions.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  tx_type VARCHAR(50) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  from_address VARCHAR(255) NOT NULL,
  to_address VARCHAR(255) NOT NULL,
  chain VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  tx_hash VARCHAR(255) UNIQUE,
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX ON (user_id, created_at DESC),
  INDEX ON (tx_hash)
);

-- Portfolio Schema
CREATE TABLE portfolio.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  symbol VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  value DECIMAL(20, 2) NOT NULL,
  chain VARCHAR(50) NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX ON (user_id, chain)
);

CREATE TABLE portfolio.portfolio_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  total_value DECIMAL(20, 2) NOT NULL,
  asset_count INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DeFi Schema
CREATE TABLE defi.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  protocol VARCHAR(100) NOT NULL,
  chain VARCHAR(50) NOT NULL,
  position_type VARCHAR(50) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  apy DECIMAL(10, 4) DEFAULT NULL,
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX ON (user_id, chain)
);

-- Audit Schema
CREATE TABLE audit.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users.users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  changes JSONB DEFAULT NULL,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX ON (user_id, created_at DESC),
  INDEX ON (action, created_at DESC)
);

-- Cache Schema (for frequent queries)
CREATE TABLE cache.query_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX ON (cache_key),
  INDEX ON (expires_at)
);

-- Card System Schema (NEW - doc_26)
CREATE TABLE IF NOT EXISTS users.card_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  card_id VARCHAR(255) UNIQUE NOT NULL,
  card_last_four VARCHAR(4) NOT NULL,
  card_type VARCHAR(50) NOT NULL,
  card_issuer VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  payment_mode VARCHAR(50) DEFAULT 'custodial',
  velocity_limit DECIMAL(20, 2) DEFAULT NULL,
  daily_spend DECIMAL(20, 2) DEFAULT 0.00,
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX ON (user_id),
  INDEX ON (card_id)
);

-- Ledger Service Tables (NEW - doc_26)
CREATE TABLE IF NOT EXISTS transactions.ledgers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  currency VARCHAR(50) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  balance_after DECIMAL(20, 8) NOT NULL,
  ledger_type VARCHAR(50) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX ON (user_id, currency),
  INDEX ON (transaction_id)
);

-- Ledger Reservations (for card payment holds)
CREATE TABLE IF NOT EXISTS transactions.ledger_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  reservation_id VARCHAR(255) UNIQUE NOT NULL,
  currency VARCHAR(50) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'reserved',
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX ON (user_id, currency),
  INDEX ON (expires_at)
);

-- FX Rates Cache (NEW - doc_26)
CREATE TABLE IF NOT EXISTS defi.fx_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_asset VARCHAR(50) NOT NULL,
  to_asset VARCHAR(50) NOT NULL,
  rate DECIMAL(20, 8) NOT NULL,
  source VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(from_asset, to_asset, source),
  INDEX ON (from_asset, to_asset),
  INDEX ON (expires_at)
);

-- Routing Rules (NEW - doc_26)
CREATE TABLE IF NOT EXISTS defi.routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users.users(id) ON DELETE CASCADE,
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX ON (user_id, is_active)
);

-- User Settings (NEW - doc_26)
CREATE TABLE IF NOT EXISTS users.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  card_payment_mode VARCHAR(50) DEFAULT 'custodial',
  preferred_chain VARCHAR(50) DEFAULT 'SUI',
  auto_swap_enabled BOOLEAN DEFAULT FALSE,
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fraud Events (NEW - doc_26)
CREATE TABLE IF NOT EXISTS audit.fraud_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  risk_score DECIMAL(5, 2) DEFAULT 0.00,
  details JSONB NOT NULL,
  action_taken VARCHAR(255),
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX ON (user_id, created_at DESC),
  INDEX ON (risk_score DESC)
);

-- Enable Row Level Security
ALTER TABLE users.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE users.sui_key_shards ENABLE ROW LEVEL SECURITY;
ALTER TABLE users.card_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions.ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions.ledger_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio.portfolio_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE defi.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE defi.fx_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE defi.routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.fraud_events ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (users can only see their own data)
CREATE POLICY "Users can see their own data" ON users.users
  FOR SELECT USING (id = current_user_id());

CREATE POLICY "Users can see their own key shards" ON users.sui_key_shards
  FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "Users can see their own transactions" ON transactions.transactions
  FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "Users can see their own assets" ON portfolio.assets
  FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "Users can see their own ledgers" ON transactions.ledgers
  FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "Users can see their own reservations" ON transactions.ledger_reservations
  FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "Users can see their own card accounts" ON users.card_accounts
  FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "Users can see their own settings" ON users.user_settings
  FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "Users can see their own fraud events" ON audit.fraud_events
  FOR SELECT USING (user_id = current_user_id());

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA users TO orya_user;
GRANT ALL PRIVILEGES ON SCHEMA transactions TO orya_user;
GRANT ALL PRIVILEGES ON SCHEMA portfolio TO orya_user;
GRANT ALL PRIVILEGES ON SCHEMA defi TO orya_user;
GRANT ALL PRIVILEGES ON SCHEMA audit TO orya_user;
GRANT ALL PRIVILEGES ON SCHEMA cache TO orya_user;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA users TO orya_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA transactions TO orya_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA portfolio TO orya_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA defi TO orya_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO orya_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cache TO orya_user;

-- Create indexes for performance
CREATE INDEX idx_users_email ON users.users(email);
CREATE INDEX idx_users_wallet ON users.users(wallet_address);
CREATE INDEX idx_transactions_user_date ON transactions.transactions(user_id, created_at DESC);
CREATE INDEX idx_assets_user_chain ON portfolio.assets(user_id, chain);
CREATE INDEX idx_positions_user_chain ON defi.positions(user_id, chain);
CREATE INDEX idx_audit_user_date ON audit.logs(user_id, created_at DESC);