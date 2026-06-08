use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Invalid address: {0}")]
    InvalidAddress(String),

    #[error("Contract error: {0}")]
    ContractError(String),

    #[error("EigenLayer API error: {0}")]
    EigenLayerApiError(String),

    #[error("Insufficient balance")]
    InsufficientBalance,

    #[error("Invalid amount: {0}")]
    InvalidAmount(String),

    #[error("Operator not found")]
    OperatorNotFound,

    #[error("Strategy not found")]
    StrategyNotFound,

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Internal server error: {0}")]
    InternalError(String),

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Not found: {0}")]
    NotFound(String),
}

impl From<sqlx::Error> for Error {
    fn from(err: sqlx::Error) -> Self {
        Error::DatabaseError(err.to_string())
    }
}

impl From<anyhow::Error> for Error {
    fn from(err: anyhow::Error) -> Self {
        Error::InternalError(err.to_string())
    }
}
