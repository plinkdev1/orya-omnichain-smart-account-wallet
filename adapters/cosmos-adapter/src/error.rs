use std::fmt;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Network error: {0}")]
    NetworkError(String),

    #[error("Parse error: {0}")]
    ParseError(String),

    #[error("Invalid key: {0}")]
    InvalidKey(String),

    #[error("Signing error: {0}")]
    SigningError(String),

    #[error("Transaction error: {0}")]
    TransactionError(String),

    #[error("RPC error: {0}")]
    RpcError(String),

    #[error("Invalid address: {0}")]
    InvalidAddress(String),

    #[error("Serialization error: {0}")]
    SerializationError(String),

    #[error("Account not found: {0}")]
    AccountNotFound(String),

    #[error("Balance insufficient: required {required}, available {available}")]
    InsufficientBalance { required: String, available: String },

    #[error("Invalid amount: {0}")]
    InvalidAmount(String),

    #[error("HD Wallet error: {0}")]
    HdWalletError(String),

    #[error("Unknown error: {0}")]
    Unknown(String),
}
