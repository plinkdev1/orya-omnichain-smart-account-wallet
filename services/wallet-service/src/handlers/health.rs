use axum::{http::StatusCode, Json};
use serde_json::json;

/// Health check endpoint
pub async fn health_check() -> (StatusCode, Json<serde_json::Value>) {
    let response = json!({
        "status": "healthy",
        "service": "wallet-service",
        "version": "0.1.0"
    });

    (StatusCode::OK, Json(response))
}