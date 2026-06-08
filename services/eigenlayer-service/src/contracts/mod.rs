pub mod strategy_manager;
pub mod delegation_manager;
pub mod avs_directory;

pub use strategy_manager::StrategyManager;
pub use delegation_manager::DelegationManager;
pub use avs_directory::AVSDirectory;

use crate::error::Error;
use ethers::prelude::*;
use std::sync::Arc;

pub type Result<T> = std::result::Result<T, ContractError>;

#[derive(Debug, Clone)]
pub struct ContractClients {
    pub strategy_manager: Arc<StrategyManager>,
    pub delegation_manager: Arc<DelegationManager>,
    pub avs_directory: Arc<AVSDirectory>,
    pub provider: Arc<Provider<Http>>,
}

impl ContractClients {
    pub async fn new(
        rpc_url: &str,
        strategy_manager_addr: Address,
        delegation_manager_addr: Address,
        avs_directory_addr: Address,
    ) -> Result<Self> {
        let provider = Provider::<Http>::try_from(rpc_url)
            .map_err(|e| ContractError::ProviderError(e.to_string()))?;
        let provider = Arc::new(provider);

        let strategy_manager = StrategyManager::new(strategy_manager_addr, provider.clone())
            .map_err(|e| ContractError::CallFailed(format!("Failed to create StrategyManager: {}", e)))?;
        
        let delegation_manager = DelegationManager::new(delegation_manager_addr, provider.clone())
            .map_err(|e| ContractError::CallFailed(format!("Failed to create DelegationManager: {}", e)))?;
        
        let avs_directory = AVSDirectory::new(avs_directory_addr, provider.clone())
            .map_err(|e| ContractError::CallFailed(format!("Failed to create AVSDirectory: {}", e)))?;

        Ok(Self {
            strategy_manager: Arc::new(strategy_manager),
            delegation_manager: Arc::new(delegation_manager),
            avs_directory: Arc::new(avs_directory),
            provider,
        })
    }

    pub fn provider(&self) -> Arc<Provider<Http>> {
        self.provider.clone()
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ContractError {
    #[error("Provider error: {0}")]
    ProviderError(String),

    #[error("Contract call failed: {0}")]
    CallFailed(String),

    #[error("Transaction failed: {0}")]
    TransactionFailed(String),

    #[error("Parsing error: {0}")]
    ParseError(String),

    #[error("Invalid parameters: {0}")]
    InvalidParameters(String),
}

impl From<ContractError> for Error {
    fn from(err: ContractError) -> Self {
        Error::ContractError(err.to_string())
    }
}
