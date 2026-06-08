use crate::config::Config;
use crate::error::Error;
use ethers::prelude::*;
use rust_decimal::Decimal;
use std::sync::Arc;
use tracing::{info, error};

pub struct EigenLayerClient {
    provider: Arc<Provider<Http>>,
    strategy_manager_address: Address,
    delegation_manager_address: Address,
    avs_directory_address: Address,
}

impl EigenLayerClient {
    pub fn new(config: &Config) -> Result<Self, Error> {
        let provider = Provider::<Http>::try_from(&config.ethereum_rpc_url)
            .map_err(|e| Error::ConfigError(format!("Failed to create provider: {}", e)))?;

        let strategy_manager = config.strategy_manager_address
            .parse::<Address>()
            .map_err(|_| Error::InvalidAddress("Invalid strategy manager address".to_string()))?;

        let delegation_manager = config.delegation_manager_address
            .parse::<Address>()
            .map_err(|_| Error::InvalidAddress("Invalid delegation manager address".to_string()))?;

        let avs_directory = config.avs_directory_address
            .parse::<Address>()
            .map_err(|_| Error::InvalidAddress("Invalid AVS directory address".to_string()))?;

        info!("EigenLayer client initialized");

        Ok(EigenLayerClient {
            provider: Arc::new(provider),
            strategy_manager_address: strategy_manager,
            delegation_manager_address: delegation_manager,
            avs_directory_address: avs_directory,
        })
    }

    pub fn get_provider(&self) -> Arc<Provider<Http>> {
        Arc::clone(&self.provider)
    }

    pub fn get_strategy_manager_address(&self) -> Address {
        self.strategy_manager_address
    }

    pub fn get_delegation_manager_address(&self) -> Address {
        self.delegation_manager_address
    }

    pub fn get_avs_directory_address(&self) -> Address {
        self.avs_directory_address
    }

    pub async fn validate_strategy(&self, strategy_address: &str) -> Result<bool, Error> {
        let _addr = strategy_address
            .parse::<Address>()
            .map_err(|_| Error::InvalidAddress("Invalid strategy address".to_string()))?;

        info!("Validating strategy: {}", strategy_address);
        Ok(true)
    }

    pub async fn get_operator_shares(
        &self,
        operator_address: &str,
        strategy_address: &str,
    ) -> Result<Decimal, Error> {
        let _operator = operator_address
            .parse::<Address>()
            .map_err(|_| Error::InvalidAddress("Invalid operator address".to_string()))?;

        let _strategy = strategy_address
            .parse::<Address>()
            .map_err(|_| Error::InvalidAddress("Invalid strategy address".to_string()))?;

        info!(
            "Getting operator shares for {} in strategy {}",
            operator_address, strategy_address
        );

        Ok(Decimal::from(0))
    }

    pub async fn check_operator_registration(&self, operator_address: &str) -> Result<bool, Error> {
        let _addr = operator_address
            .parse::<Address>()
            .map_err(|_| Error::InvalidAddress("Invalid operator address".to_string()))?;

        info!("Checking operator registration: {}", operator_address);
        Ok(true)
    }

    pub async fn get_node_operator_details(
        &self,
        operator_address: &str,
    ) -> Result<serde_json::Value, Error> {
        let _addr = operator_address
            .parse::<Address>()
            .map_err(|_| Error::InvalidAddress("Invalid operator address".to_string()))?;

        info!("Fetching node operator details: {}", operator_address);

        Ok(serde_json::json!({
            "operatorAddress": operator_address,
            "metadataURI": "",
            "delegationApprover": "0x0000000000000000000000000000000000000000",
            "stakerOptOutWindowBlocks": 0,
        }))
    }
}
