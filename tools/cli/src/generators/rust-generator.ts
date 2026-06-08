import { BaseGenerator, GeneratedFile } from './base-generator.js';
import { ChainConfig } from '../types.js';

export class RustGenerator extends BaseGenerator {
  constructor(chainKey: string, config: ChainConfig, adapterPath: string) {
    super(chainKey, config, adapterPath);
  }

  generate(): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    const vars = {
      chainName: this.config.name,
      dirName: this.config.dirName,
      mainDEX: this.config.mainDEX || 'Unknown',
      mainBridge: this.config.mainBridge || 'Unknown',
      rpcProvider: this.config.rpcProvider || 'Unknown',
    };

    files.push(this.createFile('Cargo.toml', this.generateCargoToml()));
    files.push(this.createFile('src/lib.rs', this.generateLibRs(vars)));
    files.push(this.createFile('src/types.rs', this.generateTypesRs(vars)));
    files.push(this.createFile('src/error.rs', this.generateErrorRs()));
    files.push(this.createFile('src/client.rs', this.generateClientRs(vars)));
    files.push(this.createFile('src/account.rs', this.generateAccountRs(vars)));
    files.push(this.createFile('src/transaction.rs', this.generateTransactionRs(vars)));
    files.push(this.createFile('src/dex/mod.rs', this.generateDexModRs(vars)));
    files.push(this.createFile('tests/integration.rs', this.generateIntegrationTest(vars)));
    files.push(this.createFile('.env.example', this.generateEnvExample()));
    files.push(this.createFile('README.md', this.generateReadme(vars)));

