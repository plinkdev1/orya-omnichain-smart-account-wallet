use crate::{Error, client::{BridgeRoute, BridgeStatus}};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeConfig {
    pub gateway_url: String,
    pub supported_chains: Vec<String>,
    pub min_amount: String,
    pub max_amount: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeFee {
    pub base_fee: String,
    pub percentage_fee: String,
    pub total_fee: String,
}

pub struct BridgeClient {
    config: BridgeConfig,
    client: reqwest::Client,
}

impl BridgeClient {
    pub fn new(config: BridgeConfig) -> Self {
        Self {
            config,
            client: reqwest::Client::new(),
        }
    }

    pub async fn get_supported_chains(&self) -> Result<Vec<String>, Error> {
        Ok(self.config.supported_chains.clone())
    }

    pub async fn get_bridge_fee(
        &self,
        source_chain: &str,
        destination_chain: &str,
        token: &str,
        amount: &str,
    ) -> Result<BridgeFee, Error> {
        let url = format!(
            "{}/bridge/fee?source={}&destination={}&token={}&amount={}",
            self.config.gateway_url, source_chain, destination_chain, token, amount
        );

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| Error::NetworkError(e.to_string()))?;

        let data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| Error::ParseError(e.to_string()))?;

        let base_fee = data
            .get("base_fee")
            .and_then(|f| f.as_str())
            .unwrap_or("0")
            .to_string();

        let percentage_fee = data
            .get("percentage_fee")
            .and_then(|f| f.as_str())
            .unwrap_or("0")
            .to_string();

        let total_fee = data
            .get("total_fee")
            .and_then(|f| f.as_str())
            .unwrap_or("0")
            .to_string();

        Ok(BridgeFee {
            base_fee,
            percentage_fee,
            total_fee,
        })
    }

    pub async fn get_bridge_routes(
        &self,
        source_chain: &str,
        destination_chain: &str,
    ) -> Result<Vec<BridgeRoute>, Error> {
        let url = format!(
            "{}/bridge/routes?source={}&destination={}",
            self.config.gateway_url, source_chain, destination_chain
        );

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| Error::NetworkError(e.to_string()))?;

        let routes: Vec<serde_json::Value> = response
            .json()
            .await
            .map_err(|e| Error::ParseError(e.to_string()))?;

        let bridge_routes = routes
            .iter()
            .map(|route| {
                BridgeRoute {
                    source_chain: source_chain.to_string(),
                    destination_chain: destination_chain.to_string(),
                    token: route
                        .get("token")
                        .and_then(|t| t.as_str())
                        .unwrap_or("")
                        .to_string(),
                    amount: route
                        .get("amount")
                        .and_then(|a| a.as_str())
                        .unwrap_or("0")
                        .to_string(),
                    fee: route
                        .get("fee")
                        .and_then(|f| f.as_str())
                        .unwrap_or("0")
                        .to_string(),
                }
            })
            .collect();

        Ok(bridge_routes)
    }

    pub async fn initiate_bridge(
        &self,
        source_chain: &str,
        destination_chain: &str,
        token: &str,
        recipient: &str,
        amount: &str,
    ) -> Result<String, Error> {
        let payload = serde_json::json!({
            "source_chain": source_chain,
            "destination_chain": destination_chain,
            "token": token,
            "recipient": recipient,
            "amount": amount,
            "timestamp": std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs()
        });

        let response = self
            .client
            .post(format!("{}/bridge/initiate", self.config.gateway_url))
            .json(&payload)
            .send()
            .await
            .map_err(|e| Error::NetworkError(e.to_string()))?;

        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| Error::ParseError(e.to_string()))?;

        result
            .get("bridge_id")
            .and_then(|id| id.as_str())
            .map(|id| id.to_string())
            .ok_or_else(|| Error::ParseError("No bridge_id in response".to_string()))
    }

    pub async fn get_bridge_status(&self, bridge_id: &str) -> Result<BridgeStatus, Error> {
        let url = format!("{}/bridge/status/{}", self.config.gateway_url, bridge_id);

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| Error::NetworkError(e.to_string()))?;

        let data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| Error::ParseError(e.to_string()))?;

        let status_str = data
            .get("status")
            .and_then(|s| s.as_str())
            .unwrap_or("unknown")
            .to_string();

        let estimated_completion = data
            .get("estimated_completion")
            .and_then(|t| t.as_str())
            .and_then(|t| t.parse().ok())
            .unwrap_or(0);

        Ok(BridgeStatus {
            tx_hash: bridge_id.to_string(),
            status: status_str,
            source_chain: data
                .get("source_chain")
                .and_then(|c| c.as_str())
                .unwrap_or("")
                .to_string(),
            destination_chain: data
                .get("destination_chain")
                .and_then(|c| c.as_str())
                .unwrap_or("")
                .to_string(),
            estimated_completion,
        })
    }

    pub async fn get_bridge_history(
        &self,
        address: &str,
        limit: u32,
    ) -> Result<Vec<BridgeStatus>, Error> {
        let url = format!(
            "{}/bridge/history/{}?limit={}",
            self.config.gateway_url, address, limit
        );

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| Error::NetworkError(e.to_string()))?;

        let history: Vec<serde_json::Value> = response
            .json()
            .await
            .map_err(|e| Error::ParseError(e.to_string()))?;

        let statuses = history
            .iter()
            .map(|item| {
                BridgeStatus {
                    tx_hash: item
                        .get("id")
                        .and_then(|id| id.as_str())
                        .unwrap_or("")
                        .to_string(),
                    status: item
                        .get("status")
                        .and_then(|s| s.as_str())
                        .unwrap_or("unknown")
                        .to_string(),
                    source_chain: item
                        .get("source_chain")
                        .and_then(|c| c.as_str())
                        .unwrap_or("")
                        .to_string(),
                    destination_chain: item
                        .get("destination_chain")
                        .and_then(|c| c.as_str())
                        .unwrap_or("")
                        .to_string(),
                    estimated_completion: item
                        .get("estimated_completion")
                        .and_then(|t| t.as_str())
                        .and_then(|t| t.parse().ok())
                        .unwrap_or(0),
                }
            })
            .collect();

        Ok(statuses)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bridge_fee_creation() {
        let fee = BridgeFee {
            base_fee: "100".to_string(),
            percentage_fee: "0.25".to_string(),
            total_fee: "100.25".to_string(),
        };
        assert_eq!(fee.base_fee, "100");
    }

    #[test]
    fn test_bridge_config_creation() {
        let config = BridgeConfig {
            gateway_url: "https://bridge.movement.io".to_string(),
            supported_chains: vec!["movement".to_string(), "ethereum".to_string()],
            min_amount: "1".to_string(),
            max_amount: "1000000".to_string(),
        };
        assert_eq!(config.supported_chains.len(), 2);
    }
}
