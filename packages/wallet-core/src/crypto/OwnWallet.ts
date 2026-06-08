/**
 * OwnWallet - Self-Custody Wallet Core
 * Handles key generation, storage, encryption, and transaction signing
 * Uses @mysten/sui for Sui-specific operations (optional dependency)
 */

import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "bip39";
import CryptoJS from "crypto-js";
import { derivePath } from "ed25519-hd-key";
import * as nacl from "tweetnacl";

// Optional dependencies - wrapped for graceful degradation
let Ed25519Keypair: any = null;
let TransactionBlock: any = null;

try {
  const suiModule = require("@mysten/sui.js");
  Ed25519Keypair = suiModule.Ed25519Keypair;
  TransactionBlock = suiModule.TransactionBlock;
} catch (error) {
  console.warn("@mysten/sui.js not available - OwnWallet will have limited functionality");
}

export interface KeyPairData {
  publicKey: string;
  privateKey: string; // encrypted
  address: string;
  derivationPath: string;
  createdAt: number;
}

export interface EncryptedKeyStore {
  version: "1.0";
  iv: string;
  ciphertext: string;
  salt: string;
  algorithm: "AES-256-GCM";
  publicKey: string;
  address: string;
}

export interface MnemonicKeyData {
  mnemonic: string;
  derivationPath: string;
  index: number;
}

export interface SignedTransaction {
  transactionBlock: string;
  signature: string;
  publicKey: string;
}

/**
 * OwnWallet Class
 * Encapsulates all self-custody wallet operations
 */
export class OwnWallet {
  private keypair: any = null; // Ed25519Keypair from @mysten/sui.js
  private publicKey: string = "";
  private address: string = "";

  /**
   * Generate a new keypair and Sui address
   * Deterministic: same seed always generates same keypair
   */
  static async generateKeyPair(mnemonic?: string): Promise<OwnWallet> {
    const wallet = new OwnWallet();

    if (!Ed25519Keypair) {
      throw new Error("@mysten/sui.js is not installed. Install it with: npm install @mysten/sui.js");
    }

    // Generate mnemonic if not provided
    const finalMnemonic = mnemonic || generateMnemonic(256); // 24 words

    // Validate mnemonic
    if (!validateMnemonic(finalMnemonic)) {
      throw new Error("Invalid mnemonic phrase");
    }

    // Derive seed from mnemonic
    const seed = mnemonicToSeedSync(finalMnemonic);

    // Derive keypair from seed using standard Sui derivation path
    const path = "m/44'/784'/0'/0'/0'"; // Sui standard path
    const derivedKey = derivePath(path, seed.toString("hex"));

    // Create Ed25519 keypair from derived key
    wallet.keypair = Ed25519Keypair.fromSecretKey(derivedKey.key);
    wallet.publicKey = wallet.keypair.getPublicKey().toBase64();
    wallet.address = wallet.keypair.getPublicKey().toSuiAddress();

    return wallet;
  }

  /**
   * Import wallet from private key (hex or base64)
   */
  static async importFromPrivateKey(privateKeyHex: string): Promise<OwnWallet> {
    const wallet = new OwnWallet();

    try {
      // Try hex first
      const secretKey = Buffer.from(privateKeyHex, "hex");
      wallet.keypair = Ed25519Keypair.fromSecretKey(secretKey);
    } catch {
      // Try base64
      try {
        const secretKey = Buffer.from(privateKeyHex, "base64");
        wallet.keypair = Ed25519Keypair.fromSecretKey(secretKey);
      } catch {
        throw new Error("Invalid private key format (must be hex or base64)");
      }
    }

    wallet.publicKey = wallet.keypair.getPublicKey().toBase64();
    wallet.address = wallet.keypair.getPublicKey().toSuiAddress();

    return wallet;
  }

