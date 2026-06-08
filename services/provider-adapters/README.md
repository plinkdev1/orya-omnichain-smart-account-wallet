# Provider Adapters

Integration layer for all external blockchain, DeFi, RPC, fiat, and oracle providers.

**Purpose:** Standardize interactions with external services and protocols.

## Structure

```
provider-adapters/
├── chain-adapters/
│   ├── sui/          # SUI blockchain (Suiet, DeepBook, Cetus)
│   ├── evm/          # EVM chains (viem, 0x Protocol, LayerZero)
│   ├── solana/       # Solana (Jupiter, Wormhole)
│   └── bitcoin/      # Bitcoin & BTCfi (Babylon, Stacks, Bitlayer)
├── dex-adapters/
│   ├── zero_x.rs     # 0x Protocol (EVM)
│   ├── meld.rs       # Meld (batching, paymaster)
│   ├── deepbook.rs   # DeepBook (SUI CLOB)
│   └── jupiter.rs    # Jupiter (Solana)
├── rpc-providers/
│   ├── alchemy.rs    # Alchemy Cortex (primary)
│   └── quicknode.rs  # QuickNode (fallback)
├── fiat-bridges/
│   ├── moonpay.rs    # MoonPay (primary)
│   └── ramp.rs       # Ramp (fallback)
├── oracles/
│   ├── pyth.rs       # Pyth Network (low-latency)
│   ├── redstone.rs   # RedStone (BTC focus)
│   └── chainlink.rs  # Chainlink (high-value settlements)
└── README.md
```

## Chain Adapters

### SUI Adapter (`chain-adapters/sui/`)
**Integration:** Suiet wallet-kit, DeepBook, Cetus, Pyth, Wormhole

**Key Operations:**
```rust
// Initialize SUI adapter
initialize_sui_adapter(SUIConfig)

// DeepBook - Native CLOB
place_deepbook_order(DeepBookOrder) -> tx_hash

// Cetus - Concentrated Liquidity AMM
execute_cetus_swap(CetusSwap) -> tx_hash
```

**Ports:** 3000 (API Gateway) → calls SUI RPC → returns quotes/tx hashes

---

### EVM Adapter (`chain-adapters/evm/`)
**Integration:** viem, ethers.js, 0x Protocol, LayerZero, Hop

**Supported Chains:** Ethereum, Arbitrum, Optimism, Polygon, Base

**Key Operations:**
```rust
initialize_evm_adapter(EVMConfig)
execute_evm_swap(EVMSwap) -> tx_hash
bridge_via_layerzero(LayerZeroBridge) -> tx_hash
```

**Quote Flow:**
1. Client requests quote for USDC → USDT on Arbitrum
2. EVM adapter queries 0x Protocol
3. Returns best route + gas estimate
4. Client signs → adapter broadcasts to chain

---

### Solana Adapter (`chain-adapters/solana/`)
**Integration:** @solana/web3.js, Jupiter, Wormhole

**Key Operations:**
```rust
initialize_solana_adapter(SolanaConfig)
execute_jupiter_swap(JupiterSwap) -> tx_hash
bridge_via_wormhole(WormholeBridge) -> tx_hash
```

---

### Bitcoin Adapter (`chain-adapters/bitcoin/`)
**Integration:** Bitcoin RPC, Babylon, Stacks, Bitlayer, Volo

**Key Operations:**
```rust
initialize_bitcoin_adapter(BitcoinConfig)
stake_babylon(BabylonStake) -> tx_hash          // BTC staking
deposit_btcfi_vault(BTCfiVault) -> tx_hash      // LBTC/YBTC vaults
bridge_to_stacks(StacksBridge) -> tx_hash       // BTC → Stacks
```

---

## DEX Adapters

| Adapter | Chains | Use Case | Integration |
|---------|--------|----------|-------------|
| **0x Protocol** | EVM | Best pricing, RFQ | API + Smart contract |
| **Meld** | Multi | Batching, paymaster | Intent-based swaps |
| **DeepBook** | SUI | Native CLOB | Suiet wallet-kit |
| **Jupiter** | Solana | DEX aggregation | Jupiter API |
| **1inch Fusion** | EVM | RFQ, MEV protection | Coming Phase 2 |
| **Odos** | Multi | Complex multi-hop | Coming Phase 3 |

