use axum::{extract::{Path, State}, Json};
use serde::{Deserialize, Serialize};
use crate::{
    error::{ChainbaseError, Result},
    services::aggregation::{AggregationService, PortfolioAnalytics, AddressAnalytics},
};

use super::balance::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct PortfolioRequest {
    pub addresses: Vec<(String, String)>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnalyticsResponse<T: Serialize> {
    pub data: T,
    pub timestamp: i64,
}

pub async fn get_portfolio_analytics(
    State(state): State<AppState>,
    Json(request): Json<PortfolioRequest>,
) -> Result<Json<AnalyticsResponse<PortfolioAnalytics>>> {
    tracing::info!("Portfolio analytics request for {} addresses", request.addresses.len());

    if request.addresses.is_empty() {
        return Err(ChainbaseError::InvalidRequest(
            "addresses cannot be empty".to_string(),
        ));
    }

    if request.addresses.len() > 100 {
        return Err(ChainbaseError::InvalidRequest(
            "maximum 100 addresses allowed".to_string(),
        ));
    }

    let analytics = AggregationService::aggregate_portfolio_analytics(&state.db, request.addresses)
        .await
        .map_err(|e| {
            tracing::error!("Failed to aggregate portfolio analytics: {}", e);
            ChainbaseError::InternalError(format!("Failed to aggregate analytics: {}", e))
        })?;

    Ok(Json(AnalyticsResponse {
        data: analytics,
        timestamp: chrono::Utc::now().timestamp(),
    }))
}

pub async fn get_address_analytics(
    State(state): State<AppState>,
    Path((chain_id, address)): Path<(String, String)>,
) -> Result<Json<AnalyticsResponse<AddressAnalytics>>> {
    tracing::info!("Address analytics request for {} on {}", address, chain_id);

    if address.is_empty() || chain_id.is_empty() {
        return Err(ChainbaseError::InvalidRequest(
            "address and chain_id are required".to_string(),
        ));
    }

    let analytics = AggregationService::get_address_analytics(&state.db, &address, &chain_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get address analytics: {}", e);
            ChainbaseError::InternalError(format!("Failed to get analytics: {}", e))
        })?;

    Ok(Json(AnalyticsResponse {
        data: analytics,
        timestamp: chrono::Utc::now().timestamp(),
    }))
}

#[derive(Debug, Serialize)]
pub struct TVLResponse {
    pub tvl_by_chain: serde_json::Value,
    pub timestamp: i64,
}

pub async fn get_total_tvl(
    State(state): State<AppState>,
) -> Result<Json<TVLResponse>> {
    tracing::info!("Total TVL request");

    let tvl = AggregationService::calculate_total_tvl(&state.db)
        .await
        .map_err(|e| {
            tracing::error!("Failed to calculate TVL: {}", e);
            ChainbaseError::InternalError(format!("Failed to calculate TVL: {}", e))
        })?;

    Ok(Json(TVLResponse {
        tvl_by_chain: tvl,
        timestamp: chrono::Utc::now().timestamp(),
    }))
}
