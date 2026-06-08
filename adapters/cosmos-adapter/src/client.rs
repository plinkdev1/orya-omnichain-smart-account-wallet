use crate::{Config, error::Error, keys::{Account, KeyManager}};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Balance {
    pub denom: String,
    pub amount: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountInfo {
    pub address: String,
    pub balances: Vec<Balance>,
    pub sequence: u64,
    pub account_number: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionResult {
    pub txhash: String,
    pub height: String,
    pub codespace: Option<String>,
    pub code: u32,
    pub raw_log: String,
}

pub struct ChainClient {
    config: Config,
    http_client: reqwest::Client,
    key_manager: KeyManager,
}

impl ChainClient {
    pub fn new(config: Config) -> Self {
        let key_manager = KeyManager::new(
            config.prefix.clone(),
            config.derivation_path.clone(),
        );

        Self {
            config,
            http_client: reqwest::Client::new(),
            key_manager,
        }
    }

    pub fn config(&self) -> &Config {
        &self.config
    }

    pub async fn get_account(&self, address: &str) -> Result<AccountInfo, Error> {
        let url = format!("{}/cosmos/auth/v1beta1/accounts/{}", self.config.rest_url, address);

        let response = self.http_client
            .get(&url)
            .send()
            .await
            .map_err(|e| Error::NetworkError(format!("Failed to fetch account: {}", e)))?;

        if !response.status().is_success() {
            return Err(Error::AccountNotFound(address.to_string()));
        }

        let body: serde_json::Value = response
            .json()
            .await
            .map_err(|e| Error::ParseError(format!("Failed to parse response: {}", e)))?;

        let account = body.get("account")
            .ok_or_else(|| Error::ParseError("No account in response".to_string()))?;

        let sequence = account
            .get("sequence")
            .and_then(|v| v.as_str())
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(0);

        let account_number = account
            .get("account_number")
            .and_then(|v| v.as_str())
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(0);

        Ok(AccountInfo {
            address: address.to_string(),
            balances: vec![],
            sequence,
            account_number,
        })
    }

    pub async fn get_balance(&self, address: &str, denom: &str) -> Result<Balance, Error> {
        let url = format!(
            "{}/cosmos/bank/v1beta1/balances/{}/by_denom?denom={}",
            self.config.rest_url, address, denom
        );

        let response = self.http_client
            .get(&url)
            .send()
            .await
            .map_err(|e| Error::NetworkError(format!("Failed to fetch balance: {}", e)))?;

        if !response.status().is_success() {
            return Err(Error::NetworkError("Failed to query balance".to_string()));
        }

        let body: serde_json::Value = response
            .json()
            .await
            .map_err(|e| Error::ParseError(format!("Failed to parse balance: {}", e)))?;

        let balance = body
            .get("balance")
            .ok_or_else(|| Error::ParseError("No balance in response".to_string()))?;

        let amount = balance
            .get("amount")
            .and_then(|v| v.as_str())
            .ok_or_else(|| Error::ParseError("No amount in balance".to_string()))?
            .to_string();

        Ok(Balance {
            denom: denom.to_string(),
            amount,
        })
    }

    pub async fn get_all_balances(&self, address: &str) -> Result<Vec<Balance>, Error> {
        let url = format!(
            "{}/cosmos/bank/v1beta1/balances/{}",
            self.config.rest_url, address
        );

        let response = self.http_client
            .get(&url)
            .send()
            .await
            .map_err(|e| Error::NetworkError(format!("Failed to fetch balances: {}", e)))?;

        if !response.status().is_success() {
            return Err(Error::NetworkError("Failed to query balances".to_string()));
        }

        let body: serde_json::Value = response
            .json()
            .await
            .map_err(|e| Error::ParseError(format!("Failed to parse balances: {}", e)))?;

        let balances_array = body
            .get("balances")
            .and_then(|v| v.as_array())
            .ok_or_else(|| Error::ParseError("No balances array".to_string()))?;

        let balances = balances_array
            .iter()
            .filter_map(|b| {
                let denom = b.get("denom").and_then(|v| v.as_str())?;
                let amount = b.get("amount").and_then(|v| v.as_str())?;
                Some(Balance {
                    denom: denom.to_string(),
                    amount: amount.to_string(),
                })
            })
            .collect();

        Ok(balances)
    }

    pub fn create_account_from_mnemonic(&self, mnemonic: &str, index: u32) -> Result<Account, Error> {
        self.key_manager.from_mnemonic(mnemonic, index)
    }

    pub fn create_account_from_private_key(&self, private_key: &str) -> Result<Account, Error> {
        self.key_manager.from_private_key(private_key)
    }

    pub fn generate_mnemonic(&self) -> Result<String, Error> {
        KeyManager::generate_mnemonic()
    }

    pub async fn broadcast_tx(&self, tx_bytes: &[u8]) -> Result<TransactionResult, Error> {
        let tx_base64 = base64::encode(tx_bytes);
        let payload = serde_json::json!({
            "tx_bytes": tx_base64,
            "mode": "BROADCAST_MODE_SYNC"
        });

        let url = format!("{}/cosmos/tx/v1beta1/txs", self.config.rest_url);

        let response = self.http_client
            .post(&url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| Error::NetworkError(format!("Failed to broadcast: {}", e)))?;

        let body: serde_json::Value = response
            .json()
            .await
            .map_err(|e| Error::ParseError(format!("Failed to parse response: {}", e)))?;

        let txhash = body
            .get("tx_response")
            .and_then(|v| v.get("txhash"))
            .and_then(|v| v.as_str())
            .ok_or_else(|| Error::ParseError("No txhash in response".to_string()))?
            .to_string();

        let height = body
            .get("tx_response")
            .and_then(|v| v.get("height"))
            .and_then(|v| v.as_str())
            .unwrap_or("0")
            .to_string();

        let code = body
            .get("tx_response")
            .and_then(|v| v.get("code"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0) as u32;

        let raw_log = body
            .get("tx_response")
            .and_then(|v| v.get("raw_log"))
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        Ok(TransactionResult {
            txhash,
            height,
            codespace: None,
            code,
            raw_log,
        })
    }

    pub async fn estimate_gas(&self, from: &str, to: &str, amount: &str) -> Result<u64, Error> {
        let gas_estimate = (amount.parse::<u64>()
            .unwrap_or(100000) / 1000000).max(100000);
        Ok((gas_estimate as f64 * self.config.gas_adjustment).ceil() as u64)
    }
}
