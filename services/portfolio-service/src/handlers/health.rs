use crate::models::HealthResponse;
use axum::Json;

pub async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        service: "portfolio-service".to_string(),
        version: "0.1.0".to_string(),
    })
}
