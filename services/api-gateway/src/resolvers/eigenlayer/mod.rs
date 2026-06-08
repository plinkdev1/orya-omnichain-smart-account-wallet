use async_graphql::{Context, Object, Result};
use crate::resolvers::eigenlayer::client::EigenLayerClient;

pub mod types;
pub mod client;

pub use types::*;

#[derive(Default)]
pub struct EigenLayerQuery;

#[Object]
impl EigenLayerQuery {
    pub async fn restaking_positions(
        &self,
        ctx: &Context<'_>,
        user_id: String,
    ) -> Result<RestakingPositionsResponse> {
        let client = ctx
            .data::<EigenLayerClient>()
            .map_err(|_| {
                async_graphql::Error::new("EigenLayer client not found in context")
            })?;

        client.get_restaking_positions(user_id).await
    }

    pub async fn eigen_layer_operators(
        &self,
        ctx: &Context<'_>,
        is_active: Option<bool>,
        min_delegated: Option<String>,
    ) -> Result<Vec<EigenLayerOperator>> {
        let client = ctx
            .data::<EigenLayerClient>()
            .map_err(|_| {
                async_graphql::Error::new("EigenLayer client not found in context")
            })?;

        client.get_operators(is_active, min_delegated).await
    }

    pub async fn eigen_layer_rewards(
        &self,
        ctx: &Context<'_>,
        user_id: String,
        claimed: Option<bool>,
    ) -> Result<RewardsResponse> {
        let client = ctx
            .data::<EigenLayerClient>()
            .map_err(|_| {
                async_graphql::Error::new("EigenLayer client not found in context")
            })?;

        client.get_rewards(user_id, claimed).await
    }

    pub async fn eigen_layer_strategy_apy(
        &self,
        ctx: &Context<'_>,
        strategy_address: String,
    ) -> Result<StrategyAPYResponse> {
        let client = ctx
            .data::<EigenLayerClient>()
            .map_err(|_| {
                async_graphql::Error::new("EigenLayer client not found in context")
            })?;

        client.get_strategy_apy(strategy_address).await
    }

    pub async fn eigen_layer_slashing_events(
        &self,
        ctx: &Context<'_>,
        operator_address: Option<String>,
        limit: Option<i32>,
    ) -> Result<Vec<EigenLayerSlashingEvent>> {
        let client = ctx
            .data::<EigenLayerClient>()
            .map_err(|_| {
                async_graphql::Error::new("EigenLayer client not found in context")
            })?;

        client.get_slashing_events(operator_address, limit).await
    }
}

#[derive(Default)]
pub struct EigenLayerMutation;

#[Object]
impl EigenLayerMutation {
    pub async fn restake_tokens(
        &self,
        ctx: &Context<'_>,
        strategy_address: String,
        amount: String,
        operator_address: Option<String>,
    ) -> Result<RestakeResponse> {
        let client = ctx
            .data::<EigenLayerClient>()
            .map_err(|_| {
                async_graphql::Error::new("EigenLayer client not found in context")
            })?;

        let user_id = ctx
            .data::<String>()
            .map(|id| id.clone())
            .unwrap_or_else(|_| "unknown".to_string());

        client
            .restake_tokens(user_id, strategy_address, amount, operator_address)
            .await
    }

    pub async fn queue_withdrawal(
        &self,
        ctx: &Context<'_>,
        position_id: async_graphql::ID,
    ) -> Result<QueueWithdrawalResponse> {
        let client = ctx
            .data::<EigenLayerClient>()
            .map_err(|_| {
                async_graphql::Error::new("EigenLayer client not found in context")
            })?;

        client.queue_withdrawal(position_id.to_string()).await
    }

    pub async fn complete_withdrawal(
        &self,
        ctx: &Context<'_>,
        position_id: async_graphql::ID,
    ) -> Result<CompleteWithdrawalResponse> {
        let client = ctx
            .data::<EigenLayerClient>()
            .map_err(|_| {
                async_graphql::Error::new("EigenLayer client not found in context")
            })?;

        client.complete_withdrawal(position_id.to_string()).await
    }

    pub async fn claim_rewards(
        &self,
        ctx: &Context<'_>,
        reward_ids: Vec<async_graphql::ID>,
    ) -> Result<ClaimRewardsResponse> {
        let client = ctx
            .data::<EigenLayerClient>()
            .map_err(|_| {
                async_graphql::Error::new("EigenLayer client not found in context")
            })?;

        let ids: Vec<String> = reward_ids.into_iter().map(|id| id.to_string()).collect();

        client.claim_rewards(ids).await
    }

    pub async fn delegate_to_operator(
        &self,
        ctx: &Context<'_>,
        operator_address: String,
        signature: String,
    ) -> Result<bool> {
        let client = ctx
            .data::<EigenLayerClient>()
            .map_err(|_| {
                async_graphql::Error::new("EigenLayer client not found in context")
            })?;

        let user_id = ctx
            .data::<String>()
            .map(|id| id.clone())
            .unwrap_or_else(|_| "unknown".to_string());

        client
            .delegate_to_operator(user_id, operator_address, signature)
            .await
    }
}