---

## RPC Providers

### Primary: Alchemy Cortex (EVM)
```rust
AlchemyConfig {
    api_key: "alchemy_key",
    network: "arbitrum-mainnet"
}
```

**Features:**
- AI-powered route optimization
- Sub-50ms response times
- Enhanced APIs (getNFTs, getAssets, etc.)
- 99.9% uptime SLA

### Fallback: QuickNode (Multi-chain)
- SUI, Aptos, Solana, Bitcoin support
- Faster than standard RPC
- Global edge network

---

## Fiat Bridges

### MoonPay (Primary)
- Virtual card issuance (instant)
- Crypto ↔ fiat conversion
- Auto-convert for card spending

**Flow:**
```
User: "Spend €50"
  ↓
FX Engine: "Use USDC on Arbitrum"
  ↓
Fiat Bridge: Convert USDC → EUR
  ↓
Card Issuer: Authorize payment
  ↓
Settlement: Move EUR to card account
```

### Ramp / Banxa (Fallback)
- Redundancy
- Alternative compliance pathways

---

## Oracles

| Oracle | Chains | Latency | Use Case |
|--------|--------|---------|----------|
| **Pyth** | SUI, EVM | Sub-second | UI updates, real-time quotes |
| **RedStone** | BTC, EVM | ~5s | BTCfi pricing, proof-of-reserve |
| **Chainlink** | EVM | ~15s | High-value settlements, fallback |

**Priority Decision:**
- **UI/Quotes:** Pyth (fast, on-chain)
- **Settlements:** Chainlink (most secure)
- **BTCfi:** RedStone (BTC-native)

---

## Integration Pattern

All adapters follow this pattern:

```rust
pub mod adapter_name {
    // 1. Configuration
    pub struct Config {
        // Provider-specific settings
    }
    
    // 2. Initialize
    pub async fn initialize(config: Config) -> Result<()>
    
    // 3. Core operations
    pub async fn execute_operation(...) -> Result<String>
    
    // 4. Error handling
    // All return anyhow::Result<T>
}
```

---

## Error Handling

All adapters return `anyhow::Result<T>`:

```rust
execute_swap(...)?  // Propagates errors up

// Errors include:
// - Network errors (retry-able)
// - RPC errors (fallback to alternate RPC)
// - Invalid parameters (fail immediately)
// - Rate limiting (exponential backoff)
```

---

## Configuration

All provider credentials are managed via:

**Environment Variables (.env):**
```env
# RPC Providers
ALCHEMY_API_KEY=...
QUICKNODE_API_KEY=...

# DEX/Bridge APIs
ZEROEX_API_KEY=...
MOONPAY_API_KEY=...
MOONPAY_SECRET_KEY=...

# Oracles
PYTH_PRICE_FEED_URL=...
CHAINLINK_RPC_URL=...
REDSTONE_API_URL=...

# Chain RPC URLs
SUI_RPC_URL=...
ETH_RPC_URL=...
SOLANA_RPC_URL=...
BTC_RPC_URL=...
```

**Vault (Production):**
- HashiCorp Vault integration for credential rotation
- Per-environment secrets
- Audit logging

---

## Testing

Each adapter includes mock implementations:

```rust
#[cfg(test)]
mod tests {
    use mockall::predicate::*;
    
    #[tokio::test]
    async fn test_quote() {
        // Mock 0x API response
        // Assert correct fee calculation
    }
}
```

---

## Phase Rollout

| Phase | Adapters | Status |
|-------|----------|--------|
| **Phase 1** | SUI, EVM, Alchemy, MoonPay, Pyth | MVP |
| **Phase 2** | Bitcoin, Meld, RedStone | BTCfi |
| **Phase 3** | Solana, 1inch, Odos | Multi-chain scaling |
| **Phase 4+** | Additional bridges, oracles | Optimization |

---

## Next Steps

1. Implement stub providers with mock responses
2. Connect to test RPC endpoints
3. Add comprehensive error handling
4. Write integration tests per adapter
5. Document API contracts with OpenAPI/GraphQL

See `../README.md` for service-level integration.