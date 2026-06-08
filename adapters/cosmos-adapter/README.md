# Cosmos Adapter

Comprehensive Cosmos SDK blockchain adapter for ORŸA Wallet with full CosmJS equivalents and Cosmos Kit integration.

## Overview

- **Language:** Rust
- **Blockchain:** Cosmos Hub and Cosmos SDK ecosystem
- **Network Support:** Mainnet (cosmoshub-4) and Testnet (theta-testnet-001)
- **Architecture:** Chain adapter pattern with Cosmos Kit WalletConnect support

## Features

- [x] Mnemonic-based wallet generation (BIP39/BIP32)
- [x] Account creation from private keys
- [x] Balance queries (single and multi-token)
- [x] Account information retrieval (sequence, account number)
- [x] Transaction estimation and broadcasting
- [x] Message signing support
- [x] Cosmos Kit integration with WalletConnect
- [x] Support for external wallets (Keplr, Leap, Cosmostation, Trust Wallet)
- [x] Native ORŸA wallet integration capability

## Configuration

Copy `.env.example` to `.env` and configure for your network:

```bash
cp .env.example .env
```

### Environment Variables

```env
COSMOS_NETWORK=mainnet                              # Network: mainnet or testnet
COSMOS_RPC_URL=https://rpc.cosmos.directory/cosmoshub
COSMOS_REST_URL=https://lcd.cosmos.directory/cosmoshub
COSMOS_CHAIN_ID=cosmoshub-4
COSMOS_DENOM=uatom
COSMOS_PREFIX=cosmos
COSMOS_DERIVATION_PATH=m/44'/118'/0'/0/0
COSMOS_GAS_PRICE=0.0025
COSMOS_GAS_ADJUSTMENT=1.3
WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
```

## Quick Start

```bash
cd adapters/cosmos-adapter
cp .env.example .env
cargo build
cargo run --example basic_wallet
```

## API Usage

### Creating a Wallet

```rust
use cosmos_adapter::{ChainClient, Config};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = Config::mainnet();
    let client = ChainClient::new(config);
    
    // Generate mnemonic
    let mnemonic = client.generate_mnemonic()?;
    println!("Mnemonic: {}", mnemonic);
    
    // Create account from mnemonic
    let account = client.create_account_from_mnemonic(&mnemonic, 0)?;
    println!("Address: {}", account.address);
    
    Ok(())
}
```

### Querying Balances

```rust
let balance = client.get_balance(&address, "uatom").await?;
println!("Balance: {}", balance.amount);

let all_balances = client.get_all_balances(&address).await?;
for balance in all_balances {
    println!("{}: {}", balance.denom, balance.amount);
}
```

### Cosmos Kit Integration

```rust
use cosmos_adapter::{CosmosKitClient, CosmosKitConfig, WalletType};

let config = CosmosKitConfig::new("your_walletconnect_project_id".to_string());
let mut cosmos_kit = CosmosKitClient::new(config);

// Connect via WalletConnect
let session = cosmos_kit.connect_wallet(&WalletType::WalletConnect, "cosmoshub-4").await?;
println!("Session ID: {}", session.id);

// List supported wallets
let wallets = cosmos_kit.get_supported_wallets();
for wallet in wallets {
    println!("Wallet: {}", wallet.display_name());
}
```

## Testing

```bash
cargo test
```

## Documentation

- [Cosmos SDK Documentation](https://docs.cosmos.network/)
- [Cosmos Kit Documentation](https://docs.cosmoskit.com/)
- [CosmJS Reference](https://docs.cosmjs.dev/)
- [Wallet Connect Protocol](https://specs.walletconnect.com/2.0/)

## Supported Wallets

- **Keplr** - Browser extension and mobile
- **Leap** - Modern Cosmos wallet
- **Cosmostation** - Multi-chain wallet
- **Ledger** - Hardware wallet support
- **Trust Wallet** - Mobile and browser
- **Wallet Connect** - Protocol-based connection
- **ORŸA Native** - Native wallet integration

## Architecture

### Modules

- **config.rs** - Configuration management for different networks
- **client.rs** - Core RPC client for querying and transactions
- **keys.rs** - Key derivation, account creation, and signing
- **cosmos_kit.rs** - Wallet Kit integration with WalletConnect
- **error.rs** - Comprehensive error handling

## Contributing

Please ensure all tests pass before submitting PRs:

```bash
cargo test --all
cargo clippy
cargo fmt
```
