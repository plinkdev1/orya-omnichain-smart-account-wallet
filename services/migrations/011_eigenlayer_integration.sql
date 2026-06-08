-- EigenLayer Integration Tables

CREATE TABLE IF NOT EXISTS eigenlayer_restaking_positions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    strategy_address VARCHAR(66) NOT NULL,
    token_address VARCHAR(66) NOT NULL,
    amount NUMERIC(78, 0) NOT NULL,
    shares NUMERIC(78, 0) NOT NULL,
    operator_address VARCHAR(66),
    staked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    CONSTRAINT valid_status CHECK (status IN ('active', 'queued_withdrawal', 'withdrawn')),
    CONSTRAINT valid_addresses CHECK (
        strategy_address ~ '^0x[a-fA-F0-9]{40}$' AND 
        token_address ~ '^0x[a-fA-F0-9]{40}$'
    )
);

CREATE TABLE IF NOT EXISTS eigenlayer_operators (
    operator_address VARCHAR(66) PRIMARY KEY,
    metadata_uri TEXT,
    delegation_approver VARCHAR(66),
    staker_opt_out_window_blocks INTEGER,
    is_active BOOLEAN DEFAULT true,
    total_delegated NUMERIC(78, 0) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_operator_address CHECK (operator_address ~ '^0x[a-fA-F0-9]{40}$')
);

CREATE TABLE IF NOT EXISTS eigenlayer_slashing_events (
    id SERIAL PRIMARY KEY,
    operator_address VARCHAR(66) NOT NULL REFERENCES eigenlayer_operators(operator_address),
    strategy_address VARCHAR(66) NOT NULL,
    slashed_amount NUMERIC(78, 0) NOT NULL,
    event_block BIGINT NOT NULL,
    event_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    tx_hash VARCHAR(66) NOT NULL
);

CREATE TABLE IF NOT EXISTS eigenlayer_rewards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    strategy_address VARCHAR(66) NOT NULL,
    reward_amount NUMERIC(78, 0) NOT NULL,
    reward_token VARCHAR(66) NOT NULL,
    earned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    claimed BOOLEAN DEFAULT false,
    claimed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_restaking_user ON eigenlayer_restaking_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_restaking_status ON eigenlayer_restaking_positions(status);
CREATE INDEX IF NOT EXISTS idx_restaking_strategy ON eigenlayer_restaking_positions(strategy_address);
CREATE INDEX IF NOT EXISTS idx_operator_active ON eigenlayer_operators(is_active);
CREATE INDEX IF NOT EXISTS idx_slashing_operator ON eigenlayer_slashing_events(operator_address);
CREATE INDEX IF NOT EXISTS idx_slashing_event_block ON eigenlayer_slashing_events(event_block);
CREATE INDEX IF NOT EXISTS idx_rewards_user ON eigenlayer_rewards(user_id, claimed);
CREATE INDEX IF NOT EXISTS idx_rewards_strategy ON eigenlayer_rewards(strategy_address);
