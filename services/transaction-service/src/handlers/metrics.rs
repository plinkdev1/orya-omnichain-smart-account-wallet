use axum::Json;
use crate::models::MetricsResponse;

pub async fn metrics_handler() -> Json<MetricsResponse> {
    Json(MetricsResponse {
        total_transactions_processed: 0,
        transactions_pending: 0,
        transactions_failed: 0,
        avg_confirmation_time_seconds: 0,
    })
}