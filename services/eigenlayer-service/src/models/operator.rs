use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use rust_decimal::Decimal;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Operator {
    pub operator_address: String,
    pub metadata_uri: Option<String>,
    pub delegation_approver: Option<String>,
    pub staker_opt_out_window_blocks: Option<i32>,
    pub is_active: bool,
    pub total_delegated: Decimal,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OperatorRegistrationRequest {
    pub operator_address: String,
    pub metadata_uri: Option<String>,
    pub delegation_approver: Option<String>,
    pub staker_opt_out_window_blocks: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OperatorResponse {
    pub operator_address: String,
    pub is_active: bool,
    pub total_delegated: String,
    pub created_at: DateTime<Utc>,
}
