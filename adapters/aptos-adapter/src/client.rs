use crate::{Config, Error};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::fmt::Write;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletInfo {
    pub address: String,
    pub public_key: String,
    pub balance: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionResult {
    pub hash: String,
    pub success: bool,
    pub gas_used: u64,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwapRoute {
    pub from_coin: String,
    pub to_coin: String,
    pub amount_in: String,
    pub amount_out_min: String,
    pub path: Vec<String>,
}

pub struct ChainClient {
    config: Config,
    client: reqwest::Client,
}

impl ChainClient {
    pub fn new(config: Config) -> Self {
        Self {
            config,
            client: reqwest::Client::new(),
        }
    }

    pub fn config(&self) -> &Config {
        &self.config
    }

    pub async fn get_wallet_info(&self, address: &str) -> Result<WalletInfo, Error> {
        let url = format!("{}/accounts/{}", self.config.rpc_url, address);
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

        let balance = data
            .get("data")
            .and_then(|d| d.get("coins"))
            .map(|c| c.to_string())
            .unwrap_or_default();

        Ok(WalletInfo {
            address: address.to_string(),
            public_key: String::new(),
            balance,
        })
    }

    pub async fn get_coin_balance(&self, address: &str, coin_type: &str) -> Result<String, Error> {
        let url = format!(
            "{}/accounts/{}/resources",
            self.config.rpc_url, address
        );
        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| Error::NetworkError(e.to_string()))?;

        let resources: Vec<serde_json::Value> = response
            .json()
            .await
            .map_err(|e| Error::ParseError(e.to_string()))?;

        for resource in resources {
            if let Some(r#type) = resource.get("type").and_then(|t| t.as_str()) {
                if r#type.contains(coin_type) {
                    if let Some(coin) = resource
                        .get("data")
                        .and_then(|d| d.get("coin"))
                        .and_then(|c| c.get("value"))
                    {
                        return Ok(coin.to_string());
                    }
                }
            }
        }

        Ok("0".to_string())
    }

    pub async fn create_transaction(
        &self,
        sender: &str,
        receiver: &str,
        amount: &str,
        gas_limit: u64,
    ) -> Result<String, Error> {
        let payload = serde_json::json!({
            "function": "0x1::coin::transfer",
            "type_arguments": ["0x1::aptos_coin::AptosCoin"],
            "arguments": [receiver, amount]
        });

        let tx_payload = serde_json::json!({
            "type": "entry_function_payload",
            "function": "0x1::coin::transfer",
            "type_arguments": ["0x1::aptos_coin::AptosCoin"],
            "arguments": [receiver, amount]
        });

        let transaction = serde_json::json!({
            "sender": sender,
            "sequence_number": "0",
            "max_gas_amount": gas_limit.to_string(),
            "gas_unit_price": "100",
            "expiration_timestamp_secs": (std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs() + 600)
                .to_string(),
            "payload": tx_payload
        });

        Ok(serde_json::to_string(&transaction)
            .map_err(|e| Error::ParseError(e.to_string()))?)
    }

    pub async fn estimate_gas(
        &self,
        _sender: &str,
        _receiver: &str,
        _amount: &str,
    ) -> Result<u64, Error> {
        Ok(1000)
    }

    pub async fn get_transaction_status(&self, tx_hash: &str) -> Result<TransactionResult, Error> {
        let url = format!("{}/transactions/{}", self.config.rpc_url, tx_hash);
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

        let success = data
            .get("success")
            .and_then(|s| s.as_bool())
            .unwrap_or(false);

        let gas_used = data
            .get("gas_used")
            .and_then(|g| g.as_str())
            .and_then(|g| g.parse().ok())
            .unwrap_or(0);

        Ok(TransactionResult {
            hash: tx_hash.to_string(),
            success,
            gas_used,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        })
    }
}
