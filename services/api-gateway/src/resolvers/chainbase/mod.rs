use async_graphql::{Context, Object, Result};
use crate::resolvers::chainbase::client::ChainbaseClient;

pub mod types;
pub mod client;
#[cfg(test)]
mod tests;
pub use types::*;

#[derive(Default)]
pub struct ChainbaseQuery;

#[Object]
impl ChainbaseQuery {
    pub async fn chainbase_balance(
        &self,
        ctx: &Context<'_>,
        address: String,
        chain_id: String,
    ) -> Result<ChainbaseBalanceResponse> {
        let client = ctx
            .data::<ChainbaseClient>()
            .map_err(|_| {
                async_graphql::Error::new("Chainbase client not found in context")
            })?;

        client.get_balance(address, chain_id).await
    }

    pub async fn chainbase_transactions(
        &self,
        ctx: &Context<'_>,
        address: String,
        chain_id: String,
        limit: Option<u32>,
        offset: Option<u32>,
    ) -> Result<ChainbaseTransactionsResponse> {
        let client = ctx
            .data::<ChainbaseClient>()
            .map_err(|_| {
                async_graphql::Error::new("Chainbase client not found in context")
            })?;

        client
            .get_transactions(address, chain_id, limit, offset)
            .await
    }

    pub async fn chainbase_tvl(
        &self,
        ctx: &Context<'_>,
        chain_id: String,
        protocol: String,
    ) -> Result<ChainbaseTVL> {
        let client = ctx
            .data::<ChainbaseClient>()
            .map_err(|_| {
                async_graphql::Error::new("Chainbase client not found in context")
            })?;

        client.get_tvl(chain_id, protocol).await
    }

    pub async fn chainbase_analytics(
        &self,
        ctx: &Context<'_>,
        address: String,
        chain_id: String,
    ) -> Result<ChainbaseAnalytics> {
        let client = ctx
            .data::<ChainbaseClient>()
            .map_err(|_| {
                async_graphql::Error::new("Chainbase client not found in context")
            })?;

        client.get_analytics(address, chain_id).await
    }

    pub async fn chainbase_supported_chains(
        &self,
        ctx: &Context<'_>,
    ) -> Result<Vec<ChainInfo>> {
        let client = ctx
            .data::<ChainbaseClient>()
            .map_err(|_| {
                async_graphql::Error::new("Chainbase client not found in context")
            })?;

        client.list_supported_chains().await
    }
}

#[derive(Default)]
pub struct ChainbaseMutation;

#[Object]
impl ChainbaseMutation {
    pub async fn sync_chainbase_data(
        &self,
        ctx: &Context<'_>,
        chain_id: String,
        address: String,
    ) -> Result<bool> {
        let client = ctx
            .data::<ChainbaseClient>()
            .map_err(|_| {
                async_graphql::Error::new("Chainbase client not found in context")
            })?;

        client.sync_data(chain_id, address).await
    }
}
