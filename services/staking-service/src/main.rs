/// STAKING SERVICE
/// 
/// Handles staking on multiple blockchains:
/// - BTCfi: Babylon, Lombard (LBTC), Bitlayer
/// - SUI: Native staking, LST integration
/// - ETH: Lido, Aave, Compound
///
/// Port: 3012 (HTTP)
/// Topics: staking.deposit, staking.reward.claimed

use anyhow::Result;
use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router, Json,
};
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPool;
use std::sync::Arc;
use tracing::info;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakingRequest {
    pub user_id: String,
    pub chain: String,      // "sui", "eth", "btcfi"
    pub protocol: String,   // "babylon", "lido", "compound"
    pub amount: String,
    pub currency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakingReward {
    pub staking_id: String,
    pub user_id: String,
    pub amount: String,
    pub currency: String,
    pub earned_at: DateTime<Utc>,
}

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<PgPool>,
    pub nats_client: Arc<nats::Connection>,
}

#[derive(Debug, Serialize)]
struct HealthStatus {
    status: String,
    service: String,
}

async fn health_check(State(state): State<AppState>) -> impl IntoResponse {
    let db_status = sqlx::query("SELECT 1")
        .fetch_optional(state.db.as_ref())
        .await
        .map(|_| "connected")
        .unwrap_or("disconnected");

    (
        StatusCode::OK,
        Json(serde_json::json!({
            "status": "healthy",
            "service": "staking-service",
            "database": db_status
        })),
    )
}

async fn metrics() -> impl IntoResponse {
    (
        StatusCode::OK,
        r#"
# HELP staking_deposits_total Total staking deposits
# TYPE staking_deposits_total counter
staking_deposits_total{chain="sui"} 1250.5
staking_deposits_total{chain="eth"} 450.25
staking_deposits_total{chain="btcfi"} 120.0

# HELP staking_rewards_earned_total Total rewards earned
# TYPE staking_rewards_earned_total counter
staking_rewards_earned_total{chain="sui"} 85.3
staking_rewards_earned_total{chain="eth"} 15.2
staking_rewards_earned_total{chain="btcfi"} 8.5
        "#,
    )
}

async fn initiate_staking(
    State(state): State<AppState>,
    Json(request): Json<StakingRequest>,
) -> impl IntoResponse {
    let staking_id = Uuid::new_v4().to_string();

    let event = serde_json::json!({
        "event_type": "staking.deposit",
        "staking_id": &staking_id,
        "user_id": &request.user_id,
        "chain": &request.chain,
        "protocol": &request.protocol,
        "amount": &request.amount,
        "timestamp": Utc::now().to_rfc3339()
    });

    let _ = state.nats_client.publish(
        "staking.deposit",
        event.to_string().as_bytes(),
    );

    info!("Staking initiated: {} on {}", &request.protocol, &request.chain);

    (
        StatusCode::ACCEPTED,
        Json(serde_json::json!({
            "staking_id": staking_id,
            "status": "pending"
        })),
    )
}

async fn get_staking_rewards(
    State(_state): State<AppState>,
) -> impl IntoResponse {
    (
        StatusCode::OK,
        Json(serde_json::json!({
            "rewards": [
                {
                    "chain": "sui",
                    "amount": "45.2",
                    "currency": "SUI"
                },
                {
                    "chain": "eth",
                    "amount": "0.025",
                    "currency": "ETH"
                }
            ]
        })),
    )
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("staking_service=trace".parse()?),
        )
        .json()
        .init();

    info!("Starting Staking Service...");

    dotenv::dotenv().ok();
    let db_url = std::env::var("DATABASE_URL")?;
    let nats_url = std::env::var("NATS_URL").unwrap_or_else(|_| "nats://localhost:4222".to_string());
    let port = std::env::var("STAKING_SERVICE_PORT").unwrap_or_else(|_| "3012".to_string());

    let db = PgPool::connect(&db_url).await?;
    let nats_client = nats::connect(&nats_url)?;

    info!("✓ Database and NATS connected");

    let state = AppState {
        db: Arc::new(db),
        nats_client: Arc::new(nats_client),
    };

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/metrics", get(metrics))
        .route("/staking/initiate", post(initiate_staking))
        .route("/staking/rewards", get(get_staking_rewards))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port))
        .await?;
    let local_addr = listener.local_addr()?;
    info!("🚀 Staking Service listening on {}", local_addr);

    axum::serve(listener, app).await?;

    Ok(())
}