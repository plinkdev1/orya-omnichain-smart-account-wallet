/**
 * Step 4A: TransactionRouter
 * Routes transactions to appropriate wallet backend (OwnWallet, WalletKit, WalletConnect)
 */

// ReOwn integration disabled temporarily due to SDK incompatibilities
// import { ReownAdapter } from './reown/ReownAdapter';
// import type { SigningRequest } from './reown/sessionStore';
import type { SigningRequest } from './WalletConnectManager';

// Optional import - @mysten/sui.js is optional and may not be installed
let TransactionBlock: any = null;
try {
  const sui = require("@mysten/sui.js");
  TransactionBlock = sui.TransactionBlock;
} catch (e) {
  // @mysten/sui.js not installed, will fallback to generic transaction handling
}

export interface SigningBackend {
  name: string;
  signTransaction(tx?: any): Promise<{ signature: string; publicKey: string }>;
  signData(data: string): Promise<{ signature: string; publicKey: string }>;
  getPublicKey(): string;
  isAvailable(): boolean;
}

export interface TransactionRoute {
  backend: "own-wallet" | "sui-wallet-kit" | "wallet-connect" | "privy" | "reown-evm" | "reown-solana";
  wallet: SigningBackend;
}

/**
 * Main transaction router for managing multiple wallet backends
 */
export class TransactionRouter {
  private currentRoute: TransactionRoute | null = null;
  private backends: Map<string, SigningBackend> = new Map();

  /**
   * Register a wallet backend
   */
  registerBackend(name: string, backend: SigningBackend): void {
    this.backends.set(name, backend);
  }

  /**
   * Set the active backend for signing operations
   */
  setActiveBackend(name: string): boolean {
    const backend = this.backends.get(name);
    if (!backend) {
      console.error(`Backend not found: ${name}`);
      return false;
    }

    if (!backend.isAvailable()) {
      console.error(`Backend not available: ${name}`);
      return false;
    }

    this.currentRoute = {
      backend: (name as any),
      wallet: backend,
    };
    return true;
  }

  /**
   * Get currently active backend
   */
  getActiveBackend(): SigningBackend | null {
    return this.currentRoute?.wallet || null;
  }

  /**
   * Get active backend name
   */
  getActiveBackendName(): string | null {
    return this.currentRoute?.backend || null;
  }

  /**
   * Check if a backend is registered
   */
  isBackendAvailable(name: string): boolean {
    const backend = this.backends.get(name);
    return backend ? backend.isAvailable() : false;
  }

  /**
   * Get list of available backends
   */
  getAvailableBackends(): string[] {
    return Array.from(this.backends.entries())
      .filter(([_, backend]) => backend.isAvailable())
      .map(([name, _]) => name);
  }

  /**
   * Sign a transaction block
   */
  async signTransaction(tx?: any): Promise<{ signature: string; publicKey: string }> {
    if (!this.currentRoute) {
      throw new Error("No wallet backend configured");
    }

    try {
      return await this.currentRoute.wallet.signTransaction(tx);
    } catch (error) {
      console.error(`Transaction signing failed with backend: ${this.currentRoute.backend}`, error);
      throw new Error(`Failed to sign transaction: ${(error as any).message}`);
    }
  }

  /**
   * Sign arbitrary data
   */
  async signData(data: string): Promise<{ signature: string; publicKey: string }> {
    if (!this.currentRoute) {
      throw new Error("No wallet backend configured");
    }

    try {
      return await this.currentRoute.wallet.signData(data);
    } catch (error) {
      console.error(`Data signing failed with backend: ${this.currentRoute.backend}`, error);
      throw new Error(`Failed to sign data: ${(error as any).message}`);
    }
  }

  /**
   * Get public key from active backend
   */
  getPublicKey(): string {
    if (!this.currentRoute) {
      throw new Error("No wallet backend configured");
    }
    return this.currentRoute.wallet.getPublicKey();
  }
}

/**
 * Adapter for OwnWallet backend
 */
export class OwnWalletBackend implements SigningBackend {
  name = "own-wallet";
  private wallet: any; // OwnWallet type
  private _isAvailable: boolean = false;

  constructor(wallet: any) {
    this.wallet = wallet;
    this._isAvailable = !!wallet;
  }

  async signTransaction(tx?: any): Promise<{ signature: string; publicKey: string }> {
    const signed = await this.wallet?.signTransaction?.(tx);
    if (!signed) {
      throw new Error('Failed to sign transaction with OwnWallet');
    }
    
    // Convert signature and publicKey to base64 if they're buffers
    let signature = signed.signature;
    let publicKey = signed.publicKey;
    
    if (signature instanceof Uint8Array || Buffer.isBuffer(signature)) {
      signature = Buffer.from(signature).toString('base64');
    }
    if (publicKey instanceof Uint8Array || Buffer.isBuffer(publicKey)) {
      publicKey = Buffer.from(publicKey).toString('base64');
    }
    
    return {
      signature: String(signature),
      publicKey: String(publicKey),
    };
  }

