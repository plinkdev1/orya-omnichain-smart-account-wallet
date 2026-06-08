use crate::config::Config;
use crate::error::SubstrateAdapterError;
use serde::{Deserialize, Serialize};
use reqwest::Client as HttpClient;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubstrateAccount {
    pub address: String,
    pub public_key: String,
    pub balance: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionRequest {
    pub to_address: String,
    pub amount: u128,
    pub fee: Option<u128>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignedTransaction {
    pub tx_id: String,
    pub tx_hash: String,
    pub signature: String,
}

pub struct SubstrateClient {
    config: Config,
    account: Arc<RwLock<Option<SubstrateAccount>>>,
    http_client: HttpClient,
    connecting: Arc<RwLock<bool>>,
}

impl SubstrateClient {
    pub fn new(config: Config) -> Self {
        SubstrateClient {
            config,
            account: Arc::new(RwLock::new(None)),
            http_client: HttpClient::new(),
            connecting: Arc::new(RwLock::new(false)),
        }
    }

    pub fn get_config(&self) -> &Config {
        &self.config
    }

    pub async fn connect_wallet(&self) -> Result<SubstrateAccount, SubstrateAdapterError> {
        let mut connecting = self.connecting.write().await;
        if *connecting {
            return Err(SubstrateAdapterError::ConnectionInProgress);
        }
        *connecting = true;

        let result = async {
            Ok::<SubstrateAccount, SubstrateAdapterError>(SubstrateAccount {
                address: "1TLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL".to_string(),
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

    pub async fn disconnect_wallet(&self) -> Result<(), SubstrateAdapterError> {
        *self.account.write().await = None;
        Ok(())
    }

    pub async fn get_connected_account(&self) -> Option<SubstrateAccount> {
        self.account.read().await.clone()
    }

    pub async fn get_balance(&self, address: Option<&str>) -> Result<String, SubstrateAdapterError> {
        let target_address = if let Some(addr) = address {
            addr.to_string()
        } else if let Some(account) = self.account.read().await.as_ref() {
            account.address.clone()
        } else {
            return Err(SubstrateAdapterError::WalletNotConnected);
        };

        self.fetch_balance(&target_address)
            .await
            .map_err(|e| SubstrateAdapterError::BalanceFetchFailed(e.to_string()))
    }

    pub async fn create_transaction(
        &self,
        _request: TransactionRequest,
    ) -> Result<SignedTransaction, SubstrateAdapterError> {
        if self.account.read().await.is_none() {
            return Err(SubstrateAdapterError::WalletNotConnected);
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
    ) -> Result<String, SubstrateAdapterError> {
        if self.account.read().await.is_none() {
            return Err(SubstrateAdapterError::WalletNotConnected);
        }

        Ok("signature_placeholder".to_string())
    }

    pub async fn sign_transaction(
        &self,
        _tx: &SignedTransaction,
    ) -> Result<SignedTransaction, SubstrateAdapterError> {
        if self.account.read().await.is_none() {
            return Err(SubstrateAdapterError::WalletNotConnected);
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
    ) -> Result<String, SubstrateAdapterError> {
        Ok("tx_hash_placeholder".to_string())
    }

    async fn fetch_balance(&self, _address: &str) -> Result<String, Box<dyn std::error::Error>> {
        Ok("0".to_string())
    }
}
