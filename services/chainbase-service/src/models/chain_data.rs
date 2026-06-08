use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ChainIndexedData {
    pub id: i32,
    pub chain_id: String,
    pub data_type: String,
    pub address: String,
    pub data: serde_json::Value,
    pub indexed_at: DateTime<Utc>,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ChainSyncStatus {
    pub chain_id: String,
    pub last_block_synced: i64,
    pub last_sync_time: DateTime<Utc>,
    pub sync_status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BalanceData {
    pub address: String,
    pub chain_id: String,
    pub token_address: String,
    pub balance: String,
    pub decimals: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionData {
    pub hash: String,
    pub chain_id: String,
    pub from_address: String,
    pub to_address: String,
    pub value: String,
    pub block_number: i64,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenData {
    pub contract_address: String,
    pub chain_id: String,
    pub symbol: String,
    pub name: String,
    pub decimals: i32,
    pub total_supply: String,
}
