# ORŸA Blockchain Adapters

Modular blockchain integration layer supporting multiple chains and protocols.

## Overview

Five independent adapter packages, each handling a specific blockchain or cross-chain functionality:

1. **blockchain-sui** - SUI network integration
2. **blockchain-btcfi** - Bitcoin DeFi (Thorchain, BitLayer, Stacks)
3. **blockchain-evm** - Ethereum & EVM-compatible chains
4. **blockchain-solana** - Solana network
5. **blockchain-crosschain** - Cross-chain bridges (LayerZero, Wormhole, Axelar)

## Architecture

Each adapter:
- ✅ Is independently deployable
- ✅ Can be updated without affecting others
- ✅ Implements a common interface
- ✅ Handles chain-specific logic
- ✅ Provides consistent API to backend services

## Current Status

| Adapter | Status | Priority |
|---------|--------|----------|
| blockchain-sui | 📋 Phase 2 | ⭐⭐⭐ High |
| blockchain-btcfi | 📋 Phase 3 | ⭐⭐ Medium |
| blockchain-evm | 📋 Phase 7 | ⭐⭐ Medium |
| blockchain-solana | 📋 Phase 7 | ⭐ Low |
| blockchain-crosschain | 📋 Phase 7+ | ⭐ Low |

## Implementation Timeline

### Phase 2: SUI Adapter (Weeks 6-8)

**Features:**
- Privy MPC embedded wallets
- Transaction signing & broadcasting
- DeepBook/Cetus swap integration
- SuiLend lending protocol
- Real-time balance tracking

**Key Dependencies:**
- `privy-client` - Embedded wallet SDK
- `@mysten/sui.js` - SUI JavaScript SDK
- `@mysten/sui.keytool` - Key management

### Phase 3: BTCfi Adapter (Weeks 9-10)

**Features:**
- Thorchain integration
- BitLayer support
- Stacks smart contracts
- Cross-chain swaps

### Phase 7: EVM & Solana (Weeks 22-23)

**EVM Features:**
- Uniswap V3 integration
- Aave lending/borrowing
- Compound protocol
- 0x Protocol swaps

**Solana Features:**
- Serum exchange
- Raydium AMM
- Orca liquidity pools
- Magic Eden NFTs

### Phase 7+: Cross-Chain (Future)

**Features:**
- LayerZero messaging
- Wormhole bridge
- Axelar network

## File Structure

```
adapters/
├── blockchain-sui/
│   ├── src/
│   │   ├── lib.rs
│   │   ├── wallet.rs        # Privy integration
│   │   ├── protocols/       # DeFi protocols
│   │   │   ├── deepbook.rs
│   │   │   ├── cetus.rs
│   │   │   └── suilend.rs
│   │   ├── transactions.rs  # TX signing & broadcasting
│   │   └── errors.rs
│   ├── Cargo.toml
│   └── README.md
│
├── blockchain-btcfi/
│   ├── src/
│   │   ├── lib.rs
│   │   ├── thorchain.rs
│   │   ├── bitlayer.rs
│   │   ├── stacks.rs
│   │   └── errors.rs
│   ├── Cargo.toml
│   └── README.md
│
└── [other adapters...]
```

## Common Interface (To Be Defined)

All adapters will implement a common trait:

```rust
pub trait BlockchainAdapter {
    fn chain_id(&self) -> ChainId;
    fn get_balance(&self, address: &str) -> Result<Balance>;
    fn sign_transaction(&self, tx: &Transaction) -> Result<SignedTx>;
    fn broadcast_transaction(&self, tx: &SignedTx) -> Result<TxHash>;
    fn get_transaction_status(&self, tx_hash: &str) -> Result<TxStatus>;
}
```

## Configuration

Each adapter reads from environment variables:

```bash
# SUI
SUI_RPC_URL=https://fullnode.devnet.sui.io
PRIVY_APP_ID=your_app_id
PRIVY_APP_SECRET=your_secret

# BTCfi
THORCHAIN_RPC_URL=...
STACKS_API=...

# EVM
ETH_RPC_URL=https://eth.example.com
UNISWAP_SUBGRAPH=...

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com

# Cross-chain
LAYERZERO_ENDPOINT=...
WORMHOLE_CORE=...
```

## Development

### SUI Adapter (Currently in Phase 2)

```bash
cd blockchain-sui

# Build
cargo build

# Test
cargo test

# Run tests with logging
RUST_LOG=debug cargo test -- --nocapture
```

### Future Adapters

```bash
cd blockchain-evm
cargo build
```

## Testing

Each adapter has:
- Unit tests for business logic
- Integration tests with testnet
- Mocks for external services

```bash
cargo test --lib           # Unit tests
cargo test --test '*'      # Integration tests
```

## Dependencies

### SUI Adapter
- `privy-client` - Wallet SDK
- `@mysten/sui.js` - SUI SDK
- `reqwest` - HTTP client
- `serde` - Serialization
- `tokio` - Async runtime

### Common
- All adapters use `tokio` for async runtime
- All use `serde` for serialization
- All use `tracing` for logging

## API Examples

### SUI Adapter

```rust
use blockchain_sui::SuiAdapter;

let adapter = SuiAdapter::new(config)?;

// Get balance
let balance = adapter.get_balance("0x123...")?;

// Sign transaction
let signed_tx = adapter.sign_transaction(&tx)?;

// Broadcast
let tx_hash = adapter.broadcast_transaction(&signed_tx)?;
```

## Error Handling

Each adapter defines chain-specific errors:

```rust
pub enum SuiError {
    InvalidAddress,
    InsufficientBalance,
    TransactionFailed,
    NetworkError,
    // ...
}
```

All errors implement `std::error::Error` for consistency.

## Monitoring

Each adapter logs:
- RPC calls and responses
- Transaction status changes
- Error conditions
- Performance metrics

```bash
RUST_LOG=blockchain_sui=debug cargo run
```

## Security

- 🔐 No private keys stored in adapters
- 🔐 Privy handles key management
- 🔐 Rate limiting on RPC calls
- 🔐 Input validation on all parameters
- 🔐 Audit logging for all transactions

## Deployment

Each adapter can be deployed independently:

```bash
# Build for production
cargo build --release

# Deploy to Kubernetes
kubectl apply -f kubernetes/blockchain-sui-deployment.yml
```

## Contributing

1. Follow Rust style guidelines
2. Add tests for new functionality
3. Update README with new features
4. Test against testnet before production
5. Pass `cargo clippy` checks

## Troubleshooting

### RPC Connection Failed

Check environment variables:
```bash
echo $SUI_RPC_URL
echo $ETH_RPC_URL
```

### Transaction Signing Failed

Ensure Privy credentials are correct:
```bash
echo $PRIVY_APP_ID
echo $PRIVY_APP_SECRET
```

## Resources

- **SUI Docs:** https://docs.sui.io/
- **Privy Docs:** https://docs.privy.io/
- **EVM Standards:** https://eips.ethereum.org/
- **Solana Docs:** https://docs.solana.com/

## Timeline & Roadmap

See `.zencoder/ARCHITECTURE_STRATEGY_v1.md` for detailed timeline and integration priorities.

## Support

For adapter issues:
1. Check adapter-specific README
2. Review logs with `RUST_LOG=debug`
3. Check `.zencoder/QUICK_REFERENCE.md`
4. Create issue with full context