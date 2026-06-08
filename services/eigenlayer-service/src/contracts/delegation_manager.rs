use super::{ContractError, Result};
use ethers::prelude::*;
use std::sync::Arc;
use tracing::{debug, error, info};

abigen!(
    DelegationManagerContract,
    r#"
    [
        {"type":"function","name":"delegateTo","inputs":[{"name":"operator","type":"address"},{"name":"approverSignatureAndExpiry","type":"tuple","components":[{"name":"signature","type":"bytes"},{"name":"expiry","type":"uint256"}]},{"name":"approverSalt","type":"bytes32"}],"outputs":[],"stateMutability":"nonpayable"},
        {"type":"function","name":"undelegate","inputs":[{"name":"staker","type":"address"}],"outputs":[{"name":"withdrawalRoot","type":"bytes32"}],"stateMutability":"nonpayable"},
        {"type":"function","name":"delegatedTo","inputs":[{"name":"staker","type":"address"}],"outputs":[{"name":"","type":"address"}],"stateMutability":"view"},
        {"type":"function","name":"isOperator","inputs":[{"name":"operator","type":"address"}],"outputs":[{"name":"","type":"bool"}],"stateMutability":"view"},
        {"type":"function","name":"operatorShares","inputs":[{"name":"operator","type":"address"},{"name":"strategy","type":"address"}],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view"},
        {"type":"function","name":"registerAsOperator","inputs":[{"name":"registeringOperatorDetails","type":"tuple","components":[{"name":"earningsReceiver","type":"address"},{"name":"delegationApprover","type":"address"},{"name":"stakerOptOutWindowBlocks","type":"uint32"}]},{"name":"metadataURI","type":"string"}],"outputs":[],"stateMutability":"nonpayable"}
    ]
    "#,
    event_derives(serde::Serialize, serde::Deserialize)
);

#[derive(Debug, Clone)]
pub struct DelegationManager {
    contract: DelegationManagerContract<Provider<Http>>,
}

impl DelegationManager {
    pub fn new(address: Address, provider: Arc<Provider<Http>>) -> Result<Self> {
        let contract = DelegationManagerContract::new(address, provider);
        debug!("DelegationManager contract initialized at {}", address);
        Ok(Self { contract })
    }

    pub async fn delegated_to(&self, staker: Address) -> Result<Address> {
        debug!("Getting delegated operator for staker {}", staker);

        let operator = self
            .contract
            .delegated_to(staker)
            .call()
            .await
            .map_err(|e| {
                error!("Failed to get delegated operator: {}", e);
                ContractError::CallFailed(e.to_string())
            })?;

        debug!("Staker {} is delegated to {}", staker, operator);
        Ok(operator)
    }

    pub async fn is_operator(&self, operator: Address) -> Result<bool> {
        debug!("Checking if {} is a registered operator", operator);

        let is_op = self
            .contract
            .is_operator(operator)
            .call()
            .await
            .map_err(|e| {
                error!("Failed to check operator status: {}", e);
                ContractError::CallFailed(e.to_string())
            })?;

        debug!("Operator status for {}: {}", operator, is_op);
        Ok(is_op)
    }

    pub async fn get_operator_shares(
        &self,
        operator: Address,
        strategy: Address,
    ) -> Result<U256> {
        debug!("Getting operator shares for {} in strategy {}", operator, strategy);

        let shares = self
            .contract
            .operator_shares(operator, strategy)
            .call()
            .await
            .map_err(|e| {
                error!("Failed to get operator shares: {}", e);
                ContractError::CallFailed(e.to_string())
            })?;

        debug!("Operator {} has {} shares in strategy", operator, shares);
        Ok(shares)
    }

    pub fn get_delegate_function_signature() -> String {
        "delegateTo(address,SignatureWithExpiry,bytes32)".to_string()
    }

    pub fn get_undelegate_function_signature() -> String {
        "undelegate(address)".to_string()
    }

    pub fn validate_operator_address(address: &str) -> Result<()> {
        address
            .parse::<Address>()
            .map_err(|_| ContractError::InvalidParameters("Invalid operator address".to_string()))?;
        Ok(())
    }

    pub fn validate_delegator_address(address: &str) -> Result<()> {
        address
            .parse::<Address>()
            .map_err(|_| ContractError::InvalidParameters("Invalid delegator address".to_string()))?;
        Ok(())
    }

    pub fn get_max_delegation_approval_delay_blocks() -> u32 {
        86400
    }

    pub fn get_min_staker_opt_out_window_blocks() -> u32 {
        50400
    }

    pub fn validate_signature_expiry(block_number: u64, expiry: u64) -> Result<()> {
        if expiry <= block_number {
            return Err(ContractError::InvalidParameters(
                "Signature has expired".to_string(),
            ));
        }
        Ok(())
    }

    pub fn contract_address(&self) -> Address {
        self.contract.address()
    }
}
