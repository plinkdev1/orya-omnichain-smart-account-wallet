pub mod config;
pub mod client;
pub mod error;
pub mod keys;
pub mod cosmos_kit;

pub use config::Config;
pub use client::{ChainClient, Balance, AccountInfo, TransactionResult};
pub use error::Error;
pub use keys::{Account, KeyManager};
pub use cosmos_kit::{CosmosKitClient, CosmosKitConfig, WalletConnectSession, WalletType};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_module_loads() {
        assert!(true);
    }

    #[test]
    fn test_config_mainnet() {
        let config = Config::mainnet();
        assert_eq!(config.chain_id, "cosmoshub-4");
        assert_eq!(config.network, "mainnet");
    }

    #[test]
    fn test_config_testnet() {
        let config = Config::testnet();
        assert_eq!(config.chain_id, "theta-testnet-001");
        assert_eq!(config.network, "testnet");
    }
}
