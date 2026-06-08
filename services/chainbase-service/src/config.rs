use dotenv::dotenv;
use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub chainbase_api_key: String,
    pub chainbase_api_url: String,
    pub database_url: String,
    pub redis_url: String,
    pub service_port: u16,
}

impl Config {
    pub fn from_env() -> Result<Self, String> {
        dotenv().ok();

        let chainbase_api_key = env::var("CHAINBASE_API_KEY")
            .map_err(|_| "CHAINBASE_API_KEY not set".to_string())?;

        let chainbase_api_url = env::var("CHAINBASE_API_URL")
            .unwrap_or_else(|_| "https://api.chainbase.com/v1".to_string());

        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgresql://user:password@localhost:5432/orya_wallet".to_string());

        let redis_url = env::var("REDIS_URL")
            .unwrap_or_else(|_| "redis://localhost:6379".to_string());

        let service_port = env::var("SERVICE_PORT")
            .unwrap_or_else(|_| "8085".to_string())
            .parse::<u16>()
            .map_err(|_| "SERVICE_PORT must be a valid u16".to_string())?;

        Ok(Config {
            chainbase_api_key,
            chainbase_api_url,
            database_url,
            redis_url,
            service_port,
        })
    }

    #[cfg(test)]
    pub fn test() -> Self {
        Config {
            chainbase_api_key: "test_key".to_string(),
            chainbase_api_url: "https://api.test.com".to_string(),
            database_url: "postgresql://test:test@localhost/test".to_string(),
            redis_url: "redis://localhost:6379".to_string(),
            service_port: 8085,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_test_creation() {
        let config = Config::test();
        assert_eq!(config.chainbase_api_key, "test_key");
        assert_eq!(config.service_port, 8085);
    }
}
