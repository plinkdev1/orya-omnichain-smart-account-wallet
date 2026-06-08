use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum PaymentError {
    #[error("Invalid wallet type: {0}")]
    InvalidWalletType(String),

    #[error("Invalid payment request: {0}")]
    InvalidPaymentRequest(String),

    #[error("Wallet not found")]
    WalletNotFound,

    #[error("Unsupported wallet type: {0}")]
    UnsupportedWalletType(String),

    #[error("Exchange rate not available")]
    ExchangeRateNotAvailable,

    #[error("Payment routing failed: {0}")]
    RoutingFailed(String),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("External service error: {0}")]
    ExternalServiceError(String),

    #[error("Invalid address: {0}")]
    InvalidAddress(String),

    #[error("Insufficient balance")]
    InsufficientBalance,

    #[error("Settlement tracking error: {0}")]
    SettlementError(String),

    #[error("Internal server error")]
    InternalError,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub code: String,
    pub request_id: Option<String>,
}

impl IntoResponse for PaymentError {
    fn into_response(self) -> Response {
        let (status, error_code, message) = match &self {
            PaymentError::InvalidWalletType(_) => (
                StatusCode::BAD_REQUEST,
                "INVALID_WALLET_TYPE",
                self.to_string(),
            ),
            PaymentError::InvalidPaymentRequest(_) => (
                StatusCode::BAD_REQUEST,
                "INVALID_REQUEST",
                self.to_string(),
            ),
            PaymentError::WalletNotFound => (
                StatusCode::NOT_FOUND,
                "WALLET_NOT_FOUND",
                self.to_string(),
            ),
            PaymentError::UnsupportedWalletType(_) => (
                StatusCode::BAD_REQUEST,
                "UNSUPPORTED_WALLET_TYPE",
                self.to_string(),
            ),
            PaymentError::ExchangeRateNotAvailable => (
                StatusCode::SERVICE_UNAVAILABLE,
                "RATE_NOT_AVAILABLE",
                self.to_string(),
            ),
            PaymentError::RoutingFailed(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "ROUTING_FAILED",
                self.to_string(),
            ),
            PaymentError::DatabaseError(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "DB_ERROR",
                self.to_string(),
            ),
            PaymentError::ExternalServiceError(_) => (
                StatusCode::SERVICE_UNAVAILABLE,
                "SERVICE_ERROR",
                self.to_string(),
            ),
            PaymentError::InvalidAddress(_) => (
                StatusCode::BAD_REQUEST,
                "INVALID_ADDRESS",
                self.to_string(),
            ),
            PaymentError::InsufficientBalance => (
                StatusCode::BAD_REQUEST,
                "INSUFFICIENT_BALANCE",
                self.to_string(),
            ),
            PaymentError::SettlementError(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "SETTLEMENT_ERROR",
                self.to_string(),
            ),
            PaymentError::InternalError => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                "An internal server error occurred".to_string(),
            ),
        };

        let body = Json(ErrorResponse {
            error: message,
            code: error_code.to_string(),
            request_id: None,
        });

        (status, body).into_response()
    }
}
