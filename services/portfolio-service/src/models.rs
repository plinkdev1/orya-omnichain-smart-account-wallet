use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioTotal {
    pub total_value_usd: String,
    pub wallet_count: i32,
    pub chain_count: i32,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Asset {
    pub symbol: String,
    pub name: String,
    pub balance: String,
    pub balance_usd: String,
    pub chain_id: String,
    pub wallet_id: String,
    pub price_usd: String,
    pub percentage_of_portfolio: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetListResponse {
    pub assets: Vec<Asset>,
    pub total_value_usd: String,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Performance {
    pub period: String,
    pub gain_loss_usd: String,
    pub gain_loss_percentage: String,
    pub roi: String,
    pub start_value: String,
    pub end_value: String,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceListResponse {
    pub performances: Vec<Performance>,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthResponse {
    pub status: String,
    pub service: String,
    pub version: String,
}
