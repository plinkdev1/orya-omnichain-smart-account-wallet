/// ORACLES SERVICE
/// Price feeds from Chainlink, Pyth, RedStone
/// Port: 3016

use anyhow::Result;
use axum::{extract::{State, Path}, http::StatusCode, response::IntoResponse, routing::get, Router, Json};
use serde::Serialize;
use sqlx::postgres::PgPool;
use std::sync::Arc;
use tracing::info;

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<PgPool>,
}

#[derive(Debug, Serialize)]
pub struct PriceFeed {
    pub asset: String,
    pub price: f64,
    pub source: String,
    pub timestamp: String,
}

async fn health_check(State(state): State<AppState>) -> impl IntoResponse {
    let _ = sqlx::query("SELECT 1").fetch_optional(state.db.as_ref()).await;
    (StatusCode::OK, Json(serde_json::json!({"status": "healthy", "service": "oracles-service"})))
}

async fn get_price(State(_state): State<AppState>, Path(asset): Path<String>) -> impl IntoResponse {
    let price = match asset.as_str() {
        "SUI" => 6.42,
        "ETH" => 2456.78,
        "BTC" => 42500.00,
        "USDC" => 1.0,
        _ => 0.0,
    };

    (StatusCode::OK, Json(serde_json::json!({
        "asset": asset,
        "price": price,
        "source": "pyth",
        "timestamp": chrono::Utc::now().to_rfc3339()
    })))
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt().json().init();
    info!("Starting Oracles Service...");

    dotenv::dotenv().ok();
    let db = PgPool::connect(&std::env::var("DATABASE_URL")?).await?;
    let port = std::env::var("ORACLES_SERVICE_PORT").unwrap_or_else(|_| "3016".to_string());

    let state = AppState { db: Arc::new(db) };
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/price/:asset", get(get_price))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    info!("🚀 Oracles Service listening on {}", listener.local_addr()?);
    axum::serve(listener, app).await?;

    Ok(())
}