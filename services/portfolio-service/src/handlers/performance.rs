use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::{models::{Performance, PerformanceListResponse}, AppState};

pub async fn get_performance(
    State(_state): State<AppState>,
    Path(user_id): Path<String>,
) -> Result<Json<PerformanceListResponse>, StatusCode> {
    let _user_uuid = Uuid::parse_str(&user_id)
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    tracing::debug!("Fetching performance for user {}", user_id);

    let now = chrono::Utc::now().to_rfc3339();

    let performances = vec![
        Performance {
            period: "1d".to_string(),
            gain_loss_usd: "250.00".to_string(),
            gain_loss_percentage: "2.5".to_string(),
            roi: "2.5".to_string(),
            start_value: "10000.00".to_string(),
            end_value: "10250.00".to_string(),
            timestamp: now.clone(),
        },
        Performance {
            period: "7d".to_string(),
            gain_loss_usd: "1000.00".to_string(),
            gain_loss_percentage: "10.0".to_string(),
            roi: "10.0".to_string(),
            start_value: "10000.00".to_string(),
            end_value: "11000.00".to_string(),
            timestamp: now.clone(),
        },
        Performance {
            period: "30d".to_string(),
            gain_loss_usd: "2000.00".to_string(),
            gain_loss_percentage: "20.0".to_string(),
            roi: "20.0".to_string(),
            start_value: "10000.00".to_string(),
            end_value: "12000.00".to_string(),
            timestamp: now.clone(),
        },
    ];

    Ok(Json(PerformanceListResponse {
        performances,
        timestamp: now,
    }))
}
