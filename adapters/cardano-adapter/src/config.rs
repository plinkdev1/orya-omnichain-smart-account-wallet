use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CardanoNetworkConfig {
    pub name: String,
    pub network_id: u32,
    pub protocol_magic: u32,
    pub kupo_url: String,
    pub blockfrost_url: String,
    pub blockfrost_api_key: String,
    pub explorer_url: String,
}

pub const CARDANO_NETWORKS: &[(&str, CardanoNetworkConfig)] = &[
    (
        "mainnet",
        CardanoNetworkConfig {
            name: "mainnet".to_string(),
            network_id: 1,
            protocol_magic: 764824073,
            kupo_url: "https://kupo.blockfrost.io".to_string(),
            blockfrost_url: "https://cardano-mainnet.blockfrost.io/api/v0".to_string(),
            blockfrost_api_key: "".to_string(),
            explorer_url: "https://cardanoscan.io".to_string(),
        },
    ),
    (
        "preview",
        CardanoNetworkConfig {
            name: "preview".to_string(),
            network_id: 0,
            protocol_magic: 2,
            kupo_url: "https://kupo.blockfrost.io/preview".to_string(),
            blockfrost_url: "https://cardano-preview.blockfrost.io/api/v0".to_string(),
            blockfrost_api_key: "".to_string(),
            explorer_url: "https://preview.cardanoscan.io".to_string(),
        },
    ),
    (
        "preprod",
        CardanoNetworkConfig {
            name: "preprod".to_string(),
            network_id: 0,
            protocol_magic: 1,
            kupo_url: "https://kupo.blockfrost.io/preprod".to_string(),
            blockfrost_url: "https://cardano-preprod.blockfrost.io/api/v0".to_string(),
            blockfrost_api_key: "".to_string(),
            explorer_url: "https://preprod.cardanoscan.io".to_string(),
        },
    ),
];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub network: String,
    pub network_id: u32,
    pub protocol_magic: u32,
    pub kupo_url: String,
    pub blockfrost_url: String,
    pub blockfrost_api_key: String,
    pub explorer_url: String,
}

impl Config {
    pub fn load() -> Self {
        let network = std::env::var("NETWORK").unwrap_or_else(|_| "mainnet".to_string());
        let network_config = CARDANO_NETWORKS
            .iter()
            .find(|(name, _)| name == &network)
            .map(|(_, config)| config.clone())
            .unwrap_or_else(|| {
                CARDANO_NETWORKS
                    .iter()
                    .find(|(name, _)| *name == "mainnet")
                    .unwrap()
                    .1
                    .clone()
            });

        Config {
            network: network_config.name,
            network_id: network_config.network_id,
            protocol_magic: network_config.protocol_magic,
            kupo_url: std::env::var("KUPO_URL")
                .unwrap_or_else(|_| network_config.kupo_url),
            blockfrost_url: std::env::var("BLOCKFROST_URL")
                .unwrap_or_else(|_| network_config.blockfrost_url),
            blockfrost_api_key: std::env::var("BLOCKFROST_API_KEY")
                .unwrap_or_else(|_| network_config.blockfrost_api_key),
            explorer_url: std::env::var("EXPLORER_URL")
                .unwrap_or_else(|_| network_config.explorer_url),
        }
    }
}
