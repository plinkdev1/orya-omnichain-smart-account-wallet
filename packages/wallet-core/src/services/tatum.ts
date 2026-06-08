import { TatumSDK, Network } from '@tatumio/tatum';

export interface TatumConfig {
  apiKey: string;
  environment?: 'development' | 'production';
  apiUrl?: string;
}

export interface TatumWalletResult {
  address: string;
  privateKey: string;
  mnemonic: string[];
  chainId: string;
}

export interface TatumTransaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  fee: string;
  chainId: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface TatumBroadcastRequest {
  chainId: string;
  txData: string;
}

export interface TatumBroadcastResponse {
  txId: string;
  status: 'pending' | 'confirmed';
}

export interface TatumEstimateFeeResponse {
  gasPrice: string;
  gasLimit: string;
  estimatedFee: string;
}

export interface ChainBalance {
  chain: string;
  balance: string;
  usd_value?: number;
}

export class TatumService {
  private config: TatumConfig;
  private isInitialized: boolean = false;

  constructor(config: TatumConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.isInitialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Tatum: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async createWallet(chainId: string): Promise<TatumWalletResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const network = this.getNetworkForChain(chainId);
      const sdk = await TatumSDK.init({
        network,
        apiKey: this.config.apiKey,
      });

      const wallet = await (sdk as any).wallet.generateWallet();

      const mnemonic = wallet.mnemonic
        ? typeof wallet.mnemonic === 'string'
          ? wallet.mnemonic.split(' ')
          : wallet.mnemonic
        : [];

      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic,
        chainId,
      };
    } catch (error) {
      throw new Error(
        `Failed to create Tatum wallet: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getBalance(chainId: string, address: string): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const network = this.getNetworkForChain(chainId);
      const sdk = await TatumSDK.init({
        network,
        apiKey: this.config.apiKey,
      });

      const balance = await (sdk as any).address.getBalance({
        addresses: [address],
      });

      if (Array.isArray(balance)) {
        return balance[0]?.balance?.toString() || '0';
      }

      return (balance as any)?.balance?.toString() || '0';
    } catch (error) {
      throw new Error(
        `Failed to get balance: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getTransaction(
    chainId: string,
    hash: string
  ): Promise<TatumTransaction | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const network = this.getNetworkForChain(chainId);
      const sdk = await TatumSDK.init({
        network,
        apiKey: this.config.apiKey,
      });

      const tx = await (sdk as any).blockchain.getTransaction(hash);

      return {
        hash: tx.hash,
        from: tx.from || '',
        to: tx.to || '',
        amount: tx.value?.toString() || '0',
        fee: tx.gasPrice?.toString() || '0',
        chainId,
        status: (tx.status as any) || 'pending',
      };
    } catch (error) {
      throw new Error(
        `Failed to get transaction: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async broadcastTransaction(
    request: TatumBroadcastRequest
  ): Promise<TatumBroadcastResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const network = this.getNetworkForChain(request.chainId);
      const sdk = await TatumSDK.init({
        network,
        apiKey: this.config.apiKey,
      });

      const response = await (sdk as any).blockchain.broadcast(request.txData);

      return {
        txId: (response as any).txId || response.toString(),
        status: 'pending',
      };
    } catch (error) {
      throw new Error(
        `Failed to broadcast transaction: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async estimateFee(
    chainId: string,
    from: string,
    to: string,
    amount: string
  ): Promise<TatumEstimateFeeResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const network = this.getNetworkForChain(chainId);
      const sdk = await TatumSDK.init({
        network,
        apiKey: this.config.apiKey,
      });

      const fees = await (sdk as any).fees.estimateFee({
        from,
        to,
        amount,
      });

      return {
        gasPrice: (fees as any).gasPrice?.toString() || '0',
        gasLimit: (fees as any).gasLimit?.toString() || '0',
        estimatedFee: (fees as any).estimatedFee?.toString() || '0',
      };
    } catch (error) {
      throw new Error(
        `Failed to estimate fee: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getNonce(chainId: string, address: string): Promise<number> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const network = this.getNetworkForChain(chainId);
      const sdk = await TatumSDK.init({
        network,
        apiKey: this.config.apiKey,
      });

      const nonce = await (sdk as any).address.getNonce(address);
      return typeof nonce === 'number' ? nonce : parseInt(nonce.toString(), 10);
    } catch (error) {
      throw new Error(
        `Failed to get nonce: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private getNetworkForChain(chainId: string): Network {
    const mapping: Record<string, Network> = {
      ethereum: Network.ETHEREUM,
      polygon: Network.POLYGON,
      solana: Network.SOLANA,
      bsc: Network.BINANCE_SMART_CHAIN,
      avalanche: Network.AVALANCHE_C,
      fantom: Network.FANTOM,
      arbitrum: Network.ARBITRUM_ONE,
      optimism: Network.OPTIMISM,
    };

    if (mapping[chainId]) {
      return mapping[chainId];
    }

    return Network.ETHEREUM;
  }

  /**
   * Get token transfers for an address
   */
  async getTokenTransfers(
    chainId: string,
    address: string,
    limit: number = 50
  ): Promise<TatumTransaction[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const network = this.getNetworkForChain(chainId);
      const sdk = await TatumSDK.init({
        network,
        apiKey: this.config.apiKey,
      });

      const transfers = await (sdk as any).address.getTokenTransfers({
        addresses: [address],
        limit,
      });

      return Array.isArray(transfers)
        ? transfers.map((t: any) => ({
            hash: t.hash || t.transactionHash,
            from: t.from || t.from_address || '',
            to: t.to || t.to_address || '',
            amount: t.value || t.amount || '0',
            fee: t.gas || '0',
            chainId,
            status: (t.status as any) || 'pending',
          }))
        : [];
    } catch (error) {
      throw new Error(
        `Failed to get token transfers: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get multiple balances for different chains
   */
  async getBalancesMultiChain(
    address: string,
    chainIds: string[]
  ): Promise<ChainBalance[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const balances: ChainBalance[] = [];

      for (const chainId of chainIds) {
        const balance = await this.getBalance(chainId, address);
        balances.push({
          chain: chainId,
          balance,
          usd_value: balance ? parseFloat(balance) * 100 : 0, // Placeholder
        });
      }

      return balances;
    } catch (error) {
      throw new Error(
        `Failed to get multi-chain balances: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Validate Ethereum address
   */
  validateEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Get account info (ENS, labels, etc.)
   */
  async getAccountInfo(
    chainId: string,
    address: string
  ): Promise<Record<string, any>> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (!this.validateEthereumAddress(address)) {
        throw new Error('Invalid Ethereum address');
      }

      return {
        address,
        chain: chainId,
        isContract: false,
        lastTransaction: null,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `Failed to get account info: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Send signed transaction to blockchain
   */
  async sendSignedTransaction(
    chainId: string,
    signedTx: string
  ): Promise<{ transactionHash: string; status: string }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const network = this.getNetworkForChain(chainId);
      const sdk = await TatumSDK.init({
        network,
        apiKey: this.config.apiKey,
      });

      const result = await (sdk as any).blockchain.broadcast(signedTx);

      return {
        transactionHash: (result as any).txId || result.toString(),
        status: 'pending',
      };
    } catch (error) {
      throw new Error(
        `Failed to send signed transaction: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Wait for transaction confirmation with polling
   */
  async waitForTransactionConfirmation(
    chainId: string,
    transactionHash: string,
    timeoutSeconds: number = 300
  ): Promise<TatumTransaction | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const pollInterval = 2000;

    while (Date.now() - startTime < timeoutSeconds * 1000) {
      try {
        const tx = await this.getTransaction(chainId, transactionHash);
        if (tx && tx.status === 'confirmed') {
          return tx;
        }
      } catch (error) {
        console.warn('Error polling transaction status:', error);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    return null;
  }

  /**
   * Get blockchain info
   */
  async getBlockchainInfo(chainId: string): Promise<Record<string, any>> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const network = this.getNetworkForChain(chainId);
      const sdk = await TatumSDK.init({
        network,
        apiKey: this.config.apiKey,
      });

      const info = await (sdk as any).blockchain.getBlockchainInfo();

      return {
        chain: chainId,
        network: (info as any).network || chainId,
        lastBlockNumber: (info as any).lastBlockNumber,
        syncProgress: (info as any).syncProgress,
        isReady: true,
      };
    } catch (error) {
      throw new Error(
        `Failed to get blockchain info: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getConfig(): TatumConfig {
    return { ...this.config };
  }
}

export async function createTatumWallet(chainId: string): Promise<TatumWalletResult> {
  const apiKey = process.env.TATUM_API_KEY;
  if (!apiKey) {
    throw new Error('TATUM_API_KEY environment variable is not set');
  }

  const service = new TatumService({ apiKey });
  await service.initialize();
  return service.createWallet(chainId);
}

export function createTatumService(config: TatumConfig): TatumService {
  return new TatumService(config);
}

let tatumServiceInstance: TatumService | null = null;

export function initializeTatumService(config: TatumConfig): TatumService {
  if (!tatumServiceInstance) {
    tatumServiceInstance = createTatumService(config);
  }
  return tatumServiceInstance;
}

export function getTatumService(): TatumService | null {
  return tatumServiceInstance;
}