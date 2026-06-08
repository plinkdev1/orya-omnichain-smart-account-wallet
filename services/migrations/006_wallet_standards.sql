-- MIGRATION: Wallet Standards Support
-- Adds tables for tracking wallet standard implementations across multiple blockchains
-- Supports EIP-6963, SUI Standard, Solana Standard, Aptos Standard, Cosmos Standard

-- ============================================================================
-- 1. WALLET STANDARDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS wallet_standards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    standard_name TEXT NOT NULL UNIQUE,
    standard_version TEXT NOT NULL,
    blockchain_network TEXT NOT NULL,
    spec_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_standards_name ON wallet_standards(standard_name);
CREATE INDEX IF NOT EXISTS idx_wallet_standards_blockchain ON wallet_standards(blockchain_network);
CREATE INDEX IF NOT EXISTS idx_wallet_standards_active ON wallet_standards(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE wallet_standards IS 'Registry of wallet standards (EIP-6963, SUI, Solana, Aptos, Cosmos)';
COMMENT ON COLUMN wallet_standards.spec_url IS 'URL to standard specification document';

-- ============================================================================
-- 2. WALLET STANDARD IMPLEMENTATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS wallet_standard_implementations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    standard_id UUID NOT NULL REFERENCES wallet_standards(id) ON DELETE CASCADE,
    implementation_status TEXT NOT NULL DEFAULT 'pending' CHECK (implementation_status IN ('pending', 'supported', 'partially_supported', 'not_supported', 'deprecated')),
    supported_methods TEXT[] DEFAULT ARRAY[]::TEXT[],
    unsupported_methods TEXT[] DEFAULT ARRAY[]::TEXT[],
    compatibility_notes TEXT,
    last_tested_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wallet_id, standard_id)
);

CREATE INDEX IF NOT EXISTS idx_wallet_standard_impls_wallet_id ON wallet_standard_implementations(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_standard_impls_standard_id ON wallet_standard_implementations(standard_id);
CREATE INDEX IF NOT EXISTS idx_wallet_standard_impls_status ON wallet_standard_implementations(implementation_status);

ALTER TABLE wallet_standard_implementations ENABLE ROW LEVEL SECURITY;
CREATE POLICY wallet_standard_impls_rls_policy ON wallet_standard_implementations
    USING (wallet_id IN (SELECT id FROM wallets WHERE user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true))));

COMMENT ON TABLE wallet_standard_implementations IS 'Tracks which wallet standards are supported by each wallet';
COMMENT ON COLUMN wallet_standard_implementations.supported_methods IS 'Array of RPC/JSON-RPC methods implemented by this wallet for the standard';
COMMENT ON COLUMN wallet_standard_implementations.last_tested_at IS 'Timestamp of last compatibility verification';

-- ============================================================================
-- 3. STANDARD RPC METHODS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS standard_rpc_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    standard_id UUID NOT NULL REFERENCES wallet_standards(id) ON DELETE CASCADE,
    method_name TEXT NOT NULL,
    method_type TEXT NOT NULL CHECK (method_type IN ('read', 'write', 'sign', 'utility')),
    description TEXT,
    parameters JSONB,
    return_type TEXT,
    is_required BOOLEAN DEFAULT FALSE,
    is_deprecated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(standard_id, method_name)
);

CREATE INDEX IF NOT EXISTS idx_standard_methods_standard_id ON standard_rpc_methods(standard_id);
CREATE INDEX IF NOT EXISTS idx_standard_methods_method_name ON standard_rpc_methods(method_name);

COMMENT ON TABLE standard_rpc_methods IS 'Registry of RPC methods defined by each wallet standard';
COMMENT ON COLUMN standard_rpc_methods.parameters IS 'JSON schema of method parameters';

-- ============================================================================
-- 4. PROVIDER CAPABILITY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS provider_capabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    capability_name TEXT NOT NULL,
    capability_type TEXT NOT NULL CHECK (capability_type IN ('chain_support', 'transaction_type', 'signing_method', 'feature', 'permission')),
    is_enabled BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wallet_id, capability_name)
);

