use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub network: String,
    pub rpc_url: String,
    pub chain_id: u64,
}

impl Config {
    pub fn from_env() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Config {
            network: std::env::var("NETWORK").unwrap_or_else(|_| "mainnet".to_string()),
            rpc_url: std::env::var("RPC_URL")?,
            chain_id: std::env::var("CHAIN_ID")?.parse()?,
        })
    }
}
