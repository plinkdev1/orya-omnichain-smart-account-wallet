use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use serde::{Deserialize, Serialize};

use crate::{aggregator::aggregate_portfolio, AppState};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregatedPortfolioResponse {
    pub user_id: String,
    pub total_value_usd: f64,
    pub chains: Vec<ChainBreakdown>,
    pub assets: Vec<AssetBreakdown>,
    pub allocation: Vec<AllocationItem>,
    pub last_updated: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainBreakdown {
    pub chain: String,
    pub wallet_address: String,
    pub native_balance_usd: f64,
    pub token_count: usize,
    pub total_value_usd: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetBreakdown {
    pub symbol: String,
    pub name: String,
    pub total_balance: f64,
    pub total_value_usd: f64,
    pub percentage_of_portfolio: f64,
    pub chain_distribution: Vec<ChainAssetValue>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainAssetValue {
    pub chain: String,
    pub value_usd: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AllocationItem {
    pub chain: String,
    pub value_usd: f64,
    pub percentage: f64,
}

pub async fn get_aggregated_portfolio(
    State(state): State<AppState>,
    Path(user_id): Path<String>,
) -> Result<Json<AggregatedPortfolioResponse>, StatusCode> {
    let user_uuid = Uuid::parse_str(&user_id)
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    tracing::debug!("Fetching aggregated portfolio for user {}", user_id);

    let aggregated = aggregate_portfolio(user_uuid, state.db.as_ref())
        .await
        .map_err(|e| {
            tracing::error!("Failed to aggregate portfolio: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let chains = aggregated
        .chains
        .iter()
        .map(|(_, portfolio)| ChainBreakdown {
            chain: portfolio.chain.clone(),
            wallet_address: portfolio.wallet_address.clone(),
            native_balance_usd: portfolio.native_balance,
            token_count: portfolio.token_balances.len(),
            total_value_usd: portfolio.total_value_usd,
        })
        .collect();

    let assets = aggregated
        .all_assets
        .iter()
        .map(|asset| {
            let chain_distribution = asset
                .chain_breakdown
                .iter()
                .map(|(chain, value)| ChainAssetValue {
                    chain: chain.clone(),
                    value_usd: *value,
                })
                .collect();

            AssetBreakdown {
                symbol: asset.symbol.clone(),
                name: asset.name.clone(),
                total_balance: asset.total_balance,
                total_value_usd: asset.total_value_usd,
                percentage_of_portfolio: asset.percentage_of_portfolio,
                chain_distribution,
            }
        })
        .collect();

    let allocation = aggregated
        .allocation
        .iter()
        .map(|alloc| AllocationItem {
            chain: alloc.chain.clone(),
            value_usd: alloc.value_usd,
            percentage: alloc.percentage,
        })
        .collect();

    Ok(Json(AggregatedPortfolioResponse {
        user_id,
        total_value_usd: aggregated.total_value_usd,
        chains,
        assets,
        allocation,
        last_updated: aggregated.last_updated,
    }))
}
