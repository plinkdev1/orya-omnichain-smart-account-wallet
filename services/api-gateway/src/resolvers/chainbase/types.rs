use async_graphql::{SimpleObject, Enum};
use serde::{Deserialize, Serialize};

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct ChainbaseBalance {
    pub chain_id: String,
    pub address: String,
    pub balance: String,
    pub decimals: i32,
    pub symbol: String,
    pub last_updated: String,
}

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct ChainbaseToken {
    pub address: String,
    pub chain_id: String,
    pub symbol: String,
    pub name: String,
    pub decimals: i32,
    pub balance: String,
    pub price_usd: Option<f64>,
    pub logo: Option<String>,
}

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct ChainbaseTransaction {
    pub hash: String,
    pub chain_id: String,
    pub from: String,
    pub to: String,
    pub value: String,
    pub timestamp: String,
    pub status: TransactionStatus,
    pub block_number: i64,
    pub gas_used: Option<String>,
    pub gas_price: Option<String>,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq, Debug, Serialize, Deserialize)]
pub enum TransactionStatus {
    Pending,
    Confirmed,
    Failed,
}

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct ChainbaseTVL {
    pub protocol: String,
    pub chain_id: String,
    pub tvl: String,
    pub tvl_usd: f64,
    pub timestamp: String,
}

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct ChainbaseAnalytics {
    pub chain_id: String,
    pub address: String,
    pub total_transactions: i32,
    pub total_value: String,
    pub first_transaction: String,
    pub last_transaction: String,
    pub unique_contracts: i32,
}

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct ChainInfo {
    pub chain_id: String,
    pub name: String,
    pub is_testnet: bool,
    pub is_supported: bool,
}

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct ChainbaseBalanceResponse {
    pub balance: ChainbaseBalance,
    pub tokens: Vec<ChainbaseToken>,
}

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct ChainbaseTransactionsResponse {
    pub transactions: Vec<ChainbaseTransaction>,
    pub total: i32,
    pub has_more: bool,
}
