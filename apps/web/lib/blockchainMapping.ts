/**
 * BLOCKCHAIN NAME MAPPING
 * Maps common chain names to standardized icon names
 * For use with BlockchainIcon component
 */

export interface BlockchainInfo {
  name: string
  symbol: string
  category: "Layer 1" | "Layer 2"
  iconName: string // Name to use with BlockchainIcon component
  color?: string // Fallback color if icon not found
}

// Comprehensive mapping of all supported blockchains
// Maps display names to icon system names
const nameToIconMap: Record<string, string> = {
  // Layer 1 - Primary chains with direct icon support
  "bitcoin": "bitcoin",
  "bitcoincash": "bitcoin-cash",
  "ethereum": "ethereum",
  "binance coin": "binancecoin",
  "bsc": "binancecoin",
  "solana": "solana",
  "polygon": "polygon",
  "avalanche": "avalanche",
  "tron": "tron",
  "cardano": "cardano",
  "algorand": "algorand",
  "near": "near",
  "tezos": "tezos",
  "cosmos": "cosmos",
  "filecoin": "filecoin",
  "stellar": "stellar",
  "hedera": "hedera",
  "klaytn": "klaytn",
  "aptos": "aptos",
  "sui": "sui",
  "fantom": "fantom",
  "polkadot": "polkadot",
  "ripple": "ripple",
  "xrpl": "ripple",
  "litecoin": "litecoin",
  "dogecoin": "dogecoin",
  "monero": "monero",
  "zcash": "zcash",
  "chainlink": "chainlink",

  // Layer 2 and other chains that map to Layer 1 icons
  "arbitrum": "arbitrum",
  "optimism": "optimism",
  "op mainnet": "optimism",
  "base": "ethereum", // EVM chain, use ETH icon
  "plasma": "ethereum",
  "polygon zkEVM": "polygon",
  
  // Additional common names
  "bitcoin cash": "bitcoin-cash",
  "binancecoin": "binancecoin",
  "bnb": "binancecoin",
  "eth": "ethereum",
  "btc": "bitcoin",
  "sol": "solana",
  "matic": "polygon",
  "avax": "avalanche",
  "trx": "tron",
  "ada": "cardano",
  "algo": "algorano",
  "xlm": "stellar",
  "xrp": "ripple",
  "ltc": "litecoin",
  "doge": "dogecoin",
  "xmr": "monero",
  "zec": "zcash",
  "arb": "arbitrum",
  "op": "optimism",
  "ftm": "fantom",
  "dot": "polkadot",
  "atom": "cosmos",
  "fil": "filecoin",
  "near": "near",
  "apt": "aptos",
  "sui": "sui",
}

/**
 * Normalize a blockchain name to match icon system
 */
export function normalizeBlockchainName(name: string): string | null {
  const normalized = name.toLowerCase().trim()
  return nameToIconMap[normalized] || null
}

/**
 * Get icon name for a blockchain, with fallback
 */
export function getBlockchainIconName(name: string): string {
  return normalizeBlockchainName(name) || name.toLowerCase()
}

/**
 * Check if a blockchain has an icon available in the system
 */
export function hasBlockchainIcon(name: string): boolean {
  return normalizeBlockchainName(name) !== null
}

// List of all blockchains with direct icon support
export const SUPPORTED_BLOCKCHAINS = [
  "bitcoin",
  "bitcoin-cash",
  "ethereum",
  "binancecoin",
  "solana",
  "polygon",
  "avalanche",
  "tron",
  "cardano",
  "algorand",
  "near",
  "tezos",
  "cosmos",
  "filecoin",
  "stellar",
  "hedera",
  "klaytn",
  "aptos",
  "sui",
  "fantom",
  "polkadot",
  "ripple",
  "litecoin",
  "dogecoin",
  "monero",
  "zcash",
  "chainlink",
  "arbitrum",
  "optimism",
]

export default {
  normalizeBlockchainName,
  getBlockchainIconName,
  hasBlockchainIcon,
  SUPPORTED_BLOCKCHAINS,
}