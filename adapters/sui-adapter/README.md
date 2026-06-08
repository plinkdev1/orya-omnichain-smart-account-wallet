# SUI Adapter

Type-safe Rust adapter for SUI blockchain integration. Provides unified interface for SUI operations including wallet management, transaction execution, and protocol interactions.

## Overview

- **Language:** Rust
- **SDK:** SUI SDK (official Mysten Labs)
- **Primary Use:** SUI transactions, DeFi protocol routing
- **Architecture:** Chain adapter pattern

## Features

✅ SUI wallet operations  
✅ DeepBook CLOB integration  
✅ Cetus AMM integration  
✅ SuiLend protocol  
✅ Transaction signing & execution  
✅ Event listening & indexing  

## Integration

### Suiet Wallet-Kit Integration

```rust
use suiet_wallet_kit::WalletKit;

let wallet = WalletKit::new(config);
let tx = wallet.transfer(recipient, amount).await?;
```

### DeepBook Orders

```rust
use sui_adapter::deepbook::DeepBookClient;

let client = DeepBookClient::new(rpc_url);
let orderbook = client.get_orderbook(pool_id).await?;
```

## Configuration

See `.env.example` for environment variables.

## Quick Start

```bash
cp .env.example .env
cargo build
cargo run --example basic_transfer
```

## Protocols Supported

| Protocol | Status | Module |
|----------|--------|--------|
| DeepBook | ✅ | `deepbook.rs` |
| Cetus | ✅ | `cetus.rs` |
| SuiLend | ✅ | `suilend.rs` |
| Scallop | ✅ | `scallop.rs` |
| Aftermath | ✅ | `aftermath.rs` |
| Navi | 🟡 | `navi.rs` |
| Turbos | 🟡 | `turbos.rs` |

## Testing

```bash
cargo test
cargo test -- --nocapture
```

## Documentation

- [SUI SDK Docs](https://docs.sui.io)
- [DeepBook Guide](https://docs.sui.io/standards/deepbook)
- [Adapter Architecture](../../docs/architecture/sui-adapter.md)