use thiserror::Error;
use serde::{Deserialize, Serialize};

#[derive(Error, Debug, Clone, Serialize, Deserialize)]
pub enum CardanoAdapterError {
    #[error("Wallet not connected")]
    WalletNotConnected,

    #[error("Connection attempt already in progress")]
    ConnectionInProgress,

    #[error("No Cardano wallet found. Please install Eternl or Nami.")]
    WalletNotFound,

    #[error("User rejected the connection")]
    UserRejected,

    #[error("Wallet is not ready")]
    WalletNotReady,

    #[error("Invalid address: {0}")]
    InvalidAddress(String),

    #[error("Transaction failed: {0}")]
    TransactionFailed(String),

    #[error("Failed to sign message: {0}")]
    SignMessageFailed(String),

    #[error("Failed to sign transaction: {0}")]
    SignTransactionFailed(String),

    #[error("Failed to get balance: {0}")]
    BalanceFetchFailed(String),

    #[error("Network error: {0}")]
    NetworkError(String),

    #[error("Invalid configuration: {0}")]
    ConfigError(String),

    #[error("Serialization error: {0}")]
    SerializationError(String),

    #[error("Unknown error: {0}")]
    Unknown(String),
}

impl From<serde_json::Error> for CardanoAdapterError {
    fn from(err: serde_json::Error) -> Self {
        CardanoAdapterError::SerializationError(err.to_string())
    }
}