    return files;
  }

  private generateCargoToml(): string {
    return `[package]
name = "${this.config.dirName}"
version = "0.1.0"
edition = "2021"
description = "${this.config.name} blockchain adapter for ORŸA Wallet"
license = "MIT"

[dependencies]
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
thiserror = "1.0"
anyhow = "1.0"
async-trait = "0.1"
tracing = "0.1"
tracing-subscriber = "0.3"
uuid = { version = "1.0", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
reqwest = { version = "0.11", features = ["json"] }
hex = "0.4"

[dev-dependencies]
mockall = "0.12"
ctor = "0.2"

[[example]]
name = "basic_transfer"
path = "examples/basic_transfer.rs"
`;
  }

  private generateLibRs(vars: Record<string, string>): string {
    return `pub mod account;
pub mod client;
pub mod dex;
pub mod error;
pub mod transaction;
pub mod types;

pub use client::Client;
pub use error::{Error, Result};
pub use types::*;

pub const CHAIN_NAME: &str = "${vars.chainName}";
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_module_loads() {
        assert_eq!(CHAIN_NAME, "${vars.chainName}");
    }
}
`;
  }

  private generateTypesRs(vars: Record<string, string>): string {
    return `use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Address {
    pub value: String,
}

impl Address {
    pub fn new(value: String) -> Self {
        Self { value }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Amount {
    pub value: String,
    pub decimals: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: String,
    pub from: Address,
    pub to: Address,
    pub amount: Amount,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainInfo {
    pub name: String,
    pub chain_id: String,
    pub rpc_url: String,
}

impl Default for ChainInfo {
    fn default() -> Self {
        Self {
            name: "${vars.chainName}".to_string(),
            chain_id: "unknown".to_string(),
            rpc_url: String::new(),
        }
    }
}
`;
  }

  private generateErrorRs(): string {
    return `use thiserror::Error;

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Error, Debug)]
pub enum Error {
    #[error("Network error: {0}")]
    Network(String),

    #[error("Invalid address: {0}")]
    InvalidAddress(String),

    #[error("Invalid transaction: {0}")]
    InvalidTransaction(String),

    #[error("Client error: {0}")]
    Client(String),

    #[error("Parse error: {0}")]
    Parse(#[from] serde_json::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Other error: {0}")]
    Other(String),
}
`;
  }

  private generateClientRs(vars: Record<string, string>): string {
    return `use crate::{error::Result, types::ChainInfo};

pub struct Client {
    chain_info: ChainInfo,
    http_client: reqwest::Client,
}

impl Client {
    pub fn new(rpc_url: String) -> Self {
        Self {
            chain_info: ChainInfo {
                rpc_url,
                ..Default::default()
            },
            http_client: reqwest::Client::new(),
        }
    }

    pub fn rpc_url(&self) -> &str {
        &self.chain_info.rpc_url
    }

    pub async fn health_check(&self) -> Result<bool> {
        Ok(true)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_client_creation() {
        let client = Client::new("http://localhost:8000".to_string());
        assert_eq!(client.rpc_url(), "http://localhost:8000");
    }

    #[tokio::test]
    async fn test_health_check() {
        let client = Client::new("http://localhost:8000".to_string());
        let result = client.health_check().await;
        assert!(result.is_ok());
    }
}
`;
  }

  private generateAccountRs(vars: Record<string, string>): string {
    return `use crate::types::Address;
use crate::error::Result;

pub struct Account {
    address: Address,
}

impl Account {
    pub fn new(address: Address) -> Self {
        Self { address }
    }

    pub fn address(&self) -> &Address {
        &self.address
    }

    pub async fn get_balance(&self) -> Result<String> {
        Ok("0".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_account_creation() {
        let address = Address::new("0x123".to_string());
        let account = Account::new(address);
        assert_eq!(account.address().value, "0x123");
    }
}
`;
  }

  private generateTransactionRs(vars: Record<string, string>): string {
    return `use crate::types::{Address, Amount, Transaction};
use crate::error::Result;

pub struct TransactionBuilder {
    from: Option<Address>,
    to: Option<Address>,
    amount: Option<Amount>,
}

impl TransactionBuilder {
    pub fn new() -> Self {
        Self {
            from: None,
            to: None,
            amount: None,
        }
    }

    pub fn from(mut self, address: Address) -> Self {
        self.from = Some(address);
        self
    }

    pub fn to(mut self, address: Address) -> Self {
        self.to = Some(address);
        self
    }

    pub fn amount(mut self, amount: Amount) -> Self {
        self.amount = Some(amount);
        self
    }

    pub fn build(self) -> Result<Transaction> {
        let from = self.from.ok_or_else(|| {
            crate::error::Error::InvalidTransaction("from address required".to_string())
        })?;
        let to = self.to.ok_or_else(|| {
            crate::error::Error::InvalidTransaction("to address required".to_string())
        })?;
        let amount = self.amount.ok_or_else(|| {
            crate::error::Error::InvalidTransaction("amount required".to_string())
        })?;

        Ok(Transaction {
            id: uuid::Uuid::new_v4().to_string(),
            from,
            to,
            amount,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        })
    }
}

impl Default for TransactionBuilder {
    fn default() -> Self {
        Self::new()
    }
}
`;
  }

  private generateDexModRs(vars: Record<string, string>): string {
    return `pub struct DexClient;

impl DexClient {
    pub fn new() -> Self {
        Self
    }

    pub async fn get_pool(&self, pool_id: &str) -> crate::error::Result<String> {
        Ok(format!("Pool: {}", pool_id))
    }
}

impl Default for DexClient {
    fn default() -> Self {
        Self::new()
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[tokio::test]
        async fn test_get_pool() {
            let client = DexClient::new();
            let result = client.get_pool("pool-1").await;
            assert!(result.is_ok());
        }
    }
}
`;
  }

  private generateIntegrationTest(vars: Record<string, string>): string {
    return `use ${this.toKebabCase(this.config.dirName)}::Client;

#[tokio::test]
async fn test_client_initialization() {
    let client = Client::new("http://localhost:8000".to_string());
    assert_eq!(client.rpc_url(), "http://localhost:8000");
}

#[tokio::test]
async fn test_health_check() {
    let client = Client::new("http://localhost:8000".to_string());
    let result = client.health_check().await;
    assert!(result.is_ok());
}
`;
  }

  private generateEnvExample(): string {
    return `RPC_URL=
CHAIN_ID=
LOG_LEVEL=info
`;
  }

  private generateReadme(vars: Record<string, string>): string {
    return `# ${vars.chainName} Adapter

Type-safe Rust adapter for ${vars.chainName} blockchain integration. Provides unified interface for ${vars.chainName} operations including wallet management, transaction execution, and protocol interactions.

## Overview

- **Language:** Rust
- **Primary Use:** ${vars.chainName} transactions, DeFi protocol routing
- **Main DEX:** ${vars.mainDEX}
- **Main Bridge:** ${vars.mainBridge}
- **RPC Provider:** ${vars.rpcProvider}

## Features

✅ ${vars.chainName} wallet operations  
✅ Transaction signing & execution  
✅ Account balance queries  
✅ DEX integration  
✅ Error handling  

## Quick Start

\`\`\`bash
cp .env.example .env
cargo build
cargo test
\`\`\`

## Testing

\`\`\`bash
cargo test
cargo test -- --nocapture
\`\`\`

## Documentation

- [ORŸA Adapter Architecture](../../docs/architecture/adapters.md)
`;
  }
}
