-- MIGRATION: MPC Key Shards Management
-- Adds table for storing MPC key shard references for transaction signing
-- Supports 2-of-3 threshold MPC scheme (Privy + IKA + Device)

-- ============================================================================
-- 1. MPC KEY SHARDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mpc_key_shards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    public_key BYTEA NOT NULL,
    shard_1_id TEXT NOT NULL,
    shard_2_id TEXT NOT NULL,
    shard_3_encrypted BYTEA NOT NULL,
    key_type TEXT NOT NULL DEFAULT 'ed25519' CHECK (key_type IN ('ed25519', 'ecdsa')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, wallet_id)
);

CREATE INDEX idx_mpc_key_shards_user_id ON mpc_key_shards(user_id);
CREATE INDEX idx_mpc_key_shards_wallet_id ON mpc_key_shards(wallet_id);
CREATE INDEX idx_mpc_key_shards_created_at ON mpc_key_shards(created_at DESC);

ALTER TABLE mpc_key_shards ENABLE ROW LEVEL SECURITY;
CREATE POLICY mpc_key_shards_rls_policy ON mpc_key_shards
    USING (user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true)));

COMMENT ON TABLE mpc_key_shards IS 'Stores MPC key shard references for transaction signing using 2-of-3 threshold scheme';
COMMENT ON COLUMN mpc_key_shards.public_key IS 'Ed25519 public key bytes (32 bytes)';
COMMENT ON COLUMN mpc_key_shards.shard_1_id IS 'Privy shard ID for partial signature generation';
COMMENT ON COLUMN mpc_key_shards.shard_2_id IS 'IKA shard ID for partial signature generation';
COMMENT ON COLUMN mpc_key_shards.shard_3_encrypted IS 'Device shard encrypted with AES-256-GCM';

-- ============================================================================
-- 2. TRANSACTION SIGNATURES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS transaction_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    tx_hash BYTEA NOT NULL,
    signature BYTEA NOT NULL,
    signature_algorithm TEXT NOT NULL DEFAULT 'ed25519',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    privy_signature_received_at TIMESTAMP WITH TIME ZONE,
    ika_signature_received_at TIMESTAMP WITH TIME ZONE,
    signature_combined_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transaction_signatures_user_id ON transaction_signatures(user_id);
CREATE INDEX idx_transaction_signatures_wallet_id ON transaction_signatures(wallet_id);
CREATE INDEX idx_transaction_signatures_tx_hash ON transaction_signatures(tx_hash);
CREATE INDEX idx_transaction_signatures_status ON transaction_signatures(status);
CREATE INDEX idx_transaction_signatures_created_at ON transaction_signatures(created_at DESC);

ALTER TABLE transaction_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY transaction_signatures_rls_policy ON transaction_signatures
    USING (user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true)));

COMMENT ON TABLE transaction_signatures IS 'Tracks MPC signatures generated for transactions';
COMMENT ON COLUMN transaction_signatures.tx_hash IS 'Hash of the transaction block data being signed';
COMMENT ON COLUMN transaction_signatures.signature IS 'Final combined Ed25519 signature (64 bytes)';

-- ============================================================================
-- Migration complete
-- ============================================================================
