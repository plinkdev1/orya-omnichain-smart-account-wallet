-- MIGRATION: Payment Infrastructure
-- Adds tables for fiat on-ramp, payment methods, transaction limits, and payment processing
-- Supports multiple payment providers (Stripe, Wyre, MoonPay, Simplex, etc.)

-- ============================================================================
-- 1. PAYMENT PROVIDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name TEXT NOT NULL UNIQUE,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('fiat_onramp', 'fiat_offramp', 'card_processor', 'bank_transfer', 'crypto_ramp')),
    api_key TEXT,
    api_secret_encrypted TEXT,
    webhook_secret_encrypted TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    supported_chains JSONB DEFAULT '[]',
    supported_currencies JSONB DEFAULT '[]',
    fee_percentage DECIMAL(5, 2),
    min_transaction_amount DECIMAL(18, 2),
    max_transaction_amount DECIMAL(18, 2),
    settlement_time_hours INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_payment_providers_name ON payment_providers(provider_name);
CREATE INDEX IF NOT EXISTS idx_payment_providers_active ON payment_providers(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE payment_providers IS 'Tracks configured payment providers and their configurations';
COMMENT ON COLUMN payment_providers.api_key IS 'Provider API key for integration';
COMMENT ON COLUMN payment_providers.api_secret_encrypted IS 'Encrypted API secret (AES-256-GCM)';
COMMENT ON COLUMN payment_providers.webhook_secret_encrypted IS 'Encrypted webhook signing secret';

-- ============================================================================
-- 2. PAYMENT METHODS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_method_type TEXT NOT NULL CHECK (payment_method_type IN ('credit_card', 'debit_card', 'bank_account', 'wire_transfer', 'ach', 'sepa', 'apple_pay', 'google_pay')),
    provider_id UUID REFERENCES payment_providers(id) ON DELETE SET NULL,
    provider_payment_method_id TEXT,
    provider_customer_id TEXT,
    display_name TEXT,
    card_last_4 TEXT,
    card_brand TEXT CHECK (card_brand IN ('visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb')),
    bank_name TEXT,
    country_code TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_method TEXT CHECK (verification_method IN ('instant', 'micro_deposits', 'plaid', 'manual')),
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, provider_payment_method_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_provider_id ON payment_methods(provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_payment_methods_verified ON payment_methods(user_id, is_verified);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_methods_rls_policy ON payment_methods
    USING (user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true)));

COMMENT ON TABLE payment_methods IS 'Stores user payment methods for fiat on/off-ramp transactions';
COMMENT ON COLUMN payment_methods.provider_payment_method_id IS 'Payment method ID from provider (e.g., Stripe payment method ID)';
COMMENT ON COLUMN payment_methods.provider_customer_id IS 'Customer ID from provider for recurring charges';

-- ============================================================================
-- 3. FIAT TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS fiat_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    provider_id UUID NOT NULL REFERENCES payment_providers(id),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('onramp', 'offramp')),
    provider_transaction_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    fiat_currency TEXT NOT NULL CHECK (fiat_currency IN ('USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD')),
    fiat_amount DECIMAL(18, 2) NOT NULL,
    crypto_currency TEXT NOT NULL,
    crypto_amount TEXT NOT NULL,
    exchange_rate DECIMAL(18, 8),
    fee_amount DECIMAL(18, 2),
    fee_currency TEXT,
    payment_method_type TEXT,
    receiving_wallet_address TEXT,
    receiving_chain TEXT,
    tx_hash TEXT,
    webhook_status_updated_at TIMESTAMP WITH TIME ZONE,
    error_code TEXT,
    error_message TEXT,
    failure_reason TEXT,
    ip_address INET,
    device_fingerprint TEXT,
    compliance_check_status TEXT CHECK (compliance_check_status IN ('pending', 'approved', 'rejected', 'manual_review')),
    compliance_check_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_fiat_transactions_user_id ON fiat_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_wallet_id ON fiat_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_status ON fiat_transactions(status) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_provider_id ON fiat_transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_created_at ON fiat_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_provider_transaction_id ON fiat_transactions(provider_transaction_id);

ALTER TABLE fiat_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY fiat_transactions_rls_policy ON fiat_transactions
    USING (user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true)));

COMMENT ON TABLE fiat_transactions IS 'Tracks fiat on/off-ramp transactions with provider integration';
COMMENT ON COLUMN fiat_transactions.exchange_rate IS 'Exchange rate used at time of transaction';
COMMENT ON COLUMN fiat_transactions.compliance_check_result IS 'Full compliance check response from AML/KYC provider';

