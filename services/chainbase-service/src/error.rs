use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ChainbaseError {
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Redis error: {0}")]
    RedisError(String),

    #[error("API error: {0}")]
    ApiError(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Internal error: {0}")]
    InternalError(String),
}

impl IntoResponse for ChainbaseError {
    fn into_response(self) -> Response {
        let (status, error_message, details) = match &self {
            ChainbaseError::DatabaseError(e) => {
                tracing::error!("Database error: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Database error occurred", e.to_string())
            }
            ChainbaseError::RedisError(e) => {
                tracing::error!("Redis error: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Cache error occurred", e.clone())
            }
            ChainbaseError::ApiError(e) => {
                tracing::warn!("API error: {}", e);
                (StatusCode::BAD_GATEWAY, "External API error", e.clone())
            }
            ChainbaseError::ConfigError(e) => {
                tracing::error!("Config error: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Configuration error", e.clone())
            }
            ChainbaseError::InvalidRequest(e) => {
                tracing::warn!("Invalid request: {}", e);
                (StatusCode::BAD_REQUEST, "Invalid request", e.clone())
            }
            ChainbaseError::NotFound(e) => {
                tracing::warn!("Not found: {}", e);
                (StatusCode::NOT_FOUND, "Resource not found", e.clone())
            }
            ChainbaseError::InternalError(e) => {
                tracing::error!("Internal error: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error", e.clone())
            }
        };

        let body = Json(json!({
            "error": error_message,
            "details": details,
        }));

        (status, body).into_response()
    }
}

pub type Result<T> = std::result::Result<T, ChainbaseError>;
