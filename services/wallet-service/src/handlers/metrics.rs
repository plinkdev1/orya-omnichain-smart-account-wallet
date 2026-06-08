use axum::{http::StatusCode, Json};
use serde_json::json;

/// Metrics endpoint
pub async fn metrics() -> (StatusCode, Json<serde_json::Value>) {
    let response = json!({
        "metrics": {
            "wallets_created": 0,
            "transactions_processed": 0,
            "api_calls": 0
        }
    });

    (StatusCode::OK, Json(response))
}