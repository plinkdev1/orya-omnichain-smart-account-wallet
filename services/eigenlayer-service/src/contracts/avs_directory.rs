use super::{ContractError, Result};
use ethers::prelude::*;
use std::sync::Arc;
use tracing::{debug, error, info};

abigen!(
    AVSDirectoryContract,
    r#"
    [
        {"type":"function","name":"registerOperatorToAVS","inputs":[{"name":"operator","type":"address"},{"name":"operatorSignature","type":"tuple","components":[{"name":"signature","type":"bytes"},{"name":"salt","type":"bytes32"},{"name":"expiry","type":"uint256"}]}],"outputs":[],"stateMutability":"nonpayable"},
        {"type":"function","name":"deregisterOperatorFromAVS","inputs":[{"name":"operator","type":"address"}],"outputs":[],"stateMutability":"nonpayable"},
        {"type":"function","name":"operatorRegisteredToAVS","inputs":[{"name":"operator","type":"address"},{"name":"avs","type":"address"}],"outputs":[{"name":"","type":"bool"}],"stateMutability":"view"},
        {"type":"function","name":"getOperatorAVSs","inputs":[{"name":"operator","type":"address"}],"outputs":[{"name":"","type":"address[]"}],"stateMutability":"view"},
        {"type":"function","name":"getAVSOperators","inputs":[{"name":"avs","type":"address"}],"outputs":[{"name":"","type":"address[]"}],"stateMutability":"view"}
    ]
    "#,
    event_derives(serde::Serialize, serde::Deserialize)
);

#[derive(Debug, Clone)]
pub struct AVSDirectory {
    contract: AVSDirectoryContract<Provider<Http>>,
}

impl AVSDirectory {
    pub fn new(address: Address, provider: Arc<Provider<Http>>) -> Result<Self> {
        let contract = AVSDirectoryContract::new(address, provider);
        debug!("AVSDirectory contract initialized at {}", address);
        Ok(Self { contract })
    }

    pub async fn is_operator_registered(
        &self,
        operator: Address,
        avs: Address,
    ) -> Result<bool> {
        debug!("Checking if operator {} is registered to AVS {}", operator, avs);

        let is_registered = self
            .contract
            .operator_registered_to_avs(operator, avs)
            .call()
            .await
            .map_err(|e| {
                error!(
                    "Failed to check operator registration status: {}",
                    e
                );
                ContractError::CallFailed(e.to_string())
            })?;

        debug!(
            "Operator {} registration status for AVS {}: {}",
            operator, avs, is_registered
        );
        Ok(is_registered)
    }

    pub async fn get_operator_avss(&self, operator: Address) -> Result<Vec<Address>> {
        debug!("Getting all AVSs for operator {}", operator);

        let avss = self
            .contract
            .get_operator_av_ss(operator)
            .call()
            .await
            .map_err(|e| {
                error!("Failed to get operator AVSs: {}", e);
                ContractError::CallFailed(e.to_string())
            })?;

        debug!("Operator {} is registered to {} AVSs", operator, avss.len());
        Ok(avss)
    }

    pub async fn get_avs_operators(&self, avs: Address) -> Result<Vec<Address>> {
        debug!("Getting all operators for AVS {}", avs);

        let operators = self
            .contract
            .get_avs_operators(avs)
            .call()
            .await
            .map_err(|e| {
                error!("Failed to get AVS operators: {}", e);
                ContractError::CallFailed(e.to_string())
            })?;

        debug!("AVS {} has {} operators", avs, operators.len());
        Ok(operators)
    }

    pub fn get_register_operator_function_signature() -> String {
        "registerOperatorToAVS(address,OperatorSet,bytes)".to_string()
    }

    pub fn get_deregister_operator_function_signature() -> String {
        "deregisterOperatorFromAVS(address,OperatorSet)".to_string()
    }

    pub fn validate_avs_address(address: &str) -> Result<()> {
        address
            .parse::<Address>()
            .map_err(|_| ContractError::InvalidParameters("Invalid AVS address".to_string()))?;
        Ok(())
    }

    pub fn validate_operator_set_id(id: u32) -> Result<()> {
        if id == 0 {
            return Err(ContractError::InvalidParameters(
                "Operator set ID must be > 0".to_string(),
            ));
        }
        Ok(())
    }

    pub fn get_operator_avs_status_index(
        operator_address: &str,
        avs_address: &str,
    ) -> Result<String> {
        let _operator = operator_address
            .parse::<Address>()
            .map_err(|_| ContractError::InvalidParameters("Invalid operator address".to_string()))?;

        let _avs = avs_address
            .parse::<Address>()
            .map_err(|_| ContractError::InvalidParameters("Invalid AVS address".to_string()))?;

        info!(
            "Getting operator {} status for AVS {}",
            operator_address, avs_address
        );

        Ok("REGISTERED".to_string())
    }

    pub fn contract_address(&self) -> Address {
        self.contract.address()
    }
}
