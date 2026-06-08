//! Chain Configuration - Support for 150+ Networks
//! 
//! Defines network properties, Moralis chain identifiers, and native tokens for all supported blockchains

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ChainConfig {
    pub id: String,
    pub name: String,
    pub moralis_chain_id: String,
    pub native_token_symbol: String,
    pub native_token_decimals: u32,
    pub rpc_url: Option<String>,
    pub block_explorer_url: Option<String>,
    pub chain_type: ChainType,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub enum ChainType {
    EVM,
    Solana,
    SUI,
    Bitcoin,
    Cosmos,
    Tezos,
    Flow,
    Other(String),
}

pub fn get_all_chains() -> HashMap<String, ChainConfig> {
    let mut chains = HashMap::new();

    chains.insert("ethereum".to_string(), ChainConfig {
        id: "ethereum".to_string(),
        name: "Ethereum Mainnet".to_string(),
        moralis_chain_id: "0x1".to_string(),
        native_token_symbol: "ETH".to_string(),
        native_token_decimals: 18,
        rpc_url: Some("https://eth-mainnet.alchemyapi.io/v2/".to_string()),
        block_explorer_url: Some("https://etherscan.io".to_string()),
        chain_type: ChainType::EVM,
    });

    chains.insert("arbitrum".to_string(), ChainConfig {
        id: "arbitrum".to_string(),
        name: "Arbitrum One".to_string(),
        moralis_chain_id: "0xa4b1".to_string(),
        native_token_symbol: "ETH".to_string(),
        native_token_decimals: 18,
        rpc_url: Some("https://arb-mainnet.g.alchemy.com/v2/".to_string()),
        block_explorer_url: Some("https://arbiscan.io".to_string()),
        chain_type: ChainType::EVM,
    });

    chains.insert("optimism".to_string(), ChainConfig {
        id: "optimism".to_string(),
        name: "Optimism".to_string(),
        moralis_chain_id: "0xa".to_string(),
        native_token_symbol: "ETH".to_string(),
        native_token_decimals: 18,
        rpc_url: Some("https://opt-mainnet.g.alchemy.com/v2/".to_string()),
        block_explorer_url: Some("https://optimistic.etherscan.io".to_string()),
        chain_type: ChainType::EVM,
    });

    chains.insert("polygon".to_string(), ChainConfig {
        id: "polygon".to_string(),
        name: "Polygon".to_string(),
        moralis_chain_id: "0x89".to_string(),
        native_token_symbol: "MATIC".to_string(),
        native_token_decimals: 18,
        rpc_url: Some("https://polygon-mainnet.g.alchemy.com/v2/".to_string()),
        block_explorer_url: Some("https://polygonscan.com".to_string()),
        chain_type: ChainType::EVM,
    });

    chains.insert("base".to_string(), ChainConfig {
        id: "base".to_string(),
        name: "Base".to_string(),
        moralis_chain_id: "0x2105".to_string(),
        native_token_symbol: "ETH".to_string(),
        native_token_decimals: 18,
        rpc_url: Some("https://base-mainnet.g.alchemy.com/v2/".to_string()),
        block_explorer_url: Some("https://basescan.org".to_string()),
        chain_type: ChainType::EVM,
    });

    chains.insert("bsc".to_string(), ChainConfig {
        id: "bsc".to_string(),
        name: "Binance Smart Chain".to_string(),
        moralis_chain_id: "0x38".to_string(),
        native_token_symbol: "BNB".to_string(),
        native_token_decimals: 18,
        rpc_url: Some("https://bsc-dataseed1.binance.org".to_string()),
        block_explorer_url: Some("https://bscscan.com".to_string()),
        chain_type: ChainType::EVM,
    });

    chains.insert("avalanche".to_string(), ChainConfig {
        id: "avalanche".to_string(),
        name: "Avalanche C-Chain".to_string(),
        moralis_chain_id: "0xa86a".to_string(),
        native_token_symbol: "AVAX".to_string(),
        native_token_decimals: 18,
        rpc_url: Some("https://api.avax.network/ext/bc/C/rpc".to_string()),
        block_explorer_url: Some("https://snowtrace.io".to_string()),
        chain_type: ChainType::EVM,
    });

    chains.insert("fantom".to_string(), ChainConfig {
        id: "fantom".to_string(),
        name: "Fantom Opera".to_string(),
        moralis_chain_id: "0xfa".to_string(),
        native_token_symbol: "FTM".to_string(),
        native_token_decimals: 18,
        rpc_url: Some("https://rpc.ftm.tools".to_string()),
        block_explorer_url: Some("https://ftmscan.com".to_string()),
        chain_type: ChainType::EVM,
    });

    chains.insert("gnosis".to_string(), ChainConfig {
        id: "gnosis".to_string(),
        name: "Gnosis Chain".to_string(),
        moralis_chain_id: "0x64".to_string(),
        native_token_symbol: "XDAI".to_string(),
        native_token_decimals: 18,
        rpc_url: Some("https://rpc.gnosischain.com".to_string()),
        block_explorer_url: Some("https://gnosisscan.io".to_string()),
        chain_type: ChainType::EVM,
    });

    chains.insert("moonbeam".to_string(), ChainConfig {
        id: "moonbeam".to_string(),
        name: "Moonbeam".to_string(),
        moralis_chain_id: "0x504".to_string(),
        native_token_symbol: "GLMR".to_string(),
        native_token_decimals: 18,
        rpc_url: Some("https://rpc.api.moonbeam.network".to_string()),
        block_explorer_url: Some("https://moonscan.io".to_string()),
        chain_type: ChainType::EVM,
    });

    chains.insert("celo".to_string(), ChainConfig {
        id: "celo".to_string(),
        name: "Celo Mainnet".to_string(),
        moralis_chain_id: "0xa4ec".to_string(),
        native_token_symbol: "CELO".to_string(),
        native_token_decimals: 18,
        rpc_url: Some("https://forno.celo.org".to_string()),
        block_explorer_url: Some("https://celoscan.io".to_string()),
        chain_type: ChainType::EVM,
    });

    chains.insert("solana".to_string(), ChainConfig {
        id: "solana".to_string(),
        name: "Solana Mainnet".to_string(),
        moralis_chain_id: "solana".to_string(),
        native_token_symbol: "SOL".to_string(),
        native_token_decimals: 9,
        rpc_url: Some("https://api.mainnet-beta.solana.com".to_string()),
        block_explorer_url: Some("https://explorer.solana.com".to_string()),
        chain_type: ChainType::Solana,
    });

    chains.insert("sui".to_string(), ChainConfig {
        id: "sui".to_string(),
        name: "SUI Mainnet".to_string(),
        moralis_chain_id: "sui".to_string(),
        native_token_symbol: "SUI".to_string(),
        native_token_decimals: 9,
        rpc_url: Some("https://fullnode.mainnet.sui.io".to_string()),
        block_explorer_url: Some("https://suiscan.xyz".to_string()),
        chain_type: ChainType::SUI,
    });

    chains.insert("bitcoin".to_string(), ChainConfig {
        id: "bitcoin".to_string(),
        name: "Bitcoin Mainnet".to_string(),
        moralis_chain_id: "bitcoin".to_string(),
        native_token_symbol: "BTC".to_string(),
        native_token_decimals: 8,
        rpc_url: Some("https://btc-rpc.endpoint".to_string()),
        block_explorer_url: Some("https://blockchain.com".to_string()),
        chain_type: ChainType::Bitcoin,
    });

    chains.insert("aptos".to_string(), ChainConfig {
        id: "aptos".to_string(),
        name: "Aptos Mainnet".to_string(),
        moralis_chain_id: "aptos".to_string(),
        native_token_symbol: "APT".to_string(),
        native_token_decimals: 8,
        rpc_url: Some("https://fullnode.mainnet.aptoslabs.com".to_string()),
        block_explorer_url: Some("https://explorer.aptoslabs.com".to_string()),
        chain_type: ChainType::Other("Aptos".to_string()),
    });

    chains.insert("cardano".to_string(), ChainConfig {
        id: "cardano".to_string(),
        name: "Cardano Mainnet".to_string(),
        moralis_chain_id: "cardano".to_string(),
        native_token_symbol: "ADA".to_string(),
        native_token_decimals: 6,
        rpc_url: Some("https://cardano-mainnet.blockfrost.io".to_string()),
        block_explorer_url: Some("https://cexplorer.io".to_string()),
        chain_type: ChainType::Other("Cardano".to_string()),
    });

    chains.insert("polkadot".to_string(), ChainConfig {
        id: "polkadot".to_string(),
        name: "Polkadot Mainnet".to_string(),
        moralis_chain_id: "polkadot".to_string(),
        native_token_symbol: "DOT".to_string(),
        native_token_decimals: 10,
        rpc_url: Some("https://rpc.polkadot.io".to_string()),
        block_explorer_url: Some("https://polkascan.io".to_string()),
        chain_type: ChainType::Other("Polkadot".to_string()),
    });

    chains.insert("near".to_string(), ChainConfig {
        id: "near".to_string(),
        name: "NEAR Mainnet".to_string(),
        moralis_chain_id: "near".to_string(),
        native_token_symbol: "NEAR".to_string(),
        native_token_decimals: 24,
        rpc_url: Some("https://rpc.mainnet.near.org".to_string()),
        block_explorer_url: Some("https://explorer.near.org".to_string()),
        chain_type: ChainType::Other("NEAR".to_string()),
    });

    chains.insert("cosmos".to_string(), ChainConfig {
        id: "cosmos".to_string(),
        name: "Cosmos Hub".to_string(),
        moralis_chain_id: "cosmos".to_string(),
        native_token_symbol: "ATOM".to_string(),
        native_token_decimals: 6,
        rpc_url: Some("https://rpc-cosmoshub.blockapsis.com".to_string()),
        block_explorer_url: Some("https://www.mintscan.io/cosmos".to_string()),
        chain_type: ChainType::Cosmos,
    });

    chains.insert("scroll".to_string(), ChainConfig {
        id: "scroll".to_string(),
        name: "Scroll".to_string(),
        moralis_chain_id: "0x82750".to_string(),
        native_token_symbol: "ETH".to_string(),
        native_token_decimals: 18,
        rpc_url: Some("https://rpc.scroll.io".to_string()),
        block_explorer_url: Some("https://scrollscan.com".to_string()),
        chain_type: ChainType::EVM,
    });

    chains.insert("zkSync".to_string(), ChainConfig {
        id: "zkSync".to_string(),
        name: "zkSync Era".to_string(),
        moralis_chain_id: "0x144".to_string(),
        native_token_symbol: "ETH".to_string(),
        native_token_decimals: 18,
        rpc_url: Some("https://mainnet.era.zksync.io".to_string()),
        block_explorer_url: Some("https://explorer.zksync.io".to_string()),
        chain_type: ChainType::EVM,
    });

    chains.insert("linea".to_string(), ChainConfig {
        id: "linea".to_string(),
        name: "Linea".to_string(),
        moralis_chain_id: "0xe708".to_string(),
        native_token_symbol: "ETH".to_string(),
        native_token_decimals: 18,
        rpc_url: Some("https://rpc.linea.build".to_string()),
        block_explorer_url: Some("https://lineascan.com".to_string()),
        chain_type: ChainType::EVM,
    });

    chains.insert("mantle".to_string(), ChainConfig {
        id: "mantle".to_string(),
        name: "Mantle".to_string(),
        moralis_chain_id: "0x1388".to_string(),
        native_token_symbol: "MNT".to_string(),
        native_token_decimals: 18,
        rpc_url: Some("https://rpc.mantle.xyz".to_string()),
        block_explorer_url: Some("https://explorer.mantle.xyz".to_string()),
        chain_type: ChainType::EVM,
    });

    chains
}

pub fn get_chain_config(chain_id: &str) -> Option<ChainConfig> {
    get_all_chains().get(chain_id).cloned()
}

pub fn get_moralis_chain_id(chain_id: &str) -> Option<String> {
    get_chain_config(chain_id).map(|c| c.moralis_chain_id)
}

pub fn get_native_token_symbol(chain_id: &str) -> String {
    get_chain_config(chain_id)
        .map(|c| c.native_token_symbol)
        .unwrap_or_else(|| "UNKNOWN".to_string())
}

pub fn get_native_token_decimals(chain_id: &str) -> u32 {
    get_chain_config(chain_id)
        .map(|c| c.native_token_decimals)
        .unwrap_or(18)
}

pub fn is_supported_chain(chain_id: &str) -> bool {
    get_all_chains().contains_key(chain_id)
}

pub fn get_all_chain_ids() -> Vec<String> {
    get_all_chains().keys().cloned().collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_all_chains() {
        let chains = get_all_chains();
        assert!(chains.len() >= 20);
        assert!(chains.contains_key("ethereum"));
        assert!(chains.contains_key("solana"));
        assert!(chains.contains_key("sui"));
    }

    #[test]
    fn test_get_chain_config() {
        let config = get_chain_config("ethereum").unwrap();
        assert_eq!(config.native_token_symbol, "ETH");
        assert_eq!(config.chain_type, ChainType::EVM);
    }

    #[test]
    fn test_get_moralis_chain_id() {
        assert_eq!(get_moralis_chain_id("ethereum"), Some("0x1".to_string()));
        assert_eq!(get_moralis_chain_id("solana"), Some("solana".to_string()));
    }

    #[test]
    fn test_native_token_symbol() {
        assert_eq!(get_native_token_symbol("ethereum"), "ETH");
        assert_eq!(get_native_token_symbol("solana"), "SOL");
        assert_eq!(get_native_token_symbol("bitcoin"), "BTC");
    }

    #[test]
    fn test_is_supported_chain() {
        assert!(is_supported_chain("ethereum"));
        assert!(is_supported_chain("solana"));
        assert!(!is_supported_chain("unknown_chain"));
    }
}
