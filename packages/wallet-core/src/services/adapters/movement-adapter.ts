import type { Chain } from '@orya/shared-types';
import { ChainType } from '@orya/shared-types';

export interface MovementAccount {
  address: string;
  sequence_number: number;
  authentication_key: string;
}

export interface MovementSignableTransaction {
  sender: string;
  payload: any;
  options?: {
    maxGasAmount?: number;
    gasUnitPrice?: number;
    sequenceNumber?: number;
    expirationSeconds?: number;
  };
}

export type MovementAccountAuthenticator = any;
export type MovementPendingTransactionResponse = any;

export interface MovementWalletAccount {
  address: string;
  publicKey: string;
  authKey: string;
}

export interface MovementTransactionOptions {
  maxGasAmount?: number;
  gasUnitPrice?: number;
  sequenceNumber?: number;
  expirationSeconds?: number;
}

export interface MovementSignatureScheme {
  type: 'SingleSignatureScheme' | 'MultiSignatureScheme' | 'MultiEd25519Scheme';
  threshold?: number;
  publicKeys?: string[];
}

export class MovementAdapter {
  private chain: Chain;
  private account: MovementWalletAccount | null = null;

  constructor(chainIdOrChain: string | Chain) {
    let chain: Chain;
    
    if (typeof chainIdOrChain === 'string') {
      const chainId = chainIdOrChain;
      chain = {
        id: chainId,
        type: ChainType.MOVEMENT,
        name: 'Movement',
        network: chainId.includes('testnet') ? 'testnet' : chainId.includes('devnet') ? 'devnet' : 'mainnet' as any,
        rpcUrl: '',
        blockExplorer: '',
        nativeCoin: { symbol: 'MOVE', decimals: 8 },
        chainId: chainId,
        isActive: true,
        priority: 0,
      };
    } else {
      chain = chainIdOrChain;
      if (chain.type !== ChainType.MOVEMENT) {
        throw new Error(`Invalid chain type for MovementAdapter: ${chain.type}`);
      }
    }

    this.chain = chain;
  }

  private getNetworkFromChain(chain: Chain): string {
    if (chain.id.includes('testnet')) return 'testnet';
    if (chain.id.includes('devnet')) return 'devnet';
    return 'mainnet';
  }

  async getAccountInfo(address: string): Promise<MovementAccount> {
    return {
      address,
      sequence_number: 0,
      authentication_key: '',
    };
  }

  async getBalance(address: string): Promise<number> {
    try {
      return 0;
    } catch (error) {
      console.error('Failed to get Movement balance:', error);
      return 0;
    }
  }

  async buildTransaction(
    senderAddress: string,
    payload: any,
    options: MovementTransactionOptions = {}
  ): Promise<MovementSignableTransaction> {
    try {
      return {
        sender: senderAddress,
        payload,
        options: {
          maxGasAmount: options.maxGasAmount || 100000,
          gasUnitPrice: options.gasUnitPrice || 100,
          sequenceNumber: options.sequenceNumber || 0,
          expirationSeconds: options.expirationSeconds || 600,
        },
      };
    } catch (error) {
      throw new Error(`Failed to build Movement transaction: ${error}`);
    }
  }

  async submitTransaction(signedTxn: MovementAccountAuthenticator): Promise<MovementPendingTransactionResponse> {
    try {
      return null as any;
    } catch (error) {
      throw new Error(`Failed to submit Movement transaction: ${error}`);
    }
  }

  async waitForTransaction(txnHash: string, options = { timeout: 30000 }): Promise<any> {
    try {
      return null;
    } catch (error) {
      throw new Error(`Failed to wait for Movement transaction: ${error}`);
    }
  }

  async getTransactionStatus(txnHash: string): Promise<'pending' | 'success' | 'failed'> {
    try {
      return 'failed';
    } catch (error) {
      console.error('Failed to get Movement transaction status:', error);
      return 'failed';
    }
  }

  async getGasEstimate(payload: any, senderAddress: string): Promise<number> {
    try {
      const estimatedGas = 21000;
      return estimatedGas * 100;
    } catch (error) {
      console.error('Failed to estimate Movement gas:', error);
      return 0;
    }
  }

  setWalletAccount(account: MovementWalletAccount): void {
    this.account = account;
  }

  getWalletAccount(): MovementWalletAccount | null {
    return this.account;
  }

  clearWalletAccount(): void {
    this.account = null;
  }

  getChain(): Chain {
    return this.chain;
  }
}

const movementAdapterCache = new Map<string, MovementAdapter>();

export function getMovementAdapter(chainIdOrChain: string | Chain): MovementAdapter {
  const cacheKey = typeof chainIdOrChain === 'string' ? chainIdOrChain : chainIdOrChain.id;
  if (!movementAdapterCache.has(cacheKey)) {
    movementAdapterCache.set(cacheKey, new MovementAdapter(chainIdOrChain));
  }
  return movementAdapterCache.get(cacheKey)!;
}

export function clearMovementAdapterCache(): void {
  movementAdapterCache.clear();
}
