use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

#[derive(Debug)]
pub enum AppError {
    UserAlreadyExists,
    UserNotFound,
    InvalidToken,
    DatabaseError(String),
    InternalServerError,
    InvalidRequest(String),
    Unauthorized,
    Conflict(String),
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
    pub status: u16,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error, message) = match self {
            AppError::UserAlreadyExists => (
                StatusCode::CONFLICT,
                "USER_ALREADY_EXISTS",
                "User with this email or Privy ID already exists",
            ),
            AppError::UserNotFound => (
                StatusCode::NOT_FOUND,
                "USER_NOT_FOUND",
                "User not found",
            ),
            AppError::InvalidToken => (
                StatusCode::UNAUTHORIZED,
                "INVALID_TOKEN",
                "Invalid or expired token",
            ),
            AppError::DatabaseError(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "DATABASE_ERROR",
                &msg,
            ),
            AppError::InternalServerError => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                "An internal server error occurred",
            ),
            AppError::InvalidRequest(msg) => (
                StatusCode::BAD_REQUEST,
                "INVALID_REQUEST",
                &msg,
            ),
            AppError::Unauthorized => (
                StatusCode::UNAUTHORIZED,
                "UNAUTHORIZED",
                "Unauthorized access",
            ),
            AppError::Conflict(msg) => (
                StatusCode::CONFLICT,
                "CONFLICT",
                &msg,
            ),
        };

        let body = Json(ErrorResponse {
            error: error.to_string(),
            message: message.to_string(),
            status: status.as_u16(),
        });

        (status, body).into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        tracing::error!("Database error: {}", err);
        AppError::DatabaseError(err.to_string())
    }
}