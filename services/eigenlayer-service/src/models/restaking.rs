use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use rust_decimal::Decimal;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum RestakingPositionStatus {
    Active,
    QueuedWithdrawal,
    Withdrawn,
}

impl ToString for RestakingPositionStatus {
    fn to_string(&self) -> String {
        match self {
            RestakingPositionStatus::Active => "active".to_string(),
            RestakingPositionStatus::QueuedWithdrawal => "queued_withdrawal".to_string(),
            RestakingPositionStatus::Withdrawn => "withdrawn".to_string(),
        }
    }
}

impl From<String> for RestakingPositionStatus {
    fn from(s: String) -> Self {
        match s.as_str() {
            "active" => RestakingPositionStatus::Active,
            "queued_withdrawal" => RestakingPositionStatus::QueuedWithdrawal,
            "withdrawn" => RestakingPositionStatus::Withdrawn,
            _ => RestakingPositionStatus::Active,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RestakingPosition {
    pub id: i32,
    pub user_id: i32,
    pub strategy_address: String,
    pub token_address: String,
    pub amount: Decimal,
    pub shares: Decimal,
    pub operator_address: Option<String>,
    pub staked_at: DateTime<Utc>,
    pub status: RestakingPositionStatus,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateRestakingRequest {
    pub user_id: i32,
    pub strategy_address: String,
    pub token_address: String,
    pub amount: String,
    pub operator_address: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WithdrawalRequest {
    pub position_id: i32,
    pub shares: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RestakingResponse {
    pub position_id: i32,
    pub status: String,
    pub amount: String,
    pub shares: String,
    pub created_at: DateTime<Utc>,
}