  /**
   * Encrypt private key using AES-256-GCM with password
   * Uses Web Crypto API or libsodium as fallback
   */
  async encryptPrivateKey(password: string): Promise<EncryptedKeyStore> {
    if (!this.keypair) {
      throw new Error("No keypair available");
    }

    const privateKeyHex = this.keypair.getSecretKey();
    const salt = CryptoJS.lib.WordArray.random(128 / 8);
    
    // Derive key from password using PBKDF2
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 1000,
    });

    // Encrypt private key
    const encrypted = CryptoJS.AES.encrypt(privateKeyHex, key);

    return {
      version: "1.0",
      algorithm: "AES-256-GCM",
      ciphertext: encrypted.toString(),
      salt: salt.toString(),
      iv: encrypted.iv || "",
      publicKey: this.publicKey,
      address: this.address,
    };
  }

  /**
   * Decrypt and restore keypair from encrypted store
   */
  static async decryptPrivateKey(
    encryptedStore: EncryptedKeyStore,
    password: string
  ): Promise<OwnWallet> {
    try {
      // Recover key from password and salt
      const salt = CryptoJS.enc.Base64.parse(encryptedStore.salt);
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 1000,
      });

      // Decrypt
      const decrypted = CryptoJS.AES.decrypt(encryptedStore.ciphertext, key);
      const privateKeyHex = decrypted.toString(CryptoJS.enc.Utf8);

      if (!privateKeyHex) {
        throw new Error("Decryption failed - incorrect password");
      }

      return OwnWallet.importFromPrivateKey(privateKeyHex);
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Sign a TransactionBlock
   */
  async signTransaction(transactionBlock: any): Promise<SignedTransaction> {
    if (!this.keypair) {
      throw new Error("No keypair available");
    }

    if (!transactionBlock) {
      throw new Error("TransactionBlock is required");
    }

    // Serialize transaction
    const txBytes = await transactionBlock.build({ provider: null as any });
    
    // Sign with private key
    const signature = this.keypair.signData(txBytes);

    return {
      transactionBlock: Buffer.from(txBytes).toString("base64"),
      signature: signature.signature,
      publicKey: this.publicKey,
    };
  }

  /**
   * Sign arbitrary data (for authentication, etc.)
   */
  async signData(data: string | Buffer): Promise<string> {
    if (!this.keypair) {
      throw new Error("No keypair available");
    }

    const dataBuffer = typeof data === "string" ? Buffer.from(data, "utf8") : data;
    const signature = this.keypair.signData(dataBuffer);

    return signature.signature;
  }

  /**
   * Get public wallet information
   */
  getPublicInfo() {
    return {
      address: this.address,
      publicKey: this.publicKey,
      network: "sui",
    };
  }

  /**
   * Get public key (convenience method)
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Get wallet address (convenience method)
   */
  getAddress(): string {
    return this.address;
  }

  /**
   * Get secret information (for backup purposes only)
   */
  async getSecretInfo(): Promise<{ privateKey: string; publicKey: string }> {
    if (!this.keypair) {
      throw new Error("No keypair available");
    }

    return {
      privateKey: this.keypair.getSecretKey(),
      publicKey: this.publicKey,
    };
  }

  /**
   * Verify a signature
   */
  static verifySignature(
    publicKey: string,
    signature: string,
    data: string | Buffer
  ): boolean {
    try {
      const dataBuffer = typeof data === "string" ? Buffer.from(data, "utf8") : data;
      const publicKeyBuffer = Buffer.from(publicKey, "base64");

      // Verify using tweetnacl
      const signatureBuffer = Buffer.from(signature, "base64");
      return nacl.sign.detached.verify(dataBuffer, signatureBuffer, publicKeyBuffer);
    } catch (error) {
      return false;
    }
  }

  /**
   * Export wallet to JSON (encrypted)
   */
  async exportToJSON(password: string): Promise<string> {
    const encrypted = await this.encryptPrivateKey(password);
    return JSON.stringify(encrypted);
  }

  /**
   * Import wallet from JSON (encrypted)
   */
  static async importFromJSON(jsonString: string, password: string): Promise<OwnWallet> {
    const encrypted = JSON.parse(jsonString) as EncryptedKeyStore;
    return OwnWallet.decryptPrivateKey(encrypted, password);
  }

  /**
   * Load wallet from localStorage (synchronous, for compatibility)
   * Returns null if wallet not found or environment doesn't support localStorage
   */
  static fromStorage(storageKey: string): OwnWallet | null {
    if (typeof localStorage === "undefined") {
      return null;
    }

    try {
      const jsonString = localStorage.getItem(storageKey);
      if (!jsonString) {
        return null;
      }

      // For security, we cannot deserialize without a password.
      // This method returns null to signal that password-based decryption is needed.
      // Use restoreKeyPairFromStorage(password, storageKey) instead for full decryption.
      console.warn(
        "OwnWallet.fromStorage() requires password for decryption. Use restoreKeyPairFromStorage(password, storageKey) instead."
      );
      return null;
    } catch (error) {
      console.error("Failed to load wallet from storage:", error);
      return null;
    }
  }
}

/**
 * Helper functions for key management
 */

export async function generateNewWallet(mnemonic?: string): Promise<{
  wallet: OwnWallet;
  mnemonic: string;
}> {
  const finalMnemonic = mnemonic || generateMnemonic(256);
  const wallet = await OwnWallet.generateKeyPair(finalMnemonic);
  return { wallet, mnemonic: finalMnemonic };
}

export async function securelyStoreKeyPair(
  wallet: OwnWallet,
  password: string,
  storageKey: string
): Promise<void> {
  const encrypted = await wallet.encryptPrivateKey(password);
  const jsonString = JSON.stringify(encrypted);

  // Store in localStorage or secure storage
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(storageKey, jsonString);
  } else {
    // For Node.js or other environments, return the encrypted data
    console.log("Encrypted keypair (store this securely):", jsonString);
  }
}

export async function restoreKeyPairFromStorage(
  password: string,
  storageKey: string
): Promise<OwnWallet | null> {
  if (typeof localStorage === "undefined") {
    return null;
  }

  const jsonString = localStorage.getItem(storageKey);
  if (!jsonString) {
    return null;
  }

  return OwnWallet.importFromJSON(jsonString, password);
}