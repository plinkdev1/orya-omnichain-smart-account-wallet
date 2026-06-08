/// ANALYTICS SERVICE
/// Portfolio aggregation, historical data, charts, market insights
/// Port: 3013

use anyhow::Result;
use axum::{extract::State, http::StatusCode, response::IntoResponse, routing::get, Router, Json};
use sqlx::postgres::PgPool;
use std::sync::Arc;
use tracing::info;

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<PgPool>,
}

async fn health_check(State(state): State<AppState>) -> impl IntoResponse {
    let _ = sqlx::query("SELECT 1").fetch_optional(state.db.as_ref()).await;
    (StatusCode::OK, Json(serde_json::json!({"status": "healthy", "service": "analytics-service"})))
}

async fn metrics() -> impl IntoResponse {
    (StatusCode::OK, "# Analytics metrics placeholder\n")
}

async fn get_portfolio_analytics(State(_state): State<AppState>) -> impl IntoResponse {
    (StatusCode::OK, Json(serde_json::json!({
        "portfolio": {
            "total_value": "45230.50",
            "24h_change": "+2.5%",
            "allocation": {
                "SUI": "35%",
                "USDC": "40%",
                "LBTC": "25%"
            }
        }
    })))
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt().json().init();
    info!("Starting Analytics Service...");

    dotenv::dotenv().ok();
    let db = PgPool::connect(&std::env::var("DATABASE_URL")?).await?;
    let port = std::env::var("ANALYTICS_SERVICE_PORT").unwrap_or_else(|_| "3013".to_string());

    let state = AppState { db: Arc::new(db) };
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/metrics", get(metrics))
        .route("/portfolio/analytics", get(get_portfolio_analytics))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    info!("🚀 Analytics Service listening on {}", listener.local_addr()?);
    axum::serve(listener, app).await?;

    Ok(())
}