CREATE INDEX IF NOT EXISTS idx_provider_capabilities_wallet_id ON provider_capabilities(wallet_id);
CREATE INDEX IF NOT EXISTS idx_provider_capabilities_type ON provider_capabilities(capability_type);

ALTER TABLE provider_capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY provider_capabilities_rls_policy ON provider_capabilities
    USING (wallet_id IN (SELECT id FROM wallets WHERE user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true))));

COMMENT ON TABLE provider_capabilities IS 'Tracks wallet capabilities beyond standard support (chain support, transaction types, etc.)';
COMMENT ON COLUMN provider_capabilities.metadata IS 'Additional capability configuration data';

-- ============================================================================
-- 5. CHAIN COMPATIBILITY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS chain_compatibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    chain_name TEXT NOT NULL,
    chain_id TEXT,
    is_compatible BOOLEAN DEFAULT TRUE,
    rpc_provider_url TEXT,
    rpc_provider_backup_urls TEXT[],
    native_currency_symbol TEXT,
    native_currency_decimals INT,
    block_explorer_url TEXT,
    supported_transaction_types TEXT[] DEFAULT ARRAY[]::TEXT[],
    features_supported JSONB DEFAULT '{}',
    known_issues TEXT,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wallet_id, chain_name)
);

CREATE INDEX IF NOT EXISTS idx_chain_compat_wallet_id ON chain_compatibility(wallet_id);
CREATE INDEX IF NOT EXISTS idx_chain_compat_chain_name ON chain_compatibility(chain_name);
CREATE INDEX IF NOT EXISTS idx_chain_compat_compatible ON chain_compatibility(is_compatible) WHERE is_compatible = TRUE;

ALTER TABLE chain_compatibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY chain_compat_rls_policy ON chain_compatibility
    USING (wallet_id IN (SELECT id FROM wallets WHERE user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true))));

COMMENT ON TABLE chain_compatibility IS 'Tracks blockchain compatibility for each wallet';
COMMENT ON COLUMN chain_compatibility.rpc_provider_backup_urls IS 'Array of backup RPC provider URLs for failover';

-- ============================================================================
-- 6. STANDARD COMPLIANCE AUDIT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS standard_compliance_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    standard_id UUID NOT NULL REFERENCES wallet_standards(id) ON DELETE CASCADE,
    audit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    compliance_score DECIMAL(5, 2),
    total_methods INT,
    implemented_methods INT,
    failing_methods INT,
    skipped_methods INT,
    audit_result JSONB,
    audit_notes TEXT,
    auditor_notes TEXT,
    next_audit_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wallet_id, standard_id, audit_date)
);

CREATE INDEX IF NOT EXISTS idx_compliance_audits_wallet_id ON standard_compliance_audits(wallet_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audits_standard_id ON standard_compliance_audits(standard_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audits_audit_date ON standard_compliance_audits(audit_date DESC);

ALTER TABLE standard_compliance_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY compliance_audits_rls_policy ON standard_compliance_audits
    USING (wallet_id IN (SELECT id FROM wallets WHERE user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true))));

COMMENT ON TABLE standard_compliance_audits IS 'Audit trail of standard compliance testing and verification';
COMMENT ON COLUMN standard_compliance_audits.compliance_score IS 'Percentage score (0-100) of standard compliance';

-- ============================================================================
-- 7. TRANSACTION METHOD REGISTRY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS transaction_method_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    method_category TEXT NOT NULL CHECK (method_category IN ('send', 'swap', 'stake', 'bridge', 'approve', 'delegate', 'claim', 'custom')),
    method_name TEXT NOT NULL,
    blockchain_network TEXT,
    contract_method TEXT,
    gas_estimate INT,
    is_custom BOOLEAN DEFAULT FALSE,
    implementation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wallet_id, method_name, blockchain_network)
);

