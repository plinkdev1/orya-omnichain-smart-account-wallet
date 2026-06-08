use crate::config::Config;
use crate::error::CardanoAdapterError;
use serde::{Deserialize, Serialize};
use reqwest::Client as HttpClient;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CardanoAccount {
    pub address: String,
    pub public_key: String,
    pub balance: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionRequest {
    pub to_address: String,
    pub amount: u64,
    pub fee: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignedTransaction {
    pub tx_id: String,
    pub tx_hash: String,
    pub signature: String,
}

pub struct CardanoClient {
    config: Config,
    account: Arc<RwLock<Option<CardanoAccount>>>,
    http_client: HttpClient,
    connecting: Arc<RwLock<bool>>,
}

impl CardanoClient {
    pub fn new(config: Config) -> Self {
        CardanoClient {
            config,
            account: Arc::new(RwLock::new(None)),
            http_client: HttpClient::new(),
            connecting: Arc::new(RwLock::new(false)),
        }
    }

    pub fn get_config(&self) -> &Config {
        &self.config
    }

    pub async fn connect_wallet(&self) -> Result<CardanoAccount, CardanoAdapterError> {
        let mut connecting = self.connecting.write().await;
        if *connecting {
            return Err(CardanoAdapterError::ConnectionInProgress);
        }
        *connecting = true;

        let result = async {
            Ok::<CardanoAccount, CardanoAdapterError>(CardanoAccount {
                address: "addr1_placeholder".to_string(),
                public_key: "pk_placeholder".to_string(),
                balance: "0".to_string(),
            })
        }
        .await;

        *connecting = false;
        
        if let Ok(account) = &result {
            *self.account.write().await = Some(account.clone());
        }

        result
    }

    pub async fn disconnect_wallet(&self) -> Result<(), CardanoAdapterError> {
        *self.account.write().await = None;
        Ok(())
    }

    pub async fn get_connected_account(&self) -> Option<CardanoAccount> {
        self.account.read().await.clone()
    }

    pub async fn get_balance(&self, address: Option<&str>) -> Result<String, CardanoAdapterError> {
        let target_address = if let Some(addr) = address {
            addr.to_string()
        } else if let Some(account) = self.account.read().await.as_ref() {
            account.address.clone()
        } else {
            return Err(CardanoAdapterError::WalletNotConnected);
        };

        self.fetch_balance(&target_address)
            .await
            .map_err(|e| CardanoAdapterError::BalanceFetchFailed(e.to_string()))
    }

    pub async fn create_transaction(
        &self,
        _request: TransactionRequest,
    ) -> Result<SignedTransaction, CardanoAdapterError> {
        if self.account.read().await.is_none() {
            return Err(CardanoAdapterError::WalletNotConnected);
        }

        Ok(SignedTransaction {
            tx_id: "tx_id_placeholder".to_string(),
            tx_hash: "tx_hash_placeholder".to_string(),
            signature: "signature_placeholder".to_string(),
        })
    }

    pub async fn sign_message(
        &self,
        _message: &str,
    ) -> Result<String, CardanoAdapterError> {
        if self.account.read().await.is_none() {
            return Err(CardanoAdapterError::WalletNotConnected);
        }

        Ok("signature_placeholder".to_string())
    }

    pub async fn sign_transaction(
        &self,
        _tx: &SignedTransaction,
    ) -> Result<SignedTransaction, CardanoAdapterError> {
        if self.account.read().await.is_none() {
            return Err(CardanoAdapterError::WalletNotConnected);
        }

        Ok(SignedTransaction {
            tx_id: "tx_id_placeholder".to_string(),
            tx_hash: "tx_hash_placeholder".to_string(),
            signature: "signature_placeholder".to_string(),
        })
    }

    pub async fn broadcast_transaction(
        &self,
        _tx: &SignedTransaction,
    ) -> Result<String, CardanoAdapterError> {
        Ok("tx_hash_placeholder".to_string())
    }

    async fn fetch_balance(&self, _address: &str) -> Result<String, Box<dyn std::error::Error>> {
        Ok("0".to_string())
    }
}
