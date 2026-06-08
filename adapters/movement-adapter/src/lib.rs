pub mod config;
pub mod client;
pub mod error;
pub mod bridge;

pub use config::Config;
pub use client::{ChainClient, WalletInfo, TransactionResult, BridgeRoute, BridgeStatus};
pub use error::Error;
pub use bridge::{BridgeClient, BridgeConfig, BridgeFee};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_module_loads() {
        assert!(true);
    }

    #[test]
    fn test_config_creation() {
        let config = Config {
            network: "devnet".to_string(),
            rpc_url: "https://devnet.movement.io/v1".to_string(),
            chain_id: 30,
        };
        assert_eq!(config.network, "devnet");
    }
}
