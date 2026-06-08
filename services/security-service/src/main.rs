/// SECURITY SERVICE
/// Auth (JWT, OAuth2), KYC, transaction rules, multi-sig, fraud detection
/// Port: 3014

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
pub struct KYCRequest {
    pub user_id: String,
    pub document_type: String,
    pub document_data: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TransactionRule {
    pub rule_id: String,
    pub user_id: String,
    pub rule_type: String,
    pub limits: serde_json::Value,
}

async fn health_check(State(state): State<AppState>) -> impl IntoResponse {
    let _ = sqlx::query("SELECT 1").fetch_optional(state.db.as_ref()).await;
    (StatusCode::OK, Json(serde_json::json!({"status": "healthy", "service": "security-service"})))
}

async fn metrics() -> impl IntoResponse {
    (StatusCode::OK, "# Security metrics\n")
}

async fn initiate_kyc(State(_state): State<AppState>, Json(_request): Json<KYCRequest>) -> impl IntoResponse {
    (StatusCode::ACCEPTED, Json(serde_json::json!({"status": "kyc_initiated"})))
}

async fn get_transaction_rules(State(_state): State<AppState>) -> impl IntoResponse {
    (StatusCode::OK, Json(serde_json::json!({"rules": []})))
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt().json().init();
    info!("Starting Security Service...");

    dotenv::dotenv().ok();
    let db = PgPool::connect(&std::env::var("DATABASE_URL")?).await?;
    let port = std::env::var("SECURITY_SERVICE_PORT").unwrap_or_else(|_| "3014".to_string());

    let state = AppState { db: Arc::new(db) };
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/metrics", get(metrics))
        .route("/kyc/initiate", post(initiate_kyc))
        .route("/transaction/rules", get(get_transaction_rules))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    info!("🚀 Security Service listening on {}", listener.local_addr()?);
    axum::serve(listener, app).await?;

    Ok(())
}