-- ============================================================================
-- 4. TRANSACTION LIMITS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS transaction_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    daily_limit_usd DECIMAL(18, 2) DEFAULT 5000.00,
    daily_spent_usd DECIMAL(18, 2) DEFAULT 0,
    daily_limit_reset_at TIMESTAMP WITH TIME ZONE,
    monthly_limit_usd DECIMAL(18, 2) DEFAULT 50000.00,
    monthly_spent_usd DECIMAL(18, 2) DEFAULT 0,
    monthly_limit_reset_at TIMESTAMP WITH TIME ZONE,
    single_transaction_limit_usd DECIMAL(18, 2) DEFAULT 10000.00,
    kyc_tier TEXT DEFAULT 'unverified' CHECK (kyc_tier IN ('unverified', 'tier1', 'tier2', 'tier3')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transaction_limits_user_id ON transaction_limits(user_id);

ALTER TABLE transaction_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY transaction_limits_rls_policy ON transaction_limits
    USING (user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true)));

COMMENT ON TABLE transaction_limits IS 'Tracks per-user transaction limits and spending thresholds';
COMMENT ON COLUMN transaction_limits.kyc_tier IS 'Determines available limits based on KYC verification level';

-- ============================================================================
-- 5. FIAT TRANSACTION DISPUTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS fiat_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fiat_transaction_id UUID NOT NULL REFERENCES fiat_transactions(id) ON DELETE CASCADE,
    dispute_type TEXT NOT NULL CHECK (dispute_type IN ('unauthorized', 'incorrect_amount', 'non_delivery', 'quality_issue', 'other')),
    dispute_status TEXT NOT NULL DEFAULT 'open' CHECK (dispute_status IN ('open', 'investigating', 'resolved', 'closed')),
    dispute_amount DECIMAL(18, 2),
    description TEXT,
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fiat_disputes_user_id ON fiat_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_fiat_disputes_fiat_transaction_id ON fiat_disputes(fiat_transaction_id);
CREATE INDEX IF NOT EXISTS idx_fiat_disputes_status ON fiat_disputes(dispute_status) WHERE dispute_status IN ('open', 'investigating');

ALTER TABLE fiat_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY fiat_disputes_rls_policy ON fiat_disputes
    USING (user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true)));

COMMENT ON TABLE fiat_disputes IS 'Tracks disputes and chargebacks for fiat transactions';

-- ============================================================================
-- 6. PAYMENT PROCESSING QUEUE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_processing_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fiat_transaction_id UUID NOT NULL UNIQUE REFERENCES fiat_transactions(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES payment_providers(id),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'retry')),
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    error_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_payment_queue_status ON payment_processing_queue(status) WHERE status IN ('queued', 'processing', 'retry');
CREATE INDEX IF NOT EXISTS idx_payment_queue_next_retry_at ON payment_processing_queue(next_retry_at) WHERE status = 'retry';

COMMENT ON TABLE payment_processing_queue IS 'Queue for asynchronous payment processing with retry logic';

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

CREATE TRIGGER update_payment_providers_updated_at BEFORE UPDATE ON payment_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fiat_transactions_updated_at BEFORE UPDATE ON fiat_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_limits_updated_at BEFORE UPDATE ON transaction_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fiat_disputes_updated_at BEFORE UPDATE ON fiat_disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_processing_queue_updated_at BEFORE UPDATE ON payment_processing_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA
-- ============================================================================

INSERT INTO payment_providers (provider_name, provider_type, is_active, supported_chains, supported_currencies)
VALUES
    ('Stripe', 'card_processor', TRUE, '["ethereum", "solana", "sui"]'::jsonb, '["USD", "EUR", "GBP"]'::jsonb),
    ('Wyre', 'fiat_onramp', TRUE, '["ethereum", "solana", "polygon"]'::jsonb, '["USD", "EUR", "GBP", "AUD", "CAD"]'::jsonb),
    ('MoonPay', 'fiat_onramp', TRUE, '["ethereum", "solana", "sui"]'::jsonb, '["USD", "EUR", "GBP", "CHF"]'::jsonb),
    ('Simplex', 'fiat_onramp', TRUE, '["ethereum", "bitcoin", "solana"]'::jsonb, '["USD", "EUR"]'::jsonb),
    ('Ramp', 'fiat_onramp', TRUE, '["ethereum", "solana", "polygon"]'::jsonb, '["USD", "EUR", "GBP"]'::jsonb)
ON CONFLICT (provider_name) DO NOTHING;

-- ============================================================================
-- Migration complete
-- ============================================================================
