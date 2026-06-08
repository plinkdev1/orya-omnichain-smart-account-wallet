-- MIGRATION: Wallet Service Enhancements
-- Adds columns for Privy/Tatum integration and encrypted key storage
-- Aligns wallet_type enum with wallet integration requirements

-- ============================================================================
-- Add new columns to wallets table for Privy/Tatum integration
-- ============================================================================

-- Add address column (if not exists - explicit address field)
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS address TEXT;

-- Add privy_wallet_id for Privy embedded wallets
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS privy_wallet_id TEXT UNIQUE;

-- Add encrypted_key_data for encrypted private key storage (OWNED wallets)
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS encrypted_key_data TEXT;

-- Add public_key field (separate from address)
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS public_key TEXT;

-- Add balance and balance_usd (separate from balance_cache)
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS balance TEXT DEFAULT '0';
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS balance_usd TEXT DEFAULT '0.00';

-- ============================================================================
-- Update wallet_type enum to support new wallet types
-- ============================================================================
-- Note: wallet_type was originally an enum-like constraint with values:
-- 'embedded', 'imported', 'hardware'
-- We extend it to support: 'OWNED', 'CONNECTED', 'HUMAN_NETWORK'

ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_wallet_type_check;
ALTER TABLE wallets ADD CONSTRAINT wallets_wallet_type_check 
    CHECK (wallet_type IN ('embedded', 'imported', 'hardware', 'OWNED', 'CONNECTED', 'HUMAN_NETWORK'));

-- ============================================================================
-- Create indices for performance optimization
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wallets_privy_wallet_id ON wallets(privy_wallet_id) WHERE privy_wallet_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address) WHERE address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallets_wallet_type ON wallets(wallet_type);

-- ============================================================================
-- Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN wallets.address IS 'Wallet address for the blockchain (e.g., 0x... for EVM, bc1... for Bitcoin)';
COMMENT ON COLUMN wallets.privy_wallet_id IS 'Privy embedded wallet ID for HUMAN_NETWORK type wallets';
COMMENT ON COLUMN wallets.encrypted_key_data IS 'AES-256-GCM encrypted private key data (for OWNED wallets only)';
COMMENT ON COLUMN wallets.public_key IS 'Public key derived from the wallet';
COMMENT ON COLUMN wallets.balance IS 'Native token balance in smallest unit (wei, satoshi, etc.)';
COMMENT ON COLUMN wallets.balance_usd IS 'Balance converted to USD value';
COMMENT ON COLUMN wallets.wallet_type IS 'Type: OWNED (self-custodied), CONNECTED (external), HUMAN_NETWORK (Privy MPC)';

-- ============================================================================
-- Migration complete
-- ============================================================================