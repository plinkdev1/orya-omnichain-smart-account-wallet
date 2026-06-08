use crate::Config;

pub struct ChainClient {
    config: Config,
    client: reqwest::Client,
}

impl ChainClient {
    pub fn new(config: Config) -> Self {
        Self {
            config,
            client: reqwest::Client::new(),
        }
    }

    pub fn config(&self) -> &Config {
        &self.config
    }
}
