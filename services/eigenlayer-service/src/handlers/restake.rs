use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use crate::models::{CreateRestakingRequest, WithdrawalRequest, RestakingResponse};
use crate::services::RestakingService;
use chrono::Utc;

pub async fn create_restaking(
    State(service): State<RestakingService>,
    Json(req): Json<CreateRestakingRequest>,
) -> impl IntoResponse {
    match service.create_restaking_position(req).await {
        Ok(position) => {
            let response = RestakingResponse {
                position_id: position.id,
                status: "active".to_string(),
                amount: position.amount.to_string(),
                shares: position.shares.to_string(),
                created_at: position.staked_at,
            };
            (StatusCode::CREATED, Json(response))
        }
        Err(err) => {
            let error_response = json!({
                "error": err.to_string(),
            });
            (StatusCode::BAD_REQUEST, Json(error_response))
        }
    }
}

pub async fn queue_withdrawal(
    State(service): State<RestakingService>,
    Json(req): Json<WithdrawalRequest>,
) -> impl IntoResponse {
    match service.queue_withdrawal(req).await {
        Ok(position) => {
            let response = RestakingResponse {
                position_id: position.id,
                status: "queued_withdrawal".to_string(),
                amount: position.amount.to_string(),
                shares: position.shares.to_string(),
                created_at: Utc::now(),
            };
            (StatusCode::OK, Json(response))
        }
        Err(err) => {
            let error_response = json!({
                "error": err.to_string(),
            });
            (StatusCode::BAD_REQUEST, Json(error_response))
        }
    }
}

pub async fn get_positions(
    State(service): State<RestakingService>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    let user_id = match params.get("user_id").and_then(|id| id.parse::<i32>().ok()) {
        Some(id) => id,
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "user_id query parameter is required"})),
            )
                .into_response()
        }
    };

    match service.get_user_positions(user_id).await {
        Ok(positions) => {
            let response = positions
                .into_iter()
                .map(|pos| json!({
                    "id": pos.id,
                    "strategy": pos.strategy_address,
                    "amount": pos.amount.to_string(),
                    "shares": pos.shares.to_string(),
                    "status": pos.status.to_string(),
                    "createdAt": pos.staked_at
                }))
                .collect::<Vec<_>>();

            (StatusCode::OK, Json(response)).into_response()
        }
        Err(err) => {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": err.to_string()})),
            )
                .into_response()
        }
    }
}
