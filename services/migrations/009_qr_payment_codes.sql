-- MIGRATION: QR Payment Code Tracking
-- Adds tables for QR code generation, tracking, and expiry management

-- ============================================================================
-- 1. QR PAYMENT CODES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS qr_payment_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
    code_type TEXT NOT NULL CHECK (code_type IN ('static', 'dynamic')),
    payment_uri TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    blockchain_chain TEXT NOT NULL,
    amount_requested DECIMAL(18, 8),
    currency_requested TEXT,
    label TEXT,
    message TEXT,
    is_static BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_expired BOOLEAN GENERATED ALWAYS AS (
        CASE 
            WHEN expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP THEN TRUE
            ELSE FALSE
        END
    ) STORED,
    scans_count INT DEFAULT 0,
    last_scanned_at TIMESTAMP WITH TIME ZONE,
    related_transaction_id UUID REFERENCES fiat_transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_qr_payment_codes_user_id ON qr_payment_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_payment_codes_wallet_id ON qr_payment_codes(wallet_id);
CREATE INDEX IF NOT EXISTS idx_qr_payment_codes_address ON qr_payment_codes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_qr_payment_codes_type ON qr_payment_codes(code_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_qr_payment_codes_expires_at ON qr_payment_codes(expires_at) WHERE is_static = FALSE;
CREATE INDEX IF NOT EXISTS idx_qr_payment_codes_created_at ON qr_payment_codes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_payment_codes_active ON qr_payment_codes(user_id) WHERE deleted_at IS NULL AND is_expired = FALSE;

ALTER TABLE qr_payment_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY qr_payment_codes_rls_policy ON qr_payment_codes
    USING (user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true)));

COMMENT ON TABLE qr_payment_codes IS 'Tracks QR payment codes for receive address and dynamic payment requests';
COMMENT ON COLUMN qr_payment_codes.payment_uri IS 'Full payment URI (e.g., ethereum:0x123...?amount=100)';
COMMENT ON COLUMN qr_payment_codes.code_type IS 'static = receive address QR, dynamic = pre-filled payment request';
COMMENT ON COLUMN qr_payment_codes.is_expired IS 'Computed field: TRUE if expires_at is past current time';
COMMENT ON COLUMN qr_payment_codes.scans_count IS 'Number of times this QR code has been scanned';

-- ============================================================================
-- 2. QR PAYMENT CODE SCANS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS qr_payment_code_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_code_id UUID NOT NULL REFERENCES qr_payment_codes(id) ON DELETE CASCADE,
    scan_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    scanner_ip INET,
    user_agent TEXT,
    location_data JSONB,
    device_type TEXT CHECK (device_type IN ('mobile', 'desktop', 'tablet', 'unknown')),
    action_taken TEXT CHECK (action_taken IN ('viewed', 'shared', 'paid', 'copied'))
);

CREATE INDEX IF NOT EXISTS idx_qr_payment_code_scans_qr_code_id ON qr_payment_code_scans(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_payment_code_scans_scan_time ON qr_payment_code_scans(scan_time DESC);
CREATE INDEX IF NOT EXISTS idx_qr_payment_code_scans_action ON qr_payment_code_scans(action_taken) WHERE action_taken IS NOT NULL;

COMMENT ON TABLE qr_payment_code_scans IS 'Audit trail for QR code scans and interactions';
COMMENT ON COLUMN qr_payment_code_scans.action_taken IS 'Type of action performed after scanning the QR code';

-- ============================================================================
-- 3. QR PAYMENT REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS qr_payment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_code_id UUID NOT NULL REFERENCES qr_payment_codes(id) ON DELETE CASCADE,
    requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(18, 8) NOT NULL,
    currency TEXT NOT NULL,
    blockchain_chain TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
    related_transaction_id UUID REFERENCES fiat_transactions(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_qr_payment_requests_qr_code_id ON qr_payment_requests(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_payment_requests_requester ON qr_payment_requests(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_qr_payment_requests_receiver ON qr_payment_requests(receiver_user_id);
CREATE INDEX IF NOT EXISTS idx_qr_payment_requests_status ON qr_payment_requests(status) WHERE status IN ('pending', 'paid');
CREATE INDEX IF NOT EXISTS idx_qr_payment_requests_created_at ON qr_payment_requests(created_at DESC);

ALTER TABLE qr_payment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY qr_payment_requests_rls_policy ON qr_payment_requests
    USING (
        requester_user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true))
        OR receiver_user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true))
    );

COMMENT ON TABLE qr_payment_requests IS 'Tracks QR code payment requests and their fulfillment';

-- ============================================================================
-- 4. TRIGGERS AND FUNCTIONS
-- ============================================================================

CREATE TRIGGER update_qr_payment_codes_updated_at BEFORE UPDATE ON qr_payment_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_payment_requests_updated_at BEFORE UPDATE ON qr_payment_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION increment_qr_code_scans()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE qr_payment_codes 
    SET scans_count = scans_count + 1, 
        last_scanned_at = CURRENT_TIMESTAMP
    WHERE id = NEW.qr_code_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER qr_code_scan_counter AFTER INSERT ON qr_payment_code_scans
    FOR EACH ROW EXECUTE FUNCTION increment_qr_code_scans();

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW qr_payment_stats AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT q.id) as total_qr_codes,
    COUNT(DISTINCT CASE WHEN q.code_type = 'static' THEN q.id END) as static_qr_count,
    COUNT(DISTINCT CASE WHEN q.code_type = 'dynamic' THEN q.id END) as dynamic_qr_count,
    SUM(CASE WHEN q.is_expired = FALSE THEN 1 ELSE 0 END) as active_qr_count,
    SUM(q.scans_count) as total_scans,
    MAX(q.last_scanned_at) as last_scan_time,
    COUNT(DISTINCT p.id) as total_payment_requests,
    COUNT(DISTINCT CASE WHEN p.status = 'paid' THEN p.id END) as paid_requests,
    SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END) as total_paid_amount
FROM users u
LEFT JOIN qr_payment_codes q ON u.id = q.user_id AND q.deleted_at IS NULL
LEFT JOIN qr_payment_requests p ON q.id = p.qr_code_id
GROUP BY u.id;

COMMENT ON VIEW qr_payment_stats IS 'Summary statistics for QR code payments per user';

-- ============================================================================
-- Migration complete
-- ============================================================================
