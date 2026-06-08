# Movement Adapter

Type-safe Rust adapter for Movement blockchain integration with cross-chain bridge support.

## Overview

- **Language:** Rust
- **SDK:** Movement SDK
- **Primary Use:** MOVE transactions, cross-chain bridge operations
- **Architecture:** Chain adapter pattern

## Features

✅ Wallet information and balances  
✅ Cross-chain bridge operations  
✅ Bridge fee calculation  
✅ Bridge route discovery  
✅ Bridge status tracking  
✅ Transaction creation and estimation  
✅ Transaction status tracking  
✅ Multi-token support  

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
NETWORK=devnet
RPC_URL=https://devnet.movement.io/v1
CHAIN_ID=30
```

## Quick Start

```bash
cp .env.example .env
cargo build
cargo run --example bridge_operations
```

## Core APIs

### Wallet Operations

```rust
let config = Config::from_env()?;
let client = ChainClient::new(config);

let wallet = client.get_wallet_info("0x1").await?;
let balance = client.get_token_balance(address, token_address).await?;
```

### Bridge Operations

#### Get Supported Chains

```rust
let bridge_config = BridgeConfig {
    gateway_url: "https://bridge.movement.io".to_string(),
    supported_chains: vec!["movement".to_string(), "ethereum".to_string()],
    min_amount: "1".to_string(),
    max_amount: "1000000".to_string(),
};

let bridge = BridgeClient::new(bridge_config);
let chains = bridge.get_supported_chains().await?;
```

#### Get Bridge Fees

```rust
let fee = bridge.get_bridge_fee(
    "movement",
    "ethereum", 
    "0x1::movement_coin::MovementCoin",
    "1000000"
).await?;

println!("Base fee: {}", fee.base_fee);
println!("Total fee: {}", fee.total_fee);
```

#### Get Bridge Routes

```rust
let routes = bridge.get_bridge_routes("movement", "ethereum").await?;
for route in routes {
    println!("Route: {} → {}", route.source_chain, route.destination_chain);
}
```

#### Initiate Bridge Transfer

```rust
let bridge_id = bridge.initiate_bridge(
    "movement",
    "ethereum",
    "0x1::movement_coin::MovementCoin",
    "0xethereum_recipient",
    "1000000"
).await?;

println!("Bridge initiated: {}", bridge_id);
```

#### Check Bridge Status

```rust
let status = bridge.get_bridge_status(&bridge_id).await?;
println!("Status: {}", status.status);
println!("Est. completion: {} seconds", status.estimated_completion);
```

#### Bridge History

```rust
let history = bridge.get_bridge_history(address, 10).await?;
for entry in history {
    println!("Bridge: {} → {} (Status: {})", 
        entry.source_chain, entry.destination_chain, entry.status);
}
```

## Supported Chains

| Chain | Status | Bridge |
|-------|--------|--------|
| Movement | ✅ | Native |
| Ethereum | ✅ | Supported |
| Aptos | 🟡 | Planned |
| Solana | 🟡 | Planned |

## Transaction Operations

```rust
let gas_estimate = client.estimate_gas(sender, receiver, amount).await?;
let tx = client.create_transaction(sender, receiver, amount, gas_estimate).await?;
let status = client.get_transaction_status(&tx_hash).await?;
```

## Testing

```bash
cargo test
cargo test -- --nocapture --test-threads=1
```

## Examples

Run examples from the `examples/` directory:

```bash
cargo run --example bridge_operations
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

## Bridge Status Values

- `pending`: Bridge transfer is being processed
- `confirmed`: Bridge transfer confirmed on source chain
- `relaying`: Relayers are processing the bridge transfer
- `completed`: Bridge transfer completed on destination chain
- `failed`: Bridge transfer failed
