use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainMetrics {
    pub chain_id: String,
    pub total_value_locked: Decimal,
    pub transaction_volume_24h: Decimal,
    pub active_addresses_24h: i64,
    pub average_gas_price: Decimal,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrossChainAssetData {
    pub asset_id: String,
    pub symbol: String,
    pub total_value_locked: Decimal,
    pub chains: Vec<ChainAssetDistribution>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainAssetDistribution {
    pub chain_id: String,
    pub total_balance: Decimal,
    pub percentage: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionAnalytics {
    pub chain_id: String,
    pub transaction_count: i64,
    pub total_volume: Decimal,
    pub average_transaction_size: Decimal,
    pub gas_fees_total: Decimal,
    pub timestamp: DateTime<Utc>,
}
