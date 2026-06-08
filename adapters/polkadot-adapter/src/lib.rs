pub mod config;
pub mod client;
pub mod error;

pub use config::{Config, SubstrateNetworkConfig, SUBSTRATE_NETWORKS};
pub use client::{SubstrateClient, SubstrateAccount, TransactionRequest, SignedTransaction};
pub use error::SubstrateAdapterError;

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
