pub mod config;
pub mod client;
pub mod error;

pub use config::{Config, CardanoNetworkConfig, CARDANO_NETWORKS};
pub use client::{CardanoClient, CardanoAccount, TransactionRequest, SignedTransaction};
pub use error::CardanoAdapterError;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_module_loads() {
        assert!(true);
    }

    #[test]
    fn test_config_load() {
        let config = Config::load();
        assert!(!config.network.is_empty());
    }
}
