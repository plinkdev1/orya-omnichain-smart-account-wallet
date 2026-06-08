-- Add settlement tracking columns to transactions table
ALTER TABLE transactions ADD COLUMN settlement_status VARCHAR(50);
ALTER TABLE transactions ADD COLUMN settlement_tx_hash VARCHAR(255);
ALTER TABLE transactions ADD COLUMN settlement_source VARCHAR(50);
ALTER TABLE transactions ADD COLUMN settled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE transactions ADD COLUMN route_id VARCHAR(255);

-- Create indexes for settlement queries
CREATE INDEX idx_transactions_settlement_status ON transactions(settlement_status);
CREATE INDEX idx_transactions_route_id ON transactions(route_id);
CREATE INDEX idx_transactions_settled_at ON transactions(settled_at);

-- Set default settlement_status for existing records
UPDATE transactions SET settlement_status = 'pending' WHERE settlement_status IS NULL;
