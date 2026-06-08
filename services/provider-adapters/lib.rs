//! Provider Adapters - Integration Layer
//! 
//! This library contains all external provider integrations:
//! - Chain adapters (SUI, EVM, Solana, Bitcoin)
//! - DEX adapters (0x, Meld, DeepBook, Jupiter)
//! - RPC providers (Alchemy, QuickNode, Moralis)
//! - Fiat bridges (MoonPay, Ramp, Banxa)
//! - Oracle adapters (Pyth, RedStone, Chainlink)
//! - Chain configuration (150+ networks)

pub mod chains;

pub mod rpc_providers {
    pub mod moralis;
}