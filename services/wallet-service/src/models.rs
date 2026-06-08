use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Wallet type enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, sqlx::Type)]
#[sqlx(rename_all = "UPPERCASE")]
#[sqlx(type_name = "VARCHAR")]
pub enum WalletType {
    #[serde(rename = "OWNED")]
    Owned,
    #[serde(rename = "CONNECTED")]
    Connected,
    #[serde(rename = "HUMAN_NETWORK")]
    HumanNetwork,
}

impl std::fmt::Display for WalletType {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            WalletType::Owned => write!(f, "OWNED"),
            WalletType::Connected => write!(f, "CONNECTED"),
            WalletType::HumanNetwork => write!(f, "HUMAN_NETWORK"),
        }
    }
}

impl std::str::FromStr for WalletType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "OWNED" => Ok(WalletType::Owned),
            "CONNECTED" => Ok(WalletType::Connected),
            "HUMAN_NETWORK" => Ok(WalletType::HumanNetwork),
            _ => Err(format!("Invalid wallet type: {}", s)),
        }
    }
}

/// Wallet data model
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Wallet {
    pub id: String,
    pub user_id: String,
    pub wallet_name: String,
    pub chain: String,
    pub address: String,
    pub public_key: Option<String>,
    pub privy_wallet_id: Option<String>,
    pub wallet_type: String, // OWNED, CONNECTED, HUMAN_NETWORK
    pub security_level: Option<String>, // human-network, orya-standard, orya-enhanced
    pub encrypted_key_data: Option<String>,
    pub balance: Option<String>,
    pub balance_usd: Option<String>,
    pub is_primary: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Wallet balance information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletBalance {
    pub wallet_id: String,
    pub address: String,
    pub chain: String,
    pub balance: String,
    pub balance_usd: String,
    pub last_updated: DateTime<Utc>,
}

/// Request to create a new wallet
#[derive(Debug, Deserialize)]
pub struct CreateWalletRequest {
    pub user_id: String,
    pub wallet_name: String,
    pub chain: String,
    pub wallet_type: Option<String>, // "OWNED", "CONNECTED", "HUMAN_NETWORK"
    pub security_level: Option<String>, // "human-network", "orya-standard", "orya-enhanced"
    pub is_primary: Option<bool>,
}

/// Response from wallet creation
#[derive(Debug, Serialize)]
pub struct CreateWalletResponse {
    pub wallet_id: String,
    pub user_id: String,
    pub wallet_name: String,
    pub chain: String,
    pub address: String,
    pub wallet_type: String,
    pub security_level: Option<String>,
    pub privy_wallet_id: Option<String>,
    pub recovery_phrase: Option<Vec<String>>, // Only for OWNED type on creation
    pub created_at: DateTime<Utc>,
}

/// List wallets query parameters
#[derive(Debug, Deserialize)]
pub struct ListWalletsQuery {
    pub user_id: String,
    pub chain: Option<String>,
}

/// Wallet list response
#[derive(Debug, Serialize)]
pub struct WalletListResponse {
    pub wallets: Vec<WalletInfo>,
    pub total_count: i64,
}

/// Simplified wallet info for list response
#[derive(Debug, Serialize, Clone)]
pub struct WalletInfo {
    pub id: String,
    pub user_id: String,
    pub wallet_name: String,
    pub chain: String,
    pub address: String,
    pub security_level: Option<String>,
    pub balance: Option<String>,
    pub balance_usd: Option<String>,
    pub is_primary: bool,
    pub created_at: DateTime<Utc>,
}

impl From<Wallet> for WalletInfo {
    fn from(wallet: Wallet) -> Self {
        WalletInfo {
            id: wallet.id,
            user_id: wallet.user_id,
            wallet_name: wallet.wallet_name,
            chain: wallet.chain,
            address: wallet.address,
            security_level: wallet.security_level,
            balance: wallet.balance,
            balance_usd: wallet.balance_usd,
            is_primary: wallet.is_primary,
            created_at: wallet.created_at,
        }
    }
}

/// Wallet address response
#[derive(Debug, Serialize)]
pub struct WalletAddressResponse {
    pub wallet_id: String,
    pub address: String,
    pub chain: String,
    pub public_key: Option<String>,
}

/// Delete wallet request
#[derive(Debug, Deserialize)]
pub struct DeleteWalletRequest {
    pub confirm: bool,
}

/// Health check response
#[derive(Debug, Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub service: String,
    pub version: String,
}

/// Error response
#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
    pub status: u16,
}