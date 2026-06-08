use async_graphql::{Result, SimpleObject};
use reqwest;
use serde::{Deserialize, Serialize};

#[derive(SimpleObject, Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioTotal {
    pub total_value_usd: String,
    pub wallet_count: i32,
    pub chain_count: i32,
    pub timestamp: String,
}

#[derive(SimpleObject, Debug, Clone, Serialize, Deserialize)]
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

#[derive(SimpleObject, Debug, Clone, Serialize, Deserialize)]
pub struct AssetListResponse {
    pub assets: Vec<Asset>,
    pub total_value_usd: String,
    pub timestamp: String,
}

#[derive(SimpleObject, Debug, Clone, Serialize, Deserialize)]
pub struct Performance {
    pub period: String,
    pub gain_loss_usd: String,
    pub gain_loss_percentage: String,
    pub roi: String,
    pub start_value: String,
    pub end_value: String,
    pub timestamp: String,
}

#[derive(SimpleObject, Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceListResponse {
    pub performances: Vec<Performance>,
    pub timestamp: String,
}

pub async fn get_portfolio(user_id: &str) -> Result<PortfolioTotal> {
    let client = reqwest::Client::new();
    let response = client
        .get(format!("http://localhost:3003/total/{}", user_id))
        .send()
        .await
        .map_err(|e| async_graphql::Error::new(format!("Failed to fetch portfolio: {}", e)))?
        .json::<PortfolioTotal>()
        .await
        .map_err(|e| async_graphql::Error::new(format!("Failed to parse portfolio: {}", e)))?;

    Ok(response)
}

pub async fn get_assets(user_id: &str) -> Result<AssetListResponse> {
    let client = reqwest::Client::new();
    let response = client
        .get(format!("http://localhost:3003/assets/{}", user_id))
        .send()
        .await
        .map_err(|e| async_graphql::Error::new(format!("Failed to fetch assets: {}", e)))?
        .json::<AssetListResponse>()
        .await
        .map_err(|e| async_graphql::Error::new(format!("Failed to parse assets: {}", e)))?;

    Ok(response)
}

pub async fn get_performance(user_id: &str) -> Result<PerformanceListResponse> {
    let client = reqwest::Client::new();
    let response = client
        .get(format!("http://localhost:3003/performance/{}", user_id))
        .send()
        .await
        .map_err(|e| async_graphql::Error::new(format!("Failed to fetch performance: {}", e)))?
        .json::<PerformanceListResponse>()
        .await
        .map_err(|e| async_graphql::Error::new(format!("Failed to parse performance: {}", e)))?;

    Ok(response)
}
