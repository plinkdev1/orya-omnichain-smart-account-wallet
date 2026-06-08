use axum::{extract::State, Json};
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::{
    client::ChainbaseClient,
    error::{ChainbaseError, Result},
};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GetBalanceRequest {
    pub address: String,
    pub chain_id: String,
    pub include_tokens: bool,
}

#[derive(Debug, Serialize, Clone)]
pub struct GetBalanceResponse {
    pub balance: BalanceData,
    pub tokens: Vec<TokenBalance>,
    pub cached: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BalanceData {
    pub chain_id: String,
    pub address: String,
    pub balance: String,
    pub decimals: i32,
    pub symbol: String,
    pub last_updated: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TokenBalance {
    pub address: String,
    pub chain_id: String,
    pub symbol: String,
    pub name: String,
    pub decimals: u8,
    pub balance: String,
    pub price_usd: Option<f64>,
    pub logo: Option<String>,
}

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<PgPool>,
    pub redis: Arc<redis::Client>,
    pub chainbase_client: Arc<ChainbaseClient>,
}

pub async fn get_balance(
    State(state): State<AppState>,
    Json(request): Json<GetBalanceRequest>,
) -> Result<Json<GetBalanceResponse>> {
    tracing::info!("Balance request for address: {}, chain: {}", request.address, request.chain_id);
    
    if request.address.is_empty() || request.chain_id.is_empty() {
        tracing::warn!("Invalid balance request: empty address or chain_id");
        return Err(crate::error::ChainbaseError::InvalidRequest(
            "address and chain_id are required".to_string(),
        ));
    }
    
    let cache_key = format!("balance:{}:{}", request.chain_id, request.address);

    if let Ok(cached) = get_from_cache(&state.redis, &cache_key).await {
        tracing::debug!("Balance cache hit for {}", request.address);
        return Ok(Json(GetBalanceResponse {
            balance: cached.balance,
            tokens: cached.tokens,
            cached: true,
        }));
    }
    
    tracing::debug!("Balance cache miss, fetching from API");

    let client_request = crate::client::datasets::GetBalanceRequest {
        chain_id: request.chain_id.clone(),
        address: request.address.clone(),
        include_tokens: request.include_tokens,
    };

    let response = state
        .chainbase_client
        .get_balance(client_request)
        .await
        .map_err(|e| {
            tracing::error!("API error fetching balance: {}", e);
            ChainbaseError::ApiError(format!("Failed to fetch balance: {}", e))
        })?;

    if let Err(e) = store_balance_data(&state.db, &request.chain_id, &request.address, &response).await {
        tracing::warn!("Failed to store balance data: {}, continuing with response", e);
    }

    if let Err(e) = cache_balance_data(&state.redis, &cache_key, &response, 30).await {
        tracing::warn!("Failed to cache balance data: {}, continuing with response", e);
    }

    let balance_data = BalanceData {
        chain_id: response.chain_id.clone(),
        address: response.address.clone(),
        balance: response.balance.clone(),
        decimals: 18,
        symbol: "ETH".to_string(),
        last_updated: chrono::Utc::now().timestamp(),
    };

    let tokens: Vec<TokenBalance> = response
        .tokens
        .into_iter()
        .map(|t| TokenBalance {
            address: t.token_address,
            chain_id: request.chain_id.clone(),
            symbol: t.symbol,
            name: t.name,
            decimals: t.decimals,
            balance: t.balance,
            price_usd: t.price_usd,
            logo: None,
        })
        .collect();

    Ok(Json(GetBalanceResponse {
        balance: balance_data,
        tokens,
        cached: false,
    }))
}

async fn store_balance_data(
    db: &PgPool,
    chain_id: &str,
    address: &str,
    data: &crate::client::datasets::GetBalanceResponse,
) -> Result<()> {
    let balance_json = serde_json::json!({
        "chain_id": data.chain_id,
        "address": data.address,
        "balance": data.balance,
        "tokens": data.tokens,
        "timestamp": chrono::Utc::now().timestamp()
    });

    sqlx::query!(
        r#"
        INSERT INTO chainbase_indexed_data (chain_id, data_type, address, data, last_updated)
        VALUES ($1, 'balance', $2, $3, NOW())
        ON CONFLICT (chain_id, address, data_type) 
        DO UPDATE SET data = $3, last_updated = NOW()
        "#,
        chain_id,
        address,
        balance_json
    )
    .execute(db)
    .await
    .map_err(|e| ChainbaseError::DatabaseError(e))?;

    Ok(())
}

async fn cache_balance_data(
    redis_client: &redis::Client,
    key: &str,
    data: &crate::client::datasets::GetBalanceResponse,
    ttl_seconds: usize,
) -> Result<()> {
    let json = serde_json::to_string(data)
        .map_err(|e| ChainbaseError::InternalError(format!("Serialization error: {}", e)))?;

    let mut conn = redis_client
        .get_connection()
        .map_err(|e| ChainbaseError::RedisError(e.to_string()))?;

    use redis::Commands;
    let _: () = conn.set_ex(key, json, ttl_seconds)
        .map_err(|e| ChainbaseError::RedisError(e.to_string()))?;

    Ok(())
}

async fn get_from_cache(
    redis_client: &redis::Client,
    key: &str,
) -> Result<GetBalanceResponse> {
    let mut conn = redis_client
        .get_connection()
        .map_err(|e| ChainbaseError::RedisError(e.to_string()))?;

    let json: Option<String> = redis::cmd("GET")
        .arg(key)
        .query(&mut conn)
        .map_err(|e| ChainbaseError::RedisError(e.to_string()))?;

    match json {
        Some(data) => {
            let cached_response: crate::client::datasets::GetBalanceResponse =
                serde_json::from_str(&data).map_err(|e| {
                    ChainbaseError::InternalError(format!("Deserialization error: {}", e))
                })?;

            let balance_data = BalanceData {
                chain_id: cached_response.chain_id.clone(),
                address: cached_response.address.clone(),
                balance: cached_response.balance.clone(),
                decimals: 18,
                symbol: "ETH".to_string(),
                last_updated: chrono::Utc::now().timestamp(),
            };

            let tokens: Vec<TokenBalance> = cached_response
                .tokens
                .into_iter()
                .map(|t| TokenBalance {
                    address: t.token_address,
                    chain_id: cached_response.chain_id.clone(),
                    symbol: t.symbol,
                    name: t.name,
                    decimals: t.decimals,
                    balance: t.balance,
                    price_usd: t.price_usd,
                    logo: None,
                })
                .collect();

            Ok(GetBalanceResponse {
                balance: balance_data,
                tokens,
                cached: true,
            })
        }
        None => Err(ChainbaseError::NotFound("Balance data not found in cache".to_string())),
    }
}
