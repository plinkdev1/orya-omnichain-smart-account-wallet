use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum WalletType {
    #[serde(rename = "custodial")]
    Custodial,
    #[serde(rename = "mpc")]
    Mpc,
    #[serde(rename = "multisig")]
    Multisig,
}

impl WalletType {
    pub fn as_str(&self) -> &str {
        match self {
            WalletType::Custodial => "custodial",
            WalletType::Mpc => "mpc",
            WalletType::Multisig => "multisig",
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum PaymentType {
    #[serde(rename = "crypto")]
    Crypto,
    #[serde(rename = "fiat")]
    Fiat,
    #[serde(rename = "hybrid")]
    Hybrid,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum PaymentStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "confirmed")]
    Confirmed,
    #[serde(rename = "settled")]
    Settled,
    #[serde(rename = "failed")]
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentRequest {
    pub request_id: String,
    pub user_id: String,
    pub wallet_id: String,
    pub wallet_type: WalletType,
    pub payment_type: PaymentType,
    pub source_amount: f64,
    pub source_currency: String,
    pub destination_address: String,
    pub destination_chain: String,
    pub destination_asset: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentRouteResult {
    pub route_id: String,
    pub request_id: String,
    pub user_id: String,
    pub wallet_type: WalletType,
    pub status: PaymentStatus,
    pub transaction_hash: Option<String>,
    pub source_amount: f64,
    pub source_currency: String,
    pub exchange_rate: f64,
    pub destination_amount: f64,
    pub fee: f64,
    pub settlement_status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FxConversionRate {
    pub from_currency: String,
    pub to_currency: String,
    pub rate: f64,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettlementRecord {
    pub settlement_id: String,
    pub route_id: String,
    pub transaction_id: String,
    pub user_id: String,
    pub source_amount: f64,
    pub source_currency: String,
    pub destination_amount: f64,
    pub destination_currency: String,
    pub status: String,
    pub settled_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentRoute {
    pub source_chain: String,
    pub destination_chain: String,
    pub asset: String,
    pub provider: String,
    pub fee_percentage: f64,
    pub estimated_time_minutes: u32,
    pub is_available: bool,
}
