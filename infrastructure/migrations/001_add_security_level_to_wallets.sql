-- Migration: Add security_level column to wallets table
-- Description: Adds support for wallet security levels (human-network, orya-standard, orya-enhanced)
-- Date: 2025-11-07

-- Add security_level column to wallets table if it doesn't exist
ALTER TABLE wallets
ADD COLUMN IF NOT EXISTS security_level VARCHAR(50) DEFAULT 'orya-standard';

-- Create index on security_level for better query performance
CREATE INDEX IF NOT EXISTS idx_wallets_security_level ON wallets(security_level);

-- Create a composite index for user_id and security_level for common queries
CREATE INDEX IF NOT EXISTS idx_wallets_user_security ON wallets(user_id, security_level);

-- Verify the column was added
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name='wallets' AND column_name='security_level';
