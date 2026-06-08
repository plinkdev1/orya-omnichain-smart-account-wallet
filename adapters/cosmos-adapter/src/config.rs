use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub network: String,
    pub rpc_url: String,
    pub rest_url: String,
    pub chain_id: String,
    pub denom: String,
    pub derivation_path: String,
    pub prefix: String,
    pub gas_price: f64,
    pub gas_adjustment: f64,
}

impl Config {
    pub fn from_env() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Config {
            network: std::env::var("COSMOS_NETWORK").unwrap_or_else(|_| "mainnet".to_string()),
            rpc_url: std::env::var("COSMOS_RPC_URL")
                .unwrap_or_else(|_| "https://rpc.cosmos.directory/cosmoshub".to_string()),
            rest_url: std::env::var("COSMOS_REST_URL")
                .unwrap_or_else(|_| "https://lcd.cosmos.directory/cosmoshub".to_string()),
            chain_id: std::env::var("COSMOS_CHAIN_ID").unwrap_or_else(|_| "cosmoshub-4".to_string()),
            denom: std::env::var("COSMOS_DENOM").unwrap_or_else(|_| "uatom".to_string()),
            derivation_path: std::env::var("COSMOS_DERIVATION_PATH")
                .unwrap_or_else(|_| "m/44'/118'/0'/0/0".to_string()),
            prefix: std::env::var("COSMOS_PREFIX").unwrap_or_else(|_| "cosmos".to_string()),
            gas_price: std::env::var("COSMOS_GAS_PRICE")
                .unwrap_or_else(|_| "0.0025".to_string())
                .parse()?,
            gas_adjustment: std::env::var("COSMOS_GAS_ADJUSTMENT")
                .unwrap_or_else(|_| "1.3".to_string())
                .parse()?,
        })
    }

    pub fn mainnet() -> Self {
        Config {
            network: "mainnet".to_string(),
            rpc_url: "https://rpc.cosmos.directory/cosmoshub".to_string(),
            rest_url: "https://lcd.cosmos.directory/cosmoshub".to_string(),
            chain_id: "cosmoshub-4".to_string(),
            denom: "uatom".to_string(),
            derivation_path: "m/44'/118'/0'/0/0".to_string(),
            prefix: "cosmos".to_string(),
            gas_price: 0.0025,
            gas_adjustment: 1.3,
        }
    }

    pub fn testnet() -> Self {
        Config {
            network: "testnet".to_string(),
            rpc_url: "https://rpc.sentry-01.theta-testnet.polkachu.com".to_string(),
            rest_url: "https://rest.sentry-01.theta-testnet.polkachu.com".to_string(),
            chain_id: "theta-testnet-001".to_string(),
            denom: "uatom".to_string(),
            derivation_path: "m/44'/118'/0'/0/0".to_string(),
            prefix: "cosmos".to_string(),
            gas_price: 0.0025,
            gas_adjustment: 1.3,
        }
    }
}
