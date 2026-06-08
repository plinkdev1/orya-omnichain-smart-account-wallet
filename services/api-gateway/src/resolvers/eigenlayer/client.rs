use async_graphql::Result;
use reqwest;
use serde_json::json;
use super::types::*;

pub struct EigenLayerClient {
    base_url: String,
    client: reqwest::Client,
}

impl EigenLayerClient {
    pub fn new(base_url: String) -> Self {
        Self {
            base_url,
            client: reqwest::Client::new(),
        }
    }

    pub async fn get_restaking_positions(
        &self,
        user_id: String,
    ) -> Result<RestakingPositionsResponse> {
        let url = format!(
            "{}/positions?user_id={}",
            self.base_url, user_id
        );

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to fetch positions: {}", e)))?
            .json::<RestakingPositionsResponse>()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to parse positions: {}", e)))?;

        Ok(response)
    }

    pub async fn get_operators(
        &self,
        is_active: Option<bool>,
        min_delegated: Option<String>,
    ) -> Result<Vec<EigenLayerOperator>> {
        let mut url = format!("{}/operators", self.base_url);
        let mut params = Vec::new();

        if let Some(active) = is_active {
            params.push(format!("is_active={}", active));
        }

        if let Some(min) = min_delegated {
            params.push(format!("min_delegated={}", min));
        }

        if !params.is_empty() {
            url.push('?');
            url.push_str(&params.join("&"));
        }

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to fetch operators: {}", e)))?
            .json::<Vec<EigenLayerOperator>>()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to parse operators: {}", e)))?;

        Ok(response)
    }

    pub async fn get_rewards(
        &self,
        user_id: String,
        claimed: Option<bool>,
    ) -> Result<RewardsResponse> {
        let mut url = format!(
            "{}/rewards?user_id={}",
            self.base_url, user_id
        );

        if let Some(claimed_filter) = claimed {
            url.push_str(&format!("&claimed={}", claimed_filter));
        }

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to fetch rewards: {}", e)))?
            .json::<RewardsResponse>()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to parse rewards: {}", e)))?;

        Ok(response)
    }

    pub async fn get_strategy_apy(
        &self,
        strategy_address: String,
    ) -> Result<StrategyAPYResponse> {
        let url = format!(
            "{}/strategy-apy?strategy_address={}",
            self.base_url, strategy_address
        );

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to fetch APY: {}", e)))?
            .json::<StrategyAPYResponse>()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to parse APY: {}", e)))?;

        Ok(response)
    }

    pub async fn get_slashing_events(
        &self,
        operator_address: Option<String>,
        limit: Option<i32>,
    ) -> Result<Vec<EigenLayerSlashingEvent>> {
        let mut url = format!("{}/slashing-events", self.base_url);
        let mut params = Vec::new();

        if let Some(addr) = operator_address {
            params.push(format!("operator_address={}", addr));
        }

        if let Some(limit_val) = limit {
            params.push(format!("limit={}", limit_val));
        }

        if !params.is_empty() {
            url.push('?');
            url.push_str(&params.join("&"));
        }

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to fetch events: {}", e)))?
            .json::<Vec<EigenLayerSlashingEvent>>()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to parse events: {}", e)))?;

        Ok(response)
    }

    pub async fn restake_tokens(
        &self,
        user_id: String,
        strategy_address: String,
        amount: String,
        operator_address: Option<String>,
    ) -> Result<RestakeResponse> {
        let url = format!("{}/restake", self.base_url);

        let body = json!({
            "user_id": user_id,
            "strategy_address": strategy_address,
            "amount": amount,
            "operator_address": operator_address.unwrap_or_default()
        });

        let response = self
            .client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to restake: {}", e)))?
            .json::<RestakeResponse>()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to parse restake response: {}", e)))?;

        Ok(response)
    }

    pub async fn queue_withdrawal(
        &self,
        position_id: String,
    ) -> Result<QueueWithdrawalResponse> {
        let url = format!("{}/queue-withdrawal", self.base_url);

        let body = json!({
            "position_id": position_id
        });

        let response = self
            .client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to queue withdrawal: {}", e)))?
            .json::<QueueWithdrawalResponse>()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to parse withdrawal response: {}", e)))?;

        Ok(response)
    }

    pub async fn complete_withdrawal(
        &self,
        position_id: String,
    ) -> Result<CompleteWithdrawalResponse> {
        let url = format!("{}/complete-withdrawal", self.base_url);

        let body = json!({
            "position_id": position_id
        });

        let response = self
            .client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to complete withdrawal: {}", e)))?
            .json::<CompleteWithdrawalResponse>()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to parse complete withdrawal response: {}", e)))?;

        Ok(response)
    }

    pub async fn claim_rewards(
        &self,
        reward_ids: Vec<String>,
    ) -> Result<ClaimRewardsResponse> {
        let url = format!("{}/claim-rewards", self.base_url);

        let body = json!({
            "reward_ids": reward_ids
        });

        let response = self
            .client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to claim rewards: {}", e)))?
            .json::<ClaimRewardsResponse>()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to parse claim response: {}", e)))?;

        Ok(response)
    }

    pub async fn delegate_to_operator(
        &self,
        user_id: String,
        operator_address: String,
        signature: String,
    ) -> Result<bool> {
        let url = format!("{}/delegate", self.base_url);

        let body = json!({
            "user_id": user_id,
            "operator_address": operator_address,
            "signature": signature
        });

        let response = self
            .client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| async_graphql::Error::new(format!("Failed to delegate: {}", e)))?;

        Ok(response.status().is_success())
    }
}
