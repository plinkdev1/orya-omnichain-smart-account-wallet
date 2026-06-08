/**
 * ORŸA Wallet Generator
 * Generates BIP39 mnemonic phrases and derives multi-chain wallets
 * Supports: Ethereum, Solana, SUI, Aptos
 * 
 * NOTE: Blockchain SDK imports are lazy-loaded as optional dependencies
 * This ensures wallet-core works in environments without all SDKs installed
 */

import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import HDKey from 'hdkey';
import * as nacl from 'tweetnacl';

export interface WalletAccount {
  address: string;
  publicKey: string;
  privateKey: string;
  path: string;
  chain: 'ethereum' | 'solana' | 'sui' | 'aptos';
}

export interface GeneratedWallet {
  mnemonic: string;
  seed: Buffer;
  accounts: {
    ethereum: WalletAccount;
    solana: WalletAccount;
    sui: WalletAccount;
    aptos: WalletAccount;
  };
}

/**
 * Lazy-load blockchain SDKs as optional dependencies
 * Prevents import errors in environments without all SDKs
 */
function getEthersWallet() {
  try {
    return require('ethers').Wallet;
  } catch {
    throw new Error('[wallet-core] ethers SDK not installed. Install with: npm install ethers');
  }
}

function getSolanaKeypair() {
  try {
    return require('@solana/web3.js').Keypair;
  } catch {
    throw new Error('[wallet-core] @solana/web3.js SDK not installed. Install with: npm install @solana/web3.js');
  }
}

function getSuiKeypair() {
  try {
    return require('@mysten/sui.js').Ed25519Keypair;
  } catch {
    throw new Error('[wallet-core] @mysten/sui.js SDK not installed. Install with: npm install @mysten/sui.js');
  }
}

function getAptosAccount() {
  try {
    return require('aptos').AptosAccount;
  } catch {
    throw new Error('[wallet-core] aptos SDK not installed. Install with: npm install aptos');
  }
}

/**
 * Generate a new BIP39 mnemonic phrase (12 or 24 words)
 */
export function generateMnemonic(strength: 128 | 256 = 128): string {
  return bip39.generateMnemonic(strength);
}

/**
 * Validate a BIP39 mnemonic
 */
export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}

/**
 * Generate seed from mnemonic
 */
export function mnemonicToSeed(mnemonic: string): Buffer {
  return bip39.mnemonicToSeedSync(mnemonic);
}

/**
 * Generate Ethereum wallet from seed
 */
function generateEthereumWallet(seed: Buffer, accountIndex: number = 0): WalletAccount {
  const hdkey = HDKey.fromMasterSeed(seed);
  const path = `m/44'/60'/0'/0/${accountIndex}`;
  const account = hdkey.derive(path);
  
  const EthersWallet = getEthersWallet();
  const privateKeyHex = Buffer.from(account.privateKey!).toString('hex');
  const wallet = new EthersWallet(privateKeyHex);
  
  return {
    address: wallet.address,
    publicKey: wallet.signingKey.publicKey,
    privateKey: wallet.privateKey,
    path,
    chain: 'ethereum',
  };
}

/**
 * Generate Solana wallet from seed
 */
function generateSolanaWallet(seed: Buffer, accountIndex: number = 0): WalletAccount {
  const path = `m/44'/501'/${accountIndex}'/0'`;
  const { key } = derivePath(path, seed.toString('hex'));
  
  const keypair = nacl.sign.keyPair.fromSeed(key);
  const publicKey = Buffer.from(keypair.publicKey).toString('base64');
  
  // For Solana, we store the seed for reconstruction
  const Keypair = getSolanaKeypair();
  const solanaKeypair = Keypair.fromSecretKey(Buffer.from(keypair.secretKey));
  
  return {
    address: solanaKeypair.publicKey.toBase58(),
    publicKey: publicKey,
    privateKey: Buffer.from(keypair.secretKey).toString('hex'),
    path,
    chain: 'solana',
  };
}

/**
 * Generate SUI wallet from seed
 */
function generateSuiWallet(seed: Buffer, accountIndex: number = 0): WalletAccount {
  const path = `m/44'/784'/${accountIndex}'/0'/0'`;
  const { key } = derivePath(path, seed.toString('hex'));
  
  const Ed25519Keypair = getSuiKeypair();
  const suiKeypair = Ed25519Keypair.fromSecretKey(key);
  const address = suiKeypair.getPublicKey().toSuiAddress();
  
  return {
    address: address,
    publicKey: suiKeypair.getPublicKey().toBase64(),
    privateKey: Buffer.from(key).toString('hex'),
    path,
    chain: 'sui',
  };
}

/**
 * Generate Aptos wallet from seed
 */
function generateAptosWallet(seed: Buffer, accountIndex: number = 0): WalletAccount {
  const path = `m/44'/637'/${accountIndex}'/0'/0'`;
  const { key } = derivePath(path, seed.toString('hex'));
  
  const AptosAccount = getAptosAccount();
  const account = new AptosAccount(Buffer.from(key));
  
  return {
    address: account.address().hex(),
    publicKey: account.pubKey().hex(),
    privateKey: Buffer.from(key).toString('hex'),
    path,
    chain: 'aptos',
  };
}

/**
 * Generate complete multi-chain wallet from mnemonic
 */
export function generateWallet(
  mnemonic: string,
  accountIndex: number = 0
): GeneratedWallet {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }

  const seed = mnemonicToSeed(mnemonic);

  return {
    mnemonic,
    seed,
    accounts: {
      ethereum: generateEthereumWallet(seed, accountIndex),
      solana: generateSolanaWallet(seed, accountIndex),
      sui: generateSuiWallet(seed, accountIndex),
      aptos: generateAptosWallet(seed, accountIndex),
    },
  };
}

/**
 * Import wallet from existing mnemonic
 */
export function importWallet(
  mnemonic: string,
  accountIndex: number = 0
): GeneratedWallet {
  return generateWallet(mnemonic, accountIndex);
}

/**
 * Generate multiple accounts from single mnemonic (for account switching)
 */
export function generateMultipleAccounts(
  mnemonic: string,
  count: number = 5
): GeneratedWallet[] {
  return Array.from({ length: count }, (_, i) => 
    generateWallet(mnemonic, i)
  );
}

/**
 * Export wallet to JSON (encrypted in production)
 */
export function exportWalletJSON(wallet: GeneratedWallet): string {
  return JSON.stringify({
    mnemonic: wallet.mnemonic,
    accounts: wallet.accounts,
    exportedAt: new Date().toISOString(),
  }, null, 2);
}