use crate::error::Error;
use super::{ContractError, Result};
use ethers::prelude::*;
use rust_decimal::Decimal;
use std::sync::Arc;
use tracing::{debug, error, info};

abigen!(
    StrategyManagerContract,
    r#"
    [
        {"type":"function","name":"depositIntoStrategy","inputs":[{"name":"strategy","type":"address"},{"name":"token","type":"address"},{"name":"amount","type":"uint256"}],"outputs":[{"name":"shares","type":"uint256"}],"stateMutability":"nonpayable"},
        {"type":"function","name":"queueWithdrawal","inputs":[{"name":"strategies","type":"address[]"},{"name":"shares","type":"uint256[]"},{"name":"withdrawer","type":"address"}],"outputs":[{"name":"withdrawalRoot","type":"bytes32"}],"stateMutability":"nonpayable"},
        {"type":"function","name":"completeQueuedWithdrawal","inputs":[{"name":"withdrawal","type":"tuple","components":[{"name":"strategies","type":"address[]"},{"name":"shares","type":"uint256[]"},{"name":"staker","type":"address"},{"name":"withdrawer","type":"address"},{"name":"nonce","type":"uint256"},{"name":"startBlock","type":"uint32"},{"name":"delegatedTo","type":"address"}]},{"name":"tokens","type":"address[]"},{"name":"middlewareTimesIndex","type":"uint256"},{"name":"receiveAsTokens","type":"bool"}],"outputs":[],"stateMutability":"nonpayable"},
        {"type":"function","name":"stakerStrategyShares","inputs":[{"name":"staker","type":"address"},{"name":"strategy","type":"address"}],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view"},
        {"type":"function","name":"getDepositsOf","inputs":[{"name":"staker","type":"address"}],"outputs":[{"name":"","type":"address[]"},{"name":"","type":"uint256[]"}],"stateMutability":"view"}
    ]
    "#,
    event_derives(serde::Serialize, serde::Deserialize)
);

#[derive(Debug, Clone)]
pub struct StrategyManager {
    contract: StrategyManagerContract<Provider<Http>>,
}

impl StrategyManager {
    pub fn new(address: Address, provider: Arc<Provider<Http>>) -> Result<Self> {
        let contract = StrategyManagerContract::new(address, provider);
        debug!("StrategyManager contract initialized at {}", address);
        Ok(Self { contract })
    }

    pub async fn deposit_into_strategy(
        &self,
        strategy: Address,
        token: Address,
        amount: U256,
    ) -> Result<U256> {
        debug!(
            "Depositing {} tokens into strategy {} for token {}",
            amount, strategy, token
        );

        let call = self.contract.deposit_into_strategy(strategy, token, amount);
        
        let shares = call
            .call()
            .await
            .map_err(|e| {
                error!("Failed to deposit into strategy: {}", e);
                ContractError::CallFailed(format!("Deposit failed: {}", e))
            })?;

        info!("Successfully deposited, received shares: {}", shares);
        Ok(shares)
    }

    pub async fn get_staker_strategy_shares(
        &self,
        staker: Address,
        strategy: Address,
    ) -> Result<U256> {
        debug!("Getting shares for staker {} in strategy {}", staker, strategy);

        let shares = self
            .contract
            .staker_strategy_shares(staker, strategy)
            .call()
            .await
            .map_err(|e| {
                error!("Failed to get staker strategy shares: {}", e);
                ContractError::CallFailed(e.to_string())
            })?;

        debug!("Staker has {} shares in strategy", shares);
        Ok(shares)
    }

    pub async fn queue_withdrawal(
        &self,
        strategies: Vec<Address>,
        shares: Vec<U256>,
        withdrawer: Address,
    ) -> Result<[u8; 32]> {
        debug!(
            "Queueing withdrawal for {} strategies with {} shares",
            strategies.len(),
            shares.len()
        );

        if strategies.len() != shares.len() {
            return Err(ContractError::InvalidParameters(
                "strategies and shares length mismatch".to_string(),
            ));
        }

        let call = self.contract.queue_withdrawal(strategies, shares, withdrawer);

        let withdrawal_root = call
            .call()
            .await
            .map_err(|e| {
                error!("Failed to queue withdrawal: {}", e);
                ContractError::CallFailed(format!("Queue withdrawal failed: {}", e))
            })?;

        info!("Withdrawal queued with root: {:?}", withdrawal_root);
        Ok(withdrawal_root)
    }

    pub async fn get_deposits_of(&self, staker: Address) -> Result<(Vec<Address>, Vec<U256>)> {
        debug!("Getting deposits for staker {}", staker);

        let (strategies, shares) = self
            .contract
            .get_deposits_of(staker)
            .call()
            .await
            .map_err(|e| {
                error!("Failed to get deposits: {}", e);
                ContractError::CallFailed(e.to_string())
            })?;

        debug!("Staker has {} deposits", strategies.len());
        Ok((strategies, shares))
    }

    pub fn get_deposit_function_signature() -> String {
        "depositIntoStrategy(address,address,uint256)".to_string()
    }

    pub fn get_queue_withdrawal_function_signature() -> String {
        "queueWithdrawal(uint256[],address[],uint256[],address,bool)".to_string()
    }

    pub fn validate_strategy_address(address: &str) -> Result<()> {
        address
            .parse::<Address>()
            .map_err(|_| ContractError::InvalidParameters("Invalid strategy address".to_string()))?;
        Ok(())
    }

    pub fn validate_token_address(address: &str) -> Result<()> {
        address
            .parse::<Address>()
            .map_err(|_| ContractError::InvalidParameters("Invalid token address".to_string()))?;
        Ok(())
    }

    pub fn calculate_shares(amount: Decimal, price_per_share: Decimal) -> Result<Decimal> {
        if price_per_share.is_zero() {
            return Err(ContractError::InvalidParameters(
                "Price per share cannot be zero".to_string(),
            ));
        }
        Ok(amount / price_per_share)
    }

    pub fn get_strategy_withdrawal_delay_blocks() -> u32 {
        50400
    }

    pub fn contract_address(&self) -> Address {
        self.contract.address()
    }
}
