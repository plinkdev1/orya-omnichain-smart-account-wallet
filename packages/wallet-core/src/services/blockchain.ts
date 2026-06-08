/**
 * Blockchain Service - Chain Abstraction Layer
 * Pure business logic for blockchain interactions
 */

export type ChainName =
  | 'sui'
  | 'btcfi'
  | 'ethereum'
  | 'solana'
  | 'aptos'
  | 'hyperliquid'
  | 'movementlabs';

export interface BlockchainConfig {
  chainId: string;
  chainName: ChainName;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface BlockchainAddress {
  address: string;
  chainId: string;
  balance: string;
  nonce: number;
}

export interface BlockchainTransaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  fee: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  blockNumber?: number;
  timestamp?: number;
}

export interface SmartContractCall {
  contractAddress: string;
  methodName: string;
  params: Record<string, any>;
  value?: string;
}

/**
 * Abstract Blockchain Service
 */
export abstract class BlockchainService {
  protected config: BlockchainConfig;

  constructor(config: BlockchainConfig) {
    this.config = config;
  }

  abstract getBalance(address: string): Promise<string>;

  abstract getTransaction(hash: string): Promise<BlockchainTransaction | null>;

  abstract sendTransaction(
    from: string,
    to: string,
    amount: string,
    data?: string
  ): Promise<string>;

  abstract callSmartContract(
    contractAddress: string,
    abi: any[],
    methodName: string,
    params: any[]
  ): Promise<any>;

  abstract estimateGas(
    from: string,
    to: string,
    amount: string,
    data?: string
  ): Promise<string>;

  abstract getGasPrice(): Promise<string>;

  abstract getNonce(address: string): Promise<number>;

  abstract validateAddress(address: string): boolean;

  getChainId(): string {
    return this.config.chainId;
  }

  getChainName(): ChainName {
    return this.config.chainName;
  }

  getRpcUrl(): string {
    return this.config.rpcUrl;
  }

  getExplorerUrl(): string {
    return this.config.explorerUrl;
  }

  getNativeCurrency() {
    return this.config.nativeCurrency;
  }
}

/**
 * Blockchain Service Registry
 */
export class BlockchainServiceRegistry {
  private services: Map<string, BlockchainService> = new Map();

  register(chainId: string, service: BlockchainService): void {
    this.services.set(chainId, service);
  }

  getService(chainId: string): BlockchainService | undefined {
    return this.services.get(chainId);
  }

  getAllServices(): BlockchainService[] {
    return Array.from(this.services.values());
  }

  removeService(chainId: string): void {
    this.services.delete(chainId);
  }

  hasService(chainId: string): boolean {
    return this.services.has(chainId);
  }
}

/**
 * Blockchain Service factory
 */
export function createBlockchainServiceRegistry(): BlockchainServiceRegistry {
  return new BlockchainServiceRegistry();
}