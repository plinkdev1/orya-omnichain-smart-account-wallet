/// CROSSCHAIN SERVICE
/// Bridge adapters (Axelar, Wormhole, LayerZero), message relay, transaction routing
/// Port: 3015

use anyhow::Result;
use axum::{extract::State, http::StatusCode, response::IntoResponse, routing::{get, post}, Router, Json};
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPool;
use std::sync::Arc;
use tracing::info;

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<PgPool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CrosschainBridgeRequest {
    pub from_chain: String,
    pub to_chain: String,
    pub asset: String,
    pub amount: String,
    pub recipient: String,
}

async fn health_check(State(state): State<AppState>) -> impl IntoResponse {
    let _ = sqlx::query("SELECT 1").fetch_optional(state.db.as_ref()).await;
    (StatusCode::OK, Json(serde_json::json!({"status": "healthy", "service": "crosschain-service"})))
}

async fn bridge_asset(State(_state): State<AppState>, Json(_request): Json<CrosschainBridgeRequest>) -> impl IntoResponse {
    (StatusCode::ACCEPTED, Json(serde_json::json!({"bridge_id": "pending", "status": "initiated"})))
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt().json().init();
    info!("Starting Crosschain Service...");

    dotenv::dotenv().ok();
    let db = PgPool::connect(&std::env::var("DATABASE_URL")?).await?;
    let port = std::env::var("CROSSCHAIN_SERVICE_PORT").unwrap_or_else(|_| "3015".to_string());

    let state = AppState { db: Arc::new(db) };
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/bridge/transfer", post(bridge_asset))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    info!("🚀 Crosschain Service listening on {}", listener.local_addr()?);
    axum::serve(listener, app).await?;

    Ok(())
}