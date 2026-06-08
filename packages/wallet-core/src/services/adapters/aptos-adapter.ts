import type { Network } from 'aptos';
import type { Chain } from '@orya/shared-types';
import { ChainType } from '@orya/shared-types';

export interface Account {
  address: string;
  sequence_number: number;
  authentication_key: string;
}

export interface SignableTransaction {
  sender: string;
  payload: any;
  options?: {
    maxGasAmount?: number;
    gasUnitPrice?: number;
    sequenceNumber?: number;
    expirationSeconds?: number;
  };
}

export type AccountAuthenticator = any;
export type PendingTransactionResponse = any;

export interface AptosWalletAccount {
  address: string;
  publicKey: string;
  authKey: string;
}

export interface AptosTransactionOptions {
  maxGasAmount?: number;
  gasUnitPrice?: number;
  sequenceNumber?: number;
  expirationSeconds?: number;
}

export interface AptosSignatureScheme {
  type: 'SingleSignatureScheme' | 'MultiSignatureScheme' | 'MultiEd25519Scheme';
  threshold?: number;
  publicKeys?: string[];
}

export class AptosAdapter {
  private chain: Chain;
  private account: AptosWalletAccount | null = null;

  constructor(chainIdOrChain: string | Chain) {
    let chain: Chain;
    
    if (typeof chainIdOrChain === 'string') {
      const chainId = chainIdOrChain;
      chain = {
        id: chainId,
        type: ChainType.APTOS,
        name: 'Aptos',
        network: chainId.includes('testnet') ? 'testnet' : chainId.includes('devnet') ? 'devnet' : 'mainnet' as any,
        rpcUrl: '',
        blockExplorer: '',
        nativeCoin: { symbol: 'APT', decimals: 8 },
        chainId: chainId,
        isActive: true,
        priority: 0,
      };
    } else {
      chain = chainIdOrChain;
      if (chain.type !== ChainType.APTOS) {
        throw new Error(`Invalid chain type for AptosAdapter: ${chain.type}`);
      }
    }

    this.chain = chain;
  }

  private getNetworkFromChain(chain: Chain): string {
    if (chain.id.includes('testnet')) return 'testnet';
    if (chain.id.includes('devnet')) return 'devnet';
    return 'mainnet';
  }

  async getAccountInfo(address: string): Promise<Account> {
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
      console.error('Failed to get Aptos balance:', error);
      return 0;
    }
  }

  async buildTransaction(
    senderAddress: string,
    payload: any,
    options: AptosTransactionOptions = {}
  ): Promise<SignableTransaction> {
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
      throw new Error(`Failed to build Aptos transaction: ${error}`);
    }
  }

  async submitTransaction(signedTxn: AccountAuthenticator): Promise<PendingTransactionResponse> {
    try {
      return null as any;
    } catch (error) {
      throw new Error(`Failed to submit Aptos transaction: ${error}`);
    }
  }

  async waitForTransaction(txnHash: string, options = { timeout: 30000 }): Promise<any> {
    try {
      return null;
    } catch (error) {
      throw new Error(`Failed to wait for Aptos transaction: ${error}`);
    }
  }

  async getTransactionStatus(txnHash: string): Promise<'pending' | 'success' | 'failed'> {
    try {
      return 'failed';
    } catch (error) {
      console.error('Failed to get Aptos transaction status:', error);
      return 'failed';
    }
  }

  async getGasEstimate(payload: any, senderAddress: string): Promise<number> {
    try {
      const estimatedGas = 21000;
      return estimatedGas * 100;
    } catch (error) {
      console.error('Failed to estimate Aptos gas:', error);
      return 0;
    }
  }

  setWalletAccount(account: AptosWalletAccount): void {
    this.account = account;
  }

  getWalletAccount(): AptosWalletAccount | null {
    return this.account;
  }

  clearWalletAccount(): void {
    this.account = null;
  }

  getChain(): Chain {
    return this.chain;
  }
}

const aptosAdapterCache = new Map<string, AptosAdapter>();

export function getAptosAdapter(chainIdOrChain: string | Chain): AptosAdapter {
  const cacheKey = typeof chainIdOrChain === 'string' ? chainIdOrChain : chainIdOrChain.id;
  if (!aptosAdapterCache.has(cacheKey)) {
    aptosAdapterCache.set(cacheKey, new AptosAdapter(chainIdOrChain));
  }
  return aptosAdapterCache.get(cacheKey)!;
}

export function clearAptosAdapterCache(): void {
  aptosAdapterCache.clear();
}
