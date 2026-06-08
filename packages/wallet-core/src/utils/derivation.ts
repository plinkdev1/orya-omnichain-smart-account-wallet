/**
 * Address Derivation Logic
 * Utilities for deriving addresses from seeds/keys across different chains
 * 
 * Supports:
 * - BIP44 derivation (Ethereum, Bitcoin, Solana)
 * - SUI address derivation
 * - Other chain-specific derivation schemes
 */

import * as bip39 from 'bip39';
import { Keypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import * as hdkey from 'hdkey';

let HDNode: any = null;
try {
  const ethers = require('ethers');
  HDNode = ethers.HDNode;
} catch {
  HDNode = {
    fromSeed: (seed: Buffer) => ({
      address: '0x0',
      publicKey: '0x0',
      derivePath: (path: string) => ({ address: '0x0', publicKey: '0x0' })
    })
  };
}

export interface DerivationPath {
  purpose: number;
  coinType: number;
  account: number;
  change: number;
  addressIndex: number;
}

export interface DerivedAddress {
  path: string;
  address: string;
  publicKey: string;
  chainId: string;
}

export interface DerivedAddressWithChain {
  chainId: string;
  address: string;
  derivationPath: string;
}

/**
 * Standard BIP44 coin types
 */
export const BIP44_COIN_TYPES = {
  ETHEREUM: 60,
  BITCOIN: 0,
  SOLANA: 501,
  APTOS: 637,
  MOVE: 637, // Same as Aptos
} as const;

/**
 * Standard derivation path construction
 */
export function constructDerivationPath(
  purpose: number = 44,
  coinType: number,
  account: number = 0,
  change: number = 0,
  addressIndex: number = 0
): string {
  return `m/${purpose}'/${coinType}'/${account}'/${change}/${addressIndex}`;
}

/**
 * Parse BIP44 derivation path
 */
export function parseDerivationPath(path: string): DerivationPath | null {
  // Format: m/44'/60'/0'/0/0
  const pattern = /^m\/(\d+)'\/(\d+)'\/(\d+)'\/(\d+)\/(\d+)$/;
  const match = path.match(pattern);

  if (!match) {
    return null;
  }

  return {
    purpose: parseInt(match[1], 10),
    coinType: parseInt(match[2], 10),
    account: parseInt(match[3], 10),
    change: parseInt(match[4], 10),
    addressIndex: parseInt(match[5], 10),
  };
}

/**
 * Generate Ethereum addresses from HD wallet
 * Uses BIP44 with coin type 60
 */
export function generateEthereumDerivationPath(
  accountIndex: number = 0,
  addressIndex: number = 0
): string {
  return constructDerivationPath(44, BIP44_COIN_TYPES.ETHEREUM, accountIndex, 0, addressIndex);
}

/**
 * Generate Bitcoin addresses from HD wallet
 * Uses BIP44 with coin type 0
 */
export function generateBitcoinDerivationPath(
  accountIndex: number = 0,
  addressIndex: number = 0,
  change: number = 0
): string {
  return constructDerivationPath(44, BIP44_COIN_TYPES.BITCOIN, accountIndex, change, addressIndex);
}

/**
 * Generate Solana addresses from HD wallet
 * Uses BIP44 with coin type 501
 */
export function generateSolanaDerivationPath(accountIndex: number = 0): string {
  return constructDerivationPath(44, BIP44_COIN_TYPES.SOLANA, accountIndex, 0, 0);
}

/**
 * Generate Aptos/Movement addresses from HD wallet
 * Uses BIP44 with coin type 637
 */
export function generateAptosDerivationPath(accountIndex: number = 0): string {
  return constructDerivationPath(44, BIP44_COIN_TYPES.APTOS, accountIndex, 0, 0);
}

/**
 * SUI address derivation
 * SUI uses Ed25519 keys with specific derivation
 */
export function generateSuiDerivationPath(accountIndex: number = 0): string {
  // SUI derivation path format: m/44'/784'/0'/0'/0'
  return `m/44'/784'/0'/${accountIndex}'/0'`;
}

/**
 * Validate derivation path format
 */
export function isValidDerivationPath(path: string): boolean {
  if (!path.startsWith("m/")) return false;

  const pattern = /^m\/(\d+)'?\/(\d+)'?\/(\d+)'?\/(\d+)\/(\d+)$/;
  return pattern.test(path);
}

/**
 * Generate multiple derivation paths (for batch address generation)
 */
export function generateDerivationPaths(
  coinType: number,
  startIndex: number = 0,
  count: number = 5,
  accountIndex: number = 0
): string[] {
  const paths: string[] = [];

  for (let i = 0; i < count; i++) {
    const path = constructDerivationPath(
      44,
      coinType,
      accountIndex,
      0,
      startIndex + i
    );
    paths.push(path);
  }

  return paths;
}

/**
 * Chain-specific derivation helpers
 */
export const ChainDerivation = {
  ethereum: {
    coinType: BIP44_COIN_TYPES.ETHEREUM,
    getPath: (index?: number) =>
      generateEthereumDerivationPath(0, index || 0),
  },
  bitcoin: {
    coinType: BIP44_COIN_TYPES.BITCOIN,
    getPath: (index?: number) =>
      generateBitcoinDerivationPath(0, index || 0, 0),
  },
  solana: {
    coinType: BIP44_COIN_TYPES.SOLANA,
    getPath: (index?: number) =>
      generateSolanaDerivationPath(index || 0),
  },
  aptos: {
    coinType: BIP44_COIN_TYPES.APTOS,
    getPath: (index?: number) =>
      generateAptosDerivationPath(index || 0),
  },
  sui: {
    coinType: 784,
    getPath: (index?: number) =>
      generateSuiDerivationPath(index || 0),
  },
} as const;

/**
 * Utility to get derivation path for any chain
 */
export function getChainDerivationPath(
  chainId: string,
  accountIndex: number = 0
): string | null {
  const chainKey = chainId.toLowerCase();

  switch (chainKey) {
    case 'ethereum':
    case 'eth':
      return generateEthereumDerivationPath(accountIndex);
    case 'bitcoin':
    case 'btc':
      return generateBitcoinDerivationPath(accountIndex);
    case 'solana':
    case 'sol':
      return generateSolanaDerivationPath(accountIndex);
    case 'aptos':
      return generateAptosDerivationPath(accountIndex);
    case 'sui':
      return generateSuiDerivationPath(accountIndex);
    default:
      return null;
  }
}

function isEVMChain(chain: string): boolean {
  const evmChains = ['ethereum', 'polygon', 'base', 'arbitrum', 'optimism', 'bsc', 'eth'];
  return evmChains.includes(chain.toLowerCase());
}

async function deriveSuiAddress(seed: Uint8Array): Promise<string> {
  try {
    let Ed25519Keypair: any;
    try {
      const module = await import('@mysten/sui.js/keypairs/ed25519');
      Ed25519Keypair = module.Ed25519Keypair;
    } catch {
      try {
        // @ts-ignore - Dynamic import fallback for @mysten/sui
        const module = await eval(`import('@mysten/sui')`);
        Ed25519Keypair = module.Ed25519Keypair;
      } catch (err) {
        return '0x0';
      }
    }
    
    if (Ed25519Keypair.fromSeed) {
      const keypair = Ed25519Keypair.fromSeed(seed);
      return keypair.getPublicKey().toSuiAddress();
    } else {
      return '0x0';
    }
  } catch (error) {
    throw new Error(`Failed to derive SUI address: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function deriveAptosAddress(seed: Uint8Array): Promise<string> {
  try {
    const { AptosAccount } = await import('aptos');
    const account = new AptosAccount(Buffer.from(seed));
    return account.address().hex();
  } catch (error) {
    throw new Error(`Failed to derive Aptos address: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function deriveAddressesFromSeed(
  mnemonic: string,
  chains: string[]
): Promise<Map<string, DerivedAddressWithChain>> {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }

  const addresses = new Map<string, DerivedAddressWithChain>();
  const seed = await bip39.mnemonicToSeed(mnemonic);

  for (const chain of chains) {
    const chainLower = chain.toLowerCase();
    const derivationPath = getChainDerivationPath(chainLower);

    if (!derivationPath) {
      throw new Error(`No derivation path for chain: ${chain}`);
    }

    let address: string;

    try {
      if (isEVMChain(chainLower)) {
        const hdNode = HDNode.fromSeed(seed);
        const derived = hdNode.derivePath(derivationPath);
        address = derived.address;
      } else if (chainLower === 'solana' || chainLower === 'sol') {
        const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
        const keypair = Keypair.fromSeed(derivedSeed);
        address = keypair.publicKey.toBase58();
      } else if (chainLower === 'sui') {
        const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
        address = await deriveSuiAddress(derivedSeed);
      } else if (chainLower === 'aptos') {
        const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
        address = await deriveAptosAddress(derivedSeed);
      } else if (chainLower === 'bitcoin' || chainLower === 'btc') {
        const hdNode = HDNode.fromSeed(seed);
        const derived = hdNode.derivePath(derivationPath);
        address = derived.address || derived.publicKey;
      } else {
        throw new Error(`Unsupported chain type: ${chain}`);
      }

      addresses.set(chainLower, {
        chainId: chainLower,
        address,
        derivationPath,
      });
    } catch (error) {
      throw new Error(`Failed to derive address for chain ${chain}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return addresses;
}

export async function testDerivation(): Promise<void> {
  const mnemonic = bip39.generateMnemonic();
  const chains = ['ethereum', 'polygon', 'solana', 'sui', 'aptos'];
  const addresses = await deriveAddressesFromSeed(mnemonic, chains);

  console.log('Mnemonic:', mnemonic);
  console.log('\nDerived Addresses:');
  addresses.forEach((addr) => {
    console.log(`${addr.chainId}: ${addr.address} (${addr.derivationPath})`);
  });

  const ethAddr = addresses.get('ethereum')?.address;
  const polyAddr = addresses.get('polygon')?.address;
  console.log('\nEVM chains same address?', ethAddr === polyAddr);
}