use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use rust_decimal::Decimal;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reward {
    pub id: i32,
    pub user_id: i32,
    pub strategy_address: String,
    pub reward_amount: Decimal,
    pub reward_token: String,
    pub earned_at: DateTime<Utc>,
    pub claimed: bool,
    pub claimed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RewardResponse {
    pub id: i32,
    pub reward_amount: String,
    pub reward_token: String,
    pub earned_at: DateTime<Utc>,
    pub claimed: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClaimRewardsRequest {
    pub reward_ids: Vec<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RewardsSummary {
    pub total_earned: String,
    pub total_claimed: String,
    pub pending: String,
    pub rewards: Vec<RewardResponse>,
}
