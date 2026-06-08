use async_graphql::Result;
use reqwest;
use serde_json::json;
use super::types::*;

pub struct ChainbaseClient {
    base_url: String,
    client: reqwest::Client,
}

impl ChainbaseClient {
    pub fn new(base_url: String) -> Self {
        Self {
            base_url,
            client: reqwest::Client::new(),
        }
    }

    pub async fn get_balance(
        &self,
        address: String,
        chain_id: String,
    ) -> Result<ChainbaseBalanceResponse> {
        let url = format!(
            "{}/balance?address={}&chain_id={}",
            self.base_url, address, chain_id
        );

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to fetch balance: {}", e)))?
            .json::<ChainbaseBalanceResponse>()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to parse balance: {}", e)))?;

        Ok(response)
    }

    pub async fn get_transactions(
        &self,
        address: String,
        chain_id: String,
        limit: Option<u32>,
        offset: Option<u32>,
    ) -> Result<ChainbaseTransactionsResponse> {
        let limit = limit.unwrap_or(20);
        let offset = offset.unwrap_or(0);
        let url = format!(
            "{}/transactions?address={}&chain_id={}&limit={}&offset={}",
            self.base_url, address, chain_id, limit, offset
        );

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| {
                async_graphql::Error::new(format!("Failed to fetch transactions: {}", e))
            })?
            .json::<ChainbaseTransactionsResponse>()
            .await
            .map_err(|e| {
                async_graphql::Error::new(format!("Failed to parse transactions: {}", e))
            })?;

        Ok(response)
    }

    pub async fn get_tvl(
        &self,
        chain_id: String,
        protocol: String,
    ) -> Result<ChainbaseTVL> {
        let url = format!(
            "{}/tvl?chain_id={}&protocol={}",
            self.base_url, chain_id, protocol
        );

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to fetch TVL: {}", e)))?
            .json::<ChainbaseTVL>()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to parse TVL: {}", e)))?;

        Ok(response)
    }

    pub async fn get_analytics(
        &self,
        address: String,
        chain_id: String,
    ) -> Result<ChainbaseAnalytics> {
        let url = format!(
            "{}/analytics?address={}&chain_id={}",
            self.base_url, address, chain_id
        );

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to fetch analytics: {}", e)))?
            .json::<ChainbaseAnalytics>()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to parse analytics: {}", e)))?;

        Ok(response)
    }

    pub async fn list_supported_chains(&self) -> Result<Vec<ChainInfo>> {
        let url = format!("{}/chains", self.base_url);

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| {
                async_graphql::Error::new(format!("Failed to fetch supported chains: {}", e))
            })?
            .json::<Vec<ChainInfo>>()
            .await
            .map_err(|e| {
                async_graphql::Error::new(format!("Failed to parse supported chains: {}", e))
            })?;

        Ok(response)
    }

    pub async fn sync_data(
        &self,
        chain_id: String,
        address: String,
    ) -> Result<bool> {
        let url = format!("{}/sync", self.base_url);

        let response = self
            .client
            .post(&url)
            .json(&json!({
                "chain_id": chain_id,
                "address": address
            }))
            .send()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to sync data: {}", e)))?;

        if response.status().is_success() {
            Ok(true)
        } else {
            Err(async_graphql::Error::new(format!(
                "Sync failed with status: {}",
                response.status()
            )))
        }
    }
}
