-- MIGRATION: Passkey (WebAuthn) Support
-- Adds tables for storing WebAuthn credentials as 4th factor authentication
-- Supports platform authenticators (fingerprint, face recognition)

-- ============================================================================
-- 1. PASSKEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS passkeys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(255) NOT NULL,
    credential_id BYTEA NOT NULL,
    public_key BYTEA NOT NULL,
    counter INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, wallet_address)
);

CREATE INDEX idx_passkeys_user_id ON passkeys(user_id);
CREATE INDEX idx_passkeys_wallet_address ON passkeys(wallet_address);
CREATE INDEX idx_passkeys_credential_id ON passkeys(credential_id);
CREATE INDEX idx_passkeys_created_at ON passkeys(created_at DESC);

ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY passkeys_rls_policy ON passkeys
    USING (user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true)));

COMMENT ON TABLE passkeys IS 'Stores WebAuthn credentials for passkey-based transaction approval (4th factor security)';
COMMENT ON COLUMN passkeys.credential_id IS 'WebAuthn credential ID from registration response';
COMMENT ON COLUMN passkeys.public_key IS 'Public key from attestation object used for assertion verification';
COMMENT ON COLUMN passkeys.counter IS 'Signature counter for clone detection';
COMMENT ON COLUMN passkeys.last_used_at IS 'Timestamp of last successful assertion validation';

-- ============================================================================
-- 2. PASSKEY ASSERTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS passkey_assertions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(255) NOT NULL,
    passkey_id UUID NOT NULL REFERENCES passkeys(id) ON DELETE CASCADE,
    assertion_challenge BYTEA NOT NULL,
    authenticator_data BYTEA,
    client_data_json BYTEA,
    signature BYTEA,
    counter INT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed', 'expired')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '5 minutes')
);

CREATE INDEX idx_passkey_assertions_user_id ON passkey_assertions(user_id);
CREATE INDEX idx_passkey_assertions_passkey_id ON passkey_assertions(passkey_id);
CREATE INDEX idx_passkey_assertions_status ON passkey_assertions(status);
CREATE INDEX idx_passkey_assertions_created_at ON passkey_assertions(created_at DESC);

ALTER TABLE passkey_assertions ENABLE ROW LEVEL SECURITY;
CREATE POLICY passkey_assertions_rls_policy ON passkey_assertions
    USING (user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true)));

COMMENT ON TABLE passkey_assertions IS 'Tracks WebAuthn assertion requests and verifications for transaction approval';

-- ============================================================================
-- 3. PASSKEY SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS passkey_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    passkey_enabled BOOLEAN DEFAULT FALSE,
    passkey_required_for_transactions BOOLEAN DEFAULT FALSE,
    passkey_backup_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_passkey_settings_user_id ON passkey_settings(user_id);

ALTER TABLE passkey_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY passkey_settings_rls_policy ON passkey_settings
    USING (user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true)));

COMMENT ON TABLE passkey_settings IS 'User preferences and settings for passkey authentication';

-- ============================================================================
-- Migration complete
-- ============================================================================
