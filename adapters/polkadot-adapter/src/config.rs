use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubstrateNetworkConfig {
    pub name: String,
    pub chain_id: u32,
    pub ss58_prefix: u32,
    pub rpc_url: String,
    pub explorer_url: String,
}

pub const SUBSTRATE_NETWORKS: &[(&str, SubstrateNetworkConfig)] = &[
    (
        "polkadot",
        SubstrateNetworkConfig {
            name: "polkadot".to_string(),
            chain_id: 0,
            ss58_prefix: 0,
            rpc_url: "wss://rpc.polkadot.io".to_string(),
            explorer_url: "https://polkadot.subscan.io".to_string(),
        },
    ),
    (
        "kusama",
        SubstrateNetworkConfig {
            name: "kusama".to_string(),
            chain_id: 1,
            ss58_prefix: 2,
            rpc_url: "wss://kusama-rpc.polkadot.io".to_string(),
            explorer_url: "https://kusama.subscan.io".to_string(),
        },
    ),
    (
        "rococo",
        SubstrateNetworkConfig {
            name: "rococo".to_string(),
            chain_id: 2,
            ss58_prefix: 42,
            rpc_url: "wss://rococo-rpc.polkadot.io".to_string(),
            explorer_url: "https://rococo.subscan.io".to_string(),
        },
    ),
    (
        "westend",
        SubstrateNetworkConfig {
            name: "westend".to_string(),
            chain_id: 3,
            ss58_prefix: 42,
            rpc_url: "wss://westend-rpc.polkadot.io".to_string(),
            explorer_url: "https://westend.subscan.io".to_string(),
        },
    ),
];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub network: String,
    pub chain_id: u32,
    pub ss58_prefix: u32,
    pub rpc_url: String,
    pub explorer_url: String,
}

impl Config {
    pub fn load() -> Self {
        let network = std::env::var("NETWORK").unwrap_or_else(|_| "polkadot".to_string());
        let network_config = SUBSTRATE_NETWORKS
            .iter()
            .find(|(name, _)| name == &network)
            .map(|(_, config)| config.clone())
            .unwrap_or_else(|| {
                SUBSTRATE_NETWORKS
                    .iter()
                    .find(|(name, _)| *name == "polkadot")
                    .unwrap()
                    .1
                    .clone()
            });

        Config {
            network: network_config.name,
            chain_id: network_config.chain_id,
            ss58_prefix: network_config.ss58_prefix,
            rpc_url: std::env::var("RPC_URL")
                .unwrap_or_else(|_| network_config.rpc_url),
            explorer_url: std::env::var("EXPLORER_URL")
                .unwrap_or_else(|_| network_config.explorer_url),
        }
    }
}
