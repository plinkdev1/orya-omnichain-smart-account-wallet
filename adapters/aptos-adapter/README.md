# Aptos Adapter

Type-safe Rust adapter for Aptos blockchain integration with DEX support.

## Overview

- **Language:** Rust
- **SDK:** Aptos SDK
- **Primary Use:** APT transactions, DEX integration (AUX, Pontem)
- **Architecture:** Chain adapter pattern

## Features

✅ Wallet information and balances  
✅ AUX DEX integration with swap quotes  
✅ Pontem DEX integration  
✅ Transaction creation and estimation  
✅ Transaction status tracking  
✅ Coin balance queries  
✅ Multi-coin support  

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
NETWORK=testnet
RPC_URL=https://fullnode.testnet.aptoslabs.com/v1
CHAIN_ID=2
```

## Quick Start

```bash
cp .env.example .env
cargo build
cargo run --example basic_operations
```

## Core APIs

### Wallet Operations

```rust
let config = Config::from_env()?;
let client = ChainClient::new(config);

let wallet = client.get_wallet_info("0x1").await?;
let balance = client.get_coin_balance(address, coin_type).await?;
```

### DEX Operations (AUX)

```rust
let aux = AuxClient::new("https://api.aux.exchange".to_string());

let pools = aux.get_pools().await?;
let quote = aux.get_swap_quote(coin_in, coin_out, amount).await?;
let tx = aux.execute_swap(sender, coin_in, coin_out, amount, min_out).await?;
```

### DEX Operations (Pontem)

```rust
let pontem = PontemClient::new("https://api.pontem.io".to_string());

let pools = pontem.get_pools().await?;
let quote = pontem.get_swap_quote(coin_in, coin_out, amount).await?;
let tx = pontem.execute_swap(sender, coin_in, coin_out, amount, min_out).await?;
```

## Protocols Supported

| Protocol | Status | Features |
|----------|--------|----------|
| AUX | ✅ | Swap quotes, pool queries |
| Pontem | ✅ | Swap quotes, pool queries |
| Econia | 🟡 | Planned |
| CetusSwap | 🟡 | Planned |

## Testing

```bash
cargo test
cargo test -- --nocapture --test-threads=1
```

## Examples

Run examples from the `examples/` directory:

```bash
cargo run --example basic_operations
```

## Error Handling

The adapter uses a unified error type for all operations:

```rust
pub enum Error {
    ConfigError(String),
    NetworkError(String),
    ParseError(String),
}
```
