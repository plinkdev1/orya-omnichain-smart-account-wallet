use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use sqlx::PgPool;

pub async fn health_check(db: axum::extract::State<PgPool>) -> impl IntoResponse {
    let db_status = sqlx::query("SELECT 1")
        .fetch_optional(&db)
        .await
        .map(|_| "connected")
        .unwrap_or("disconnected");

    (
        StatusCode::OK,
        Json(json!({
            "status": "healthy",
            "service": "eigenlayer-service",
            "database": db_status,
            "version": "0.1.0"
        })),
    )
}

pub async fn metrics() -> impl IntoResponse {
    (
        StatusCode::OK,
        r#"
# HELP eigenlayer_restaking_positions_total Total restaking positions
# TYPE eigenlayer_restaking_positions_total gauge
eigenlayer_restaking_positions_total 0

# HELP eigenlayer_total_restaked_amount Total amount restaked
# TYPE eigenlayer_total_restaked_amount gauge
eigenlayer_total_restaked_amount 0

# HELP eigenlayer_rewards_earned_total Total rewards earned
# TYPE eigenlayer_rewards_earned_total gauge
eigenlayer_rewards_earned_total 0

# HELP eigenlayer_slashing_events_total Total slashing events
# TYPE eigenlayer_slashing_events_total counter
eigenlayer_slashing_events_total 0
        "#,
    )
}
