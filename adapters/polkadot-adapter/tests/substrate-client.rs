#[cfg(test)]
mod tests {
    use polkadot_adapter::{Config, SubstrateClient, SubstrateAdapterError};

    #[tokio::test]
    async fn test_config_load() {
        let config = Config::load();
        assert!(!config.network.is_empty());
        assert_eq!(config.network, "polkadot");
    }

    #[tokio::test]
    async fn test_client_creation() {
        let config = Config::load();
        let client = SubstrateClient::new(config);
        assert!(client.get_connected_account().await.is_none());
    }

    #[tokio::test]
    async fn test_wallet_not_connected_error() {
        let config = Config::load();
        let client = SubstrateClient::new(config);
        
        let result = client.get_balance(None).await;
        assert!(result.is_err());
        match result.unwrap_err() {
            SubstrateAdapterError::WalletNotConnected => (),
            _ => panic!("Expected WalletNotConnected error"),
        }
    }

    #[tokio::test]
    async fn test_sign_message_without_wallet() {
        let config = Config::load();
        let client = SubstrateClient::new(config);
        
        let result = client.sign_message("test").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_sign_transaction_without_wallet() {
        let config = Config::load();
        let client = SubstrateClient::new(config);
        let tx = polkadot_adapter::SignedTransaction {
            tx_id: "test".to_string(),
            tx_hash: "test".to_string(),
            signature: "test".to_string(),
        };
        
        let result = client.sign_transaction(&tx).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_disconnect_wallet() {
        let config = Config::load();
        let client = SubstrateClient::new(config);
        
        let result = client.disconnect_wallet().await;
        assert!(result.is_ok());
        assert!(client.get_connected_account().await.is_none());
    }

    #[tokio::test]
    async fn test_config_polkadot_network() {
        let config = Config::load();
        assert_eq!(config.network, "polkadot");
        assert!(config.rpc_url.contains("polkadot"));
        assert_eq!(config.ss58_prefix, 0);
    }

    #[tokio::test]
    async fn test_broadcast_transaction() {
        let config = Config::load();
        let client = SubstrateClient::new(config);
        let tx = polkadot_adapter::SignedTransaction {
            tx_id: "test".to_string(),
            tx_hash: "test".to_string(),
            signature: "test".to_string(),
        };
        
        let result = client.broadcast_transaction(&tx).await;
        assert!(result.is_ok());
    }
}
