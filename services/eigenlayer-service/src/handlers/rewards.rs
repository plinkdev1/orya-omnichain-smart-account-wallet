use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};
use std::collections::HashMap;
use crate::services::RewardsCalculator;
use crate::models::ClaimRewardsRequest;

pub async fn get_rewards(
    State(calculator): State<RewardsCalculator>,
    Query(params): Query<HashMap<String, String>>,
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

    match calculator.get_unclaimed_rewards(user_id).await {
        Ok(rewards) => {
            let total_earned = calculator.get_total_earned(user_id).await.unwrap_or_default();
            let total_claimed = calculator.get_total_claimed(user_id).await.unwrap_or_default();
            let pending = total_earned - total_claimed;

            let response = json!({
                "totalEarned": total_earned.to_string(),
                "totalClaimed": total_claimed.to_string(),
                "pending": pending.to_string(),
                "rewards": rewards
                    .into_iter()
                    .map(|r| json!({
                        "id": r.id,
                        "amount": r.reward_amount.to_string(),
                        "token": r.reward_token,
                        "earnedAt": r.earned_at,
                        "claimed": r.claimed
                    }))
                    .collect::<Vec<_>>()
            });

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

pub async fn claim_rewards(
    State(calculator): State<RewardsCalculator>,
    Json(req): Json<ClaimRewardsRequest>,
) -> impl IntoResponse {
    if req.reward_ids.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "reward_ids cannot be empty"})),
        )
            .into_response();
    }

    match calculator.mark_rewards_claimed(req.reward_ids).await {
        Ok(_) => (
            StatusCode::OK,
            Json(json!({
                "message": "Rewards claimed successfully",
                "status": "completed"
            })),
        )
            .into_response(),
        Err(err) => {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": err.to_string()})),
            )
                .into_response()
        }
    }
}
