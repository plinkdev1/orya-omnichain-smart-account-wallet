use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
    pub status_code: u16,
}

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Transaction not found")]
    TransactionNotFound,

    #[error("Wallet not found")]
    WalletNotFound,

    #[error("User not found")]
    UserNotFound,

    #[error("Invalid transaction type: {0}")]
    InvalidTransactionType(String),

    #[error("Invalid chain: {0}")]
    InvalidChain(String),

    #[error("Invalid status: {0}")]
    InvalidStatus(String),

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Duplicate transaction")]
    DuplicateTransaction,

    #[error("Transaction already processed")]
    TransactionAlreadyProcessed,

    #[error("Cannot update confirmed transaction")]
    CannotUpdateConfirmedTransaction,

    #[error("Invalid amount")]
    InvalidAmount,

    #[error("Invalid address")]
    InvalidAddress,

    #[error("Insufficient balance")]
    InsufficientBalance,

    #[error("Network error: {0}")]
    NetworkError(String),

    #[error("Internal server error")]
    InternalServerError,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_type, message) = match &self {
            AppError::DatabaseError(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "database_error",
                msg.clone(),
            ),
            AppError::TransactionNotFound => (
                StatusCode::NOT_FOUND,
                "transaction_not_found",
                "Transaction not found".to_string(),
            ),
            AppError::WalletNotFound => (
                StatusCode::NOT_FOUND,
                "wallet_not_found",
                "Wallet not found".to_string(),
            ),
            AppError::UserNotFound => (
                StatusCode::NOT_FOUND,
                "user_not_found",
                "User not found".to_string(),
            ),
            AppError::InvalidTransactionType(msg) => (
                StatusCode::BAD_REQUEST,
                "invalid_transaction_type",
                msg.clone(),
            ),
            AppError::InvalidChain(msg) => (
                StatusCode::BAD_REQUEST,
                "invalid_chain",
                msg.clone(),
            ),
            AppError::InvalidStatus(msg) => (
                StatusCode::BAD_REQUEST,
                "invalid_status",
                msg.clone(),
            ),
            AppError::ValidationError(msg) => (
                StatusCode::BAD_REQUEST,
                "validation_error",
                msg.clone(),
            ),
            AppError::DuplicateTransaction => (
                StatusCode::CONFLICT,
                "duplicate_transaction",
                "Transaction already exists".to_string(),
            ),
            AppError::TransactionAlreadyProcessed => (
                StatusCode::CONFLICT,
                "already_processed",
                "Transaction already processed".to_string(),
            ),
            AppError::CannotUpdateConfirmedTransaction => (
                StatusCode::BAD_REQUEST,
                "cannot_update_confirmed",
                "Cannot update confirmed transaction".to_string(),
            ),
            AppError::InvalidAmount => (
                StatusCode::BAD_REQUEST,
                "invalid_amount",
                "Invalid transaction amount".to_string(),
            ),
            AppError::InvalidAddress => (
                StatusCode::BAD_REQUEST,
                "invalid_address",
                "Invalid wallet address".to_string(),
            ),
            AppError::InsufficientBalance => (
                StatusCode::BAD_REQUEST,
                "insufficient_balance",
                "Insufficient balance for transaction".to_string(),
            ),
            AppError::NetworkError(msg) => (
                StatusCode::SERVICE_UNAVAILABLE,
                "network_error",
                msg.clone(),
            ),
            AppError::InternalServerError => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "internal_error",
                "Internal server error".to_string(),
            ),
        };

        let error_response = ErrorResponse {
            error: error_type.to_string(),
            message,
            status_code: status.as_u16(),
        };

        (status, Json(error_response)).into_response()
    }
}

// Implement conversion from sqlx::Error
impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        tracing::error!("Database error: {:?}", err);
        match err {
            sqlx::Error::RowNotFound => AppError::TransactionNotFound,
            _ => AppError::DatabaseError(err.to_string()),
        }
    }
}