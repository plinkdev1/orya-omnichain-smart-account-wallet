use async_graphql::{SimpleObject, Enum, ID};
use serde::{Deserialize, Serialize};

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct EigenLayerStrategy {
    pub address: String,
    pub token_address: String,
    pub token_symbol: String,
    pub total_shares: String,
    pub underlying_token: String,
}

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct EigenLayerOperator {
    pub address: String,
    pub metadata_uri: String,
    pub delegation_approver: String,
    pub staker_opt_out_window_blocks: i32,
    pub is_active: bool,
    pub total_delegated: String,
}

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct EigenLayerRestakingPosition {
    pub id: ID,
    pub user_id: String,
    pub strategy_address: String,
    pub token_address: String,
    pub amount: String,
    pub shares: String,
    pub operator_address: Option<String>,
    pub staked_at: String,
    pub status: RestakingStatus,
    pub estimated_apy: Option<f64>,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq, Debug, Serialize, Deserialize)]
pub enum RestakingStatus {
    Active,
    QueuedWithdrawal,
    Withdrawn,
}

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct EigenLayerSlashingEvent {
    pub id: ID,
    pub operator_address: String,
    pub strategy_address: String,
    pub slashed_amount: String,
    pub event_block: i32,
    pub event_timestamp: String,
    pub tx_hash: String,
}

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct EigenLayerReward {
    pub id: ID,
    pub user_id: String,
    pub strategy_address: String,
    pub reward_amount: String,
    pub reward_token: String,
    pub earned_at: String,
    pub claimed: bool,
    pub claimed_at: Option<String>,
}

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct RestakeResponse {
    pub position_id: ID,
    pub tx_hash: String,
    pub shares: String,
    pub estimated_apy: f64,
}

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct RestakingPositionsResponse {
    pub positions: Vec<EigenLayerRestakingPosition>,
    pub total_value_staked: String,
    pub total_rewards_earned: String,
}

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct QueueWithdrawalResponse {
    pub withdrawal_root: String,
    pub completion_timestamp: String,
    pub tx_hash: String,
}

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct CompleteWithdrawalResponse {
    pub tx_hash: String,
}

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct RewardsResponse {
    pub rewards: Vec<EigenLayerReward>,
    pub total_unclaimed: String,
}

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct ClaimRewardsResponse {
    pub tx_hash: String,
    pub total_claimed: String,
}

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct StrategyAPYResponse {
    pub apy: f64,
}
