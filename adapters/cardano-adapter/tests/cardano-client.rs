#[cfg(test)]
mod tests {
    use cardano_adapter::{Config, CardanoClient, CardanoAdapterError};

    #[tokio::test]
    async fn test_config_load() {
        let config = Config::load();
        assert!(!config.network.is_empty());
        assert_eq!(config.network, "mainnet");
    }

    #[tokio::test]
    async fn test_client_creation() {
        let config = Config::load();
        let client = CardanoClient::new(config);
        assert!(client.get_connected_account().await.is_none());
    }

    #[tokio::test]
    async fn test_wallet_not_connected_error() {
        let config = Config::load();
        let client = CardanoClient::new(config);
        
        let result = client.get_balance(None).await;
        assert!(result.is_err());
        match result.unwrap_err() {
            CardanoAdapterError::WalletNotConnected => (),
            _ => panic!("Expected WalletNotConnected error"),
        }
    }

    #[tokio::test]
    async fn test_sign_message_without_wallet() {
        let config = Config::load();
        let client = CardanoClient::new(config);
        
        let result = client.sign_message("test").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_sign_transaction_without_wallet() {
        let config = Config::load();
        let client = CardanoClient::new(config);
        let tx = cardano_adapter::SignedTransaction {
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
        let client = CardanoClient::new(config);
        
        let result = client.disconnect_wallet().await;
        assert!(result.is_ok());
        assert!(client.get_connected_account().await.is_none());
    }

    #[tokio::test]
    async fn test_config_networks() {
        let config_mainnet = Config::load();
        assert_eq!(config_mainnet.network, "mainnet");
        assert!(config_mainnet.blockfrost_url.contains("mainnet"));
    }
}
