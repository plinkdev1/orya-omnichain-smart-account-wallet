use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Transaction type enum
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "text")]
pub enum TransactionType {
    #[serde(rename = "send")]
    Send,
    #[serde(rename = "receive")]
    Receive,
    #[serde(rename = "swap")]
    Swap,
    #[serde(rename = "deposit")]
    Deposit,
    #[serde(rename = "withdraw")]
    Withdraw,
    #[serde(rename = "stake")]
    Stake,
    #[serde(rename = "bridge")]
    Bridge,
}

/// Transaction status enum
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "text")]
pub enum TransactionStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "confirmed")]
    Confirmed,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "cancelled")]
    Cancelled,
}

/// Supported blockchain chains
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Chain {
    #[serde(rename = "sui")]
    Sui,
    #[serde(rename = "ethereum")]
    Ethereum,
    #[serde(rename = "solana")]
    Solana,
    #[serde(rename = "btc")]
    Btc,
    #[serde(rename = "arbitrum")]
    Arbitrum,
    #[serde(rename = "polygon")]
    Polygon,
}

impl std::fmt::Display for Chain {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Chain::Sui => write!(f, "sui"),
            Chain::Ethereum => write!(f, "ethereum"),
            Chain::Solana => write!(f, "solana"),
            Chain::Btc => write!(f, "btc"),
            Chain::Arbitrum => write!(f, "arbitrum"),
            Chain::Polygon => write!(f, "polygon"),
        }
    }
}

/// Database transaction row
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Transaction {
    pub id: Uuid,
    pub user_id: Uuid,
    pub wallet_id: Uuid,
    pub tx_hash: Option<String>,
    pub tx_type: String,
    pub status: String,
    pub from_address: Option<String>,
    pub to_address: Option<String>,
    pub amount: String,
    pub amount_in_usd: Option<f64>,
    pub token_symbol: Option<String>,
    pub token_decimal: Option<i32>,
    pub fee_amount: Option<String>,
    pub fee_in_usd: Option<f64>,
    pub chain: String,
    pub gas_used: Option<String>,
    pub nonce: Option<i32>,
    pub block_number: Option<i64>,
    pub confirmations: Option<i32>,
    pub transaction_data: Option<serde_json::Value>,
    pub error_message: Option<String>,
    pub retries: Option<i32>,
    pub idempotency_key: Option<String>,
    pub settlement_status: Option<String>,
    pub settlement_tx_hash: Option<String>,
    pub settlement_source: Option<String>,
    pub settled_at: Option<DateTime<Utc>>,
    pub route_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

/// Create transaction request
#[derive(Debug, Clone, Deserialize)]
pub struct CreateTransactionRequest {
    pub user_id: Uuid,
    pub wallet_id: Uuid,
    pub tx_type: String,
    pub from_address: String,
    pub to_address: String,
    pub amount: String,
    pub amount_in_usd: Option<f64>,
    pub token_symbol: String,
    pub token_decimal: Option<i32>,
    pub fee_amount: Option<String>,
    pub fee_in_usd: Option<f64>,
    pub chain: String,
    pub idempotency_key: Option<String>,
}

/// Create transaction response
#[derive(Debug, Clone, Serialize)]
pub struct CreateTransactionResponse {
    pub id: Uuid,
    pub user_id: Uuid,
    pub wallet_id: Uuid,
    pub tx_type: String,
    pub status: String,
    pub from_address: String,
    pub to_address: String,
    pub amount: String,
    pub chain: String,
    pub created_at: DateTime<Utc>,
}

/// Update transaction request
#[derive(Debug, Clone, Deserialize)]
pub struct UpdateTransactionRequest {
    pub status: Option<String>,
    pub tx_hash: Option<String>,
    pub block_number: Option<i64>,
    pub confirmations: Option<i32>,
    pub error_message: Option<String>,
    pub settlement_status: Option<String>,
    pub settlement_tx_hash: Option<String>,
    pub settlement_source: Option<String>,
    pub route_id: Option<String>,
}

/// Update transaction response
#[derive(Debug, Clone, Serialize)]
pub struct UpdateTransactionResponse {
    pub id: Uuid,
    pub status: String,
    pub tx_hash: Option<String>,
    pub block_number: Option<i64>,
    pub confirmations: Option<i32>,
    pub updated_at: DateTime<Utc>,
}

/// Get transaction response
#[derive(Debug, Clone, Serialize)]
pub struct TransactionResponse {
    pub id: Uuid,
    pub user_id: Uuid,
    pub wallet_id: Uuid,
    pub tx_hash: Option<String>,
    pub tx_type: String,
    pub status: String,
    pub from_address: Option<String>,
    pub to_address: Option<String>,
    pub amount: String,
    pub amount_in_usd: Option<f64>,
    pub token_symbol: Option<String>,
    pub fee_amount: Option<String>,
    pub fee_in_usd: Option<f64>,
    pub chain: String,
    pub confirmations: Option<i32>,
    pub error_message: Option<String>,
    pub settlement_status: Option<String>,
    pub settlement_tx_hash: Option<String>,
    pub settlement_source: Option<String>,
    pub settled_at: Option<DateTime<Utc>>,
    pub route_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

/// List transactions response
#[derive(Debug, Clone, Serialize)]
pub struct ListTransactionsResponse {
    pub transactions: Vec<TransactionResponse>,
    pub total_count: i64,
    pub page: i64,
    pub page_size: i64,
}

/// Transaction statistics
#[derive(Debug, Clone, Serialize)]
pub struct TransactionStats {
    pub user_id: Uuid,
    pub total_transactions: i64,
    pub total_sent: String,
    pub total_received: String,
    pub total_fees_paid: String,
    pub pending_count: i64,
    pub failed_count: i64,
}

/// Broadcast transaction response
#[derive(Debug, Clone, Serialize)]
pub struct BroadcastTransactionResponse {
    pub id: Uuid,
    pub tx_hash: String,
    pub status: String,
    pub broadcast_at: DateTime<Utc>,
}

/// Health check response
#[derive(Debug, Clone, Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub service: String,
    pub version: String,
}

/// Metrics response
#[derive(Debug, Clone, Serialize)]
pub struct MetricsResponse {
    pub total_transactions_processed: i64,
    pub transactions_pending: i64,
    pub transactions_failed: i64,
    pub avg_confirmation_time_seconds: i64,
}

/// Settlement event for payment routing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettlementEvent {
    pub transaction_id: Uuid,
    pub settlement_status: String,
    pub settlement_tx_hash: Option<String>,
    pub settlement_source: String,
    pub settled_at: Option<DateTime<Utc>>,
    pub route_id: Option<String>,
}

/// Settlement tracking response
#[derive(Debug, Clone, Serialize)]
pub struct SettlementTrackingResponse {
    pub transaction_id: Uuid,
    pub settlement_status: String,
    pub settlement_tx_hash: Option<String>,
    pub settlement_source: Option<String>,
    pub settled_at: Option<DateTime<Utc>>,
    pub route_id: Option<String>,
}