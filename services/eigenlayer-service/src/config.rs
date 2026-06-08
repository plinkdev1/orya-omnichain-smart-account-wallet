use crate::error::Error;
use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub ethereum_rpc_url: String,
    pub strategy_manager_address: String,
    pub delegation_manager_address: String,
    pub avs_directory_address: String,
    pub eigencloud_api_url: String,
    pub eigencloud_api_key: String,
    pub database_url: String,
    pub redis_url: String,
    pub service_port: u16,
    pub nats_url: String,
}

impl Config {
    pub fn from_env() -> Result<Self, Error> {
        Ok(Config {
            ethereum_rpc_url: env::var("ETHEREUM_RPC_URL")
                .map_err(|_| Error::ConfigError("ETHEREUM_RPC_URL not set".to_string()))?,
            strategy_manager_address: env::var("EIGENLAYER_STRATEGY_MANAGER")
                .map_err(|_| Error::ConfigError("EIGENLAYER_STRATEGY_MANAGER not set".to_string()))?,
            delegation_manager_address: env::var("EIGENLAYER_DELEGATION_MANAGER")
                .map_err(|_| Error::ConfigError("EIGENLAYER_DELEGATION_MANAGER not set".to_string()))?,
            avs_directory_address: env::var("EIGENLAYER_AVS_DIRECTORY")
                .map_err(|_| Error::ConfigError("EIGENLAYER_AVS_DIRECTORY not set".to_string()))?,
            eigencloud_api_url: env::var("EIGENCLOUD_API_URL")
                .unwrap_or_else(|_| "https://api.eigencloud.xyz".to_string()),
            eigencloud_api_key: env::var("EIGENCLOUD_API_KEY")
                .map_err(|_| Error::ConfigError("EIGENCLOUD_API_KEY not set".to_string()))?,
            database_url: env::var("DATABASE_URL")
                .map_err(|_| Error::ConfigError("DATABASE_URL not set".to_string()))?,
            redis_url: env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            service_port: env::var("SERVICE_PORT")
                .unwrap_or_else(|_| "8086".to_string())
                .parse()
                .map_err(|_| Error::ConfigError("Invalid SERVICE_PORT".to_string()))?,
            nats_url: env::var("NATS_URL")
                .unwrap_or_else(|_| "nats://localhost:4222".to_string()),
        })
    }
}
