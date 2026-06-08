use axum::Json;
use serde_json::json;

pub mod balance;
pub mod transactions;
pub mod analytics;

pub async fn health_check() -> Json<serde_json::Value> {
    Json(json!({
        "status": "healthy",
        "service": "chainbase-service",
        "version": "1.0.0"
    }))
}
