pub mod config;
pub mod client;
pub mod error;

pub use config::Config;
pub use client::ChainClient;
pub use error::Error;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_module_loads() {
        assert!(true);
    }
}
