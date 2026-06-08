pub mod config;
pub mod client;
pub mod error;
pub mod dex;

pub use config::Config;
pub use client::{ChainClient, WalletInfo, TransactionResult, SwapRoute};
pub use error::Error;
pub use dex::{AuxClient, PontemClient, Pool, SwapQuote};

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
            network: "testnet".to_string(),
            rpc_url: "https://fullnode.testnet.aptoslabs.com/v1".to_string(),
            chain_id: 2,
        };
        assert_eq!(config.network, "testnet");
    }
}