  async signData(data: string): Promise<{ signature: string; publicKey: string }> {
    const messageBytes = new TextEncoder().encode(data);
    const signature = await this.wallet?.signData?.(messageBytes);
    if (!signature) {
      throw new Error('Failed to sign data with OwnWallet');
    }
    return {
      signature: typeof signature.signature === 'string' ? signature.signature : Buffer.from(signature.signature).toString('base64'),
      publicKey: typeof signature.publicKey === 'string' ? signature.publicKey : Buffer.from(signature.publicKey).toString('base64'),
    };
  }

  getPublicKey(): string {
    return this.wallet?.getPublicKey?.() || '';
  }

  isAvailable(): boolean {
    return this._isAvailable;
  }

  setAvailability(available: boolean): void {
    this._isAvailable = available;
  }
}

/**
 * Adapter for Sui Standard Wallet Kit
 */
export class SuiWalletKitBackend implements SigningBackend {
  name = "sui-wallet-kit";
  private connectedWallet: any; // WalletAdapter from wallet-kit
  private _isAvailable: boolean = false;

  constructor(wallet: any) {
    this.connectedWallet = wallet;
    this._isAvailable = !!wallet;
  }

  async signTransaction(tx?: any): Promise<{ signature: string; publicKey: string }> {
    if (!this.connectedWallet) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await this.connectedWallet.signTransaction(tx);
      return {
        signature: result.signature || result.transactionSignature,
        publicKey: result.publicKey || this.connectedWallet.getPublicKey(),
      };
    } catch (error) {
      throw new Error(`WalletKit signing failed: ${(error as any).message}`);
    }
  }

  async signData(data: string): Promise<{ signature: string; publicKey: string }> {
    if (!this.connectedWallet) {
      throw new Error("Wallet not connected");
    }

    try {
      const messageBytes = new TextEncoder().encode(data);
      const result = await this.connectedWallet.signData(messageBytes);
      return {
        signature: result.signature || result.dataSignature,
        publicKey: result.publicKey || this.connectedWallet.getPublicKey(),
      };
    } catch (error) {
      throw new Error(`WalletKit data signing failed: ${(error as any).message}`);
    }
  }

  getPublicKey(): string {
    return this.connectedWallet?.getPublicKey?.() || "";
  }

  isAvailable(): boolean {
    return this._isAvailable && this.connectedWallet?.connected === true;
  }

  setConnectedWallet(wallet: any): void {
    this.connectedWallet = wallet;
    this._isAvailable = !!wallet;
  }
}

// ReOwn backend classes disabled - ReownAdapter integration to be re-implemented with updated SDK
// class ReownSigningBackendBase implements SigningBackend {
//   name: string;
//   protected readonly resolveStatuses: SigningRequest['status'][] = ['signed', 'broadcasted', 'confirmed', 'failed', 'rejected'];
//
//   constructor(
//     name: 'reown-evm' | 'reown-solana',
//     protected readonly adapter: ReownAdapter
//   ) {
//     this.name = name;
//   }
//   ...rest of implementation...
// }

export class ReownEvmBackend implements SigningBackend {
  name = 'reown-evm';
  
  constructor(private adapter?: any) {}
  
  async signTransaction(tx?: any): Promise<{ signature: string; publicKey: string }> {
    throw new Error('ReOwn EVM backend not available - currently integrating new SDK');
  }
  async signData(data: string): Promise<{ signature: string; publicKey: string }> {
    throw new Error('ReOwn EVM backend not available - currently integrating new SDK');
  }
  getPublicKey(): string {
    return '';
  }
  isAvailable(): boolean {
    return false;
  }
}

export class ReownSolanaBackend implements SigningBackend {
  name = 'reown-solana';
  
  constructor(private adapter?: any) {}
  
  async signTransaction(tx?: any): Promise<{ signature: string; publicKey: string }> {
    throw new Error('ReOwn Solana backend not available - currently integrating new SDK');
  }
  async signData(data: string): Promise<{ signature: string; publicKey: string }> {
    throw new Error('ReOwn Solana backend not available - currently integrating new SDK');
  }
  getPublicKey(): string {
    return '';
  }
  isAvailable(): boolean {
    return false;
  }
}

/**
 * Global transaction router instance
 */
let globalRouter: TransactionRouter | null = null;

/**
 * Initialize global transaction router
 */
export function initializeTransactionRouter(): TransactionRouter {
  if (!globalRouter) {
    globalRouter = new TransactionRouter();
  }
  return globalRouter;
}

/**
 * Get global transaction router
 */
export function getTransactionRouter(): TransactionRouter {
  if (!globalRouter) {
    globalRouter = initializeTransactionRouter();
  }
  return globalRouter;
}