CREATE INDEX IF NOT EXISTS idx_txn_method_wallet_id ON transaction_method_registry(wallet_id);
CREATE INDEX IF NOT EXISTS idx_txn_method_category ON transaction_method_registry(method_category);
CREATE INDEX IF NOT EXISTS idx_txn_method_blockchain ON transaction_method_registry(blockchain_network);

ALTER TABLE transaction_method_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY transaction_method_rls_policy ON transaction_method_registry
    USING (wallet_id IN (SELECT id FROM wallets WHERE user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true))));

COMMENT ON TABLE transaction_method_registry IS 'Registry of transaction methods available per wallet and blockchain';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_wallet_standards_updated_at BEFORE UPDATE ON wallet_standards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_standard_impls_updated_at BEFORE UPDATE ON wallet_standard_implementations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_capabilities_updated_at BEFORE UPDATE ON provider_capabilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chain_compatibility_updated_at BEFORE UPDATE ON chain_compatibility
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_method_registry_updated_at BEFORE UPDATE ON transaction_method_registry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: Standard Definitions
-- ============================================================================

INSERT INTO wallet_standards (standard_name, standard_version, blockchain_network, spec_url, is_active, is_required)
VALUES
    ('EIP-6963', 'v1.0', 'ethereum', 'https://eips.ethereum.org/EIPS/eip-6963', TRUE, TRUE),
    ('SUI Wallet Standard', 'v0.2.0', 'sui', 'https://docs.sui.io/guides/developer/app-examples/connect-to-a-wallet', TRUE, TRUE),
    ('Solana Wallet Standard', 'v1.0', 'solana', 'https://github.com/wallet-standard/wallet-standard', TRUE, TRUE),
    ('Aptos Wallet Standard', 'v0.1', 'aptos', 'https://aptos.dev/guides/wallet-standard', TRUE, FALSE),
    ('Cosmos Standard', 'v1.0', 'cosmos', 'https://docs.cosmos.network/main/architecture/standard', TRUE, FALSE),
    ('EIP-1193', 'v1.0', 'ethereum', 'https://eips.ethereum.org/EIPS/eip-1193', TRUE, TRUE),
    ('EIP-712', 'v1.0', 'ethereum', 'https://eips.ethereum.org/EIPS/eip-712', TRUE, FALSE)
ON CONFLICT (standard_name) DO NOTHING;

-- ============================================================================
-- SEED DATA: Common RPC Methods for EIP-6963
-- ============================================================================

INSERT INTO standard_rpc_methods (standard_id, method_name, method_type, is_required, description)
SELECT id, 'eth_chainId', 'read', TRUE, 'Returns the current chain ID'
FROM wallet_standards WHERE standard_name = 'EIP-6963'
ON CONFLICT DO NOTHING;

INSERT INTO standard_rpc_methods (standard_id, method_name, method_type, is_required, description)
SELECT id, 'eth_accounts', 'read', TRUE, 'Returns array of user accounts'
FROM wallet_standards WHERE standard_name = 'EIP-6963'
ON CONFLICT DO NOTHING;

INSERT INTO standard_rpc_methods (standard_id, method_name, method_type, is_required, description)
SELECT id, 'eth_sendTransaction', 'write', TRUE, 'Submits a transaction to the blockchain'
FROM wallet_standards WHERE standard_name = 'EIP-6963'
ON CONFLICT DO NOTHING;

INSERT INTO standard_rpc_methods (standard_id, method_name, method_type, is_required, description)
SELECT id, 'personal_sign', 'sign', TRUE, 'Signs a message with user account'
FROM wallet_standards WHERE standard_name = 'EIP-6963'
ON CONFLICT DO NOTHING;

INSERT INTO standard_rpc_methods (standard_id, method_name, method_type, is_required, description)
SELECT id, 'eth_signTypedData_v4', 'sign', FALSE, 'Signs EIP-712 typed structured data'
FROM wallet_standards WHERE standard_name = 'EIP-6963'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Migration complete
-- ============================================================================
