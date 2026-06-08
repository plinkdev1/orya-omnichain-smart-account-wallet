use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};
use std::collections::HashMap;
use crate::clients::EigenLayerClient;

pub async fn get_operator_details(
    State(client): State<EigenLayerClient>,
    Query(params): Query<HashMap<String, String>>,
) -> impl IntoResponse {
    let operator_address = match params.get("address") {
        Some(addr) => addr.clone(),
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "address query parameter is required"})),
            )
                .into_response()
        }
    };

    match client.get_node_operator_details(&operator_address).await {
        Ok(details) => (StatusCode::OK, Json(details)).into_response(),
        Err(err) => {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": err.to_string()})),
            )
                .into_response()
        }
    }
}

pub async fn register_operator(
    State(_client): State<EigenLayerClient>,
    Json(payload): Json<Value>,
) -> impl IntoResponse {
    let operator_address = match payload.get("operatorAddress").and_then(|v| v.as_str()) {
        Some(addr) => addr,
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "operatorAddress is required"})),
            )
                .into_response()
        }
    };

    if !is_valid_address(operator_address) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid operator address"})),
        )
            .into_response();
    }

    (
        StatusCode::ACCEPTED,
        Json(json!({
            "message": "Operator registration queued",
            "operatorAddress": operator_address,
            "status": "pending"
        })),
    )
        .into_response()
}

fn is_valid_address(address: &str) -> bool {
    address.starts_with("0x") && address.len() == 42
}
