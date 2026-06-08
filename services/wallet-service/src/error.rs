use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Wallet not found")]
    WalletNotFound,

    #[error("User not found")]
    UserNotFound,

    #[error("Invalid user ID")]
    InvalidUserId,

    #[error("Invalid wallet ID")]
    InvalidWalletId,

    #[error("Wallet already exists")]
    WalletAlreadyExists,

    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Internal server error")]
    InternalServerError,

    #[error("Invalid chain: {0}")]
    InvalidChain(String),

    #[error("Cannot delete primary wallet")]
    CannotDeletePrimaryWallet,

    #[error("No primary wallet found")]
    NoPrimaryWallet,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::WalletNotFound => (
                StatusCode::NOT_FOUND,
                "Wallet not found".to_string(),
            ),
            AppError::UserNotFound => (
                StatusCode::NOT_FOUND,
                "User not found".to_string(),
            ),
            AppError::InvalidUserId | AppError::InvalidWalletId => (
                StatusCode::BAD_REQUEST,
                "Invalid ID format".to_string(),
            ),
            AppError::WalletAlreadyExists => (
                StatusCode::CONFLICT,
                "Wallet already exists".to_string(),
            ),
            AppError::InvalidRequest(ref msg) => (
                StatusCode::BAD_REQUEST,
                msg.clone(),
            ),
            AppError::Unauthorized => (
                StatusCode::UNAUTHORIZED,
                "Unauthorized".to_string(),
            ),
            AppError::InvalidChain(ref chain) => (
                StatusCode::BAD_REQUEST,
                format!("Invalid chain: {}", chain),
            ),
            AppError::CannotDeletePrimaryWallet => (
                StatusCode::BAD_REQUEST,
                "Cannot delete primary wallet".to_string(),
            ),
            AppError::NoPrimaryWallet => (
                StatusCode::NOT_FOUND,
                "No primary wallet found".to_string(),
            ),
            _ => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error".to_string(),
            ),
        };

        let body = Json(json!({
            "error": error_message,
            "status": status.as_u16()
        }));

        (status, body).into_response()
    }
}