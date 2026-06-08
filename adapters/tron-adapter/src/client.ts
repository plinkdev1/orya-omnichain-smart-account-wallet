import { Config } from "./config";
import { AdapterError } from "./error";

export interface Account {
  address: string;
  publicKey: string;
  balance: string;
}

export interface TransactionRequest {
  toAddress: string;
  amount: number;
  tokenId?: string;
  data?: string;
}

export interface SignedTransaction {
  txID: string;
  raw_data: any;
  raw_data_hex: string;
  signature?: string[];
}

export class TronClient {
  private config: Config;
  private tronweb: any;
  private account: Account | null = null;
  private connecting: boolean = false;

  constructor(config: Config) {
    this.config = config;
    this.initializeTronWeb();
  }

  private initializeTronWeb(): void {
    try {
      const TronWeb = require('tronweb').default;
      this.tronweb = new TronWeb({
        fullHost: this.config.fullNode,
        solidityNode: this.config.solidityNode,
        eventServer: this.config.eventServer,
      });
    } catch (error) {
      throw new AdapterError('Failed to initialize TronWeb: ' + (error as Error).message);
    }
  }

  getConfig(): Config {
    return this.config;
  }

  async connectWallet(): Promise<Account> {
    if (this.connecting) {
      throw new AdapterError('Connection attempt already in progress');
    }

    this.connecting = true;

    try {
      if (typeof window !== 'undefined' && (window as any).tronLink) {
        const tronLink = (window as any).tronLink;

        if (!tronLink.ready) {
          throw new AdapterError('TronLink wallet is not ready');
        }

        const response = await tronLink.request({ method: 'tron_requestAccounts' });

        if (!response || response.length === 0) {
          throw new AdapterError('User rejected connection');
        }

        const address = response[0];
        const result = await this.tronweb.trx.getAccount(address);

        this.account = {
          address,
          publicKey: result?.publicKey || '',
          balance: String((result?.balance || 0) / 1000000),
        };

        this.connecting = false;
        return this.account;
      } else {
        throw new AdapterError('TronLink wallet not found. Please install TronLink extension.');
      }
    } catch (error) {
      this.connecting = false;
      if (error instanceof AdapterError) {
        throw error;
      }
      throw new AdapterError('Failed to connect wallet: ' + (error as Error).message);
    }
  }

  async disconnectWallet(): Promise<void> {
    this.account = null;
  }

  getConnectedAccount(): Account | null {
    return this.account;
  }

  async getBalance(address?: string): Promise<string> {
    try {
      const targetAddress = address || this.account?.address;

      if (!targetAddress) {
        throw new AdapterError('No address provided and no wallet connected');
      }

      const result = await this.tronweb.trx.getAccount(targetAddress);
      const balance = (result?.balance || 0) / 1000000;

      return balance.toString();
    } catch (error) {
      throw new AdapterError('Failed to get balance: ' + (error as Error).message);
    }
  }

  async getTokenBalance(tokenAddress: string, accountAddress?: string): Promise<string> {
    try {
      const address = accountAddress || this.account?.address;

      if (!address) {
        throw new AdapterError('No address provided and no wallet connected');
      }

      const contract = await this.tronweb.contract().at(tokenAddress);
      const balance = await contract.balanceOf(address).call();

      return balance?.toString() || '0';
    } catch (error) {
      throw new AdapterError('Failed to get token balance: ' + (error as Error).message);
    }
  }

  async createTransaction(request: TransactionRequest): Promise<SignedTransaction> {
    try {
      if (!this.account) {
        throw new AdapterError('Wallet not connected');
      }

      let transaction;

      if (request.tokenId) {
        transaction = await this.tronweb.transactionBuilder.sendToken(
          request.toAddress,
          request.amount,
          request.tokenId,
          this.account.address
        );
      } else {
        const amountInSun = request.amount * 1000000;
        transaction = await this.tronweb.transactionBuilder.sendTrx(
          request.toAddress,
          amountInSun,
          this.account.address
        );
      }

      return {
        txID: transaction.txID,
        raw_data: transaction.raw_data,
        raw_data_hex: transaction.raw_data_hex,
      };
    } catch (error) {
      throw new AdapterError('Failed to create transaction: ' + (error as Error).message);
    }
  }

  async signMessage(message: string): Promise<{ signature: string; address: string }> {
    try {
      if (!this.account) {
        throw new AdapterError('Wallet not connected');
      }

      if (typeof window !== 'undefined' && (window as any).tronLink) {
        const tronLink = (window as any).tronLink;
        const messageHex = this.tronweb.toHex(message);

        const response = await tronLink.request({
          method: 'tron_signMessage',
          params: {
            address: this.account.address,
            message: messageHex,
          },
        });

        return {
          signature: response,
          address: this.account.address,
        };
      } else {
        throw new AdapterError('TronLink wallet not available for signing');
      }
    } catch (error) {
      throw new AdapterError('Failed to sign message: ' + (error as Error).message);
    }
  }

  async signTransaction(transaction: SignedTransaction): Promise<SignedTransaction> {
    try {
      if (!this.account) {
        throw new AdapterError('Wallet not connected');
      }

      if (typeof window !== 'undefined' && (window as any).tronLink) {
        const tronLink = (window as any).tronLink;

        const signedTx = await tronLink.request({
          method: 'tron_signTransaction',
          params: [transaction],
        });

        return signedTx;
      } else {
        throw new AdapterError('TronLink wallet not available for signing');
      }
    } catch (error) {
      throw new AdapterError('Failed to sign transaction: ' + (error as Error).message);
    }
  }

  async broadcastTransaction(signedTx: SignedTransaction): Promise<string> {
    try {
      const result = await this.tronweb.trx.sendRawTransaction(signedTx);

      if (result?.result) {
        return result.txid || signedTx.txID;
      } else {
        throw new AdapterError('Failed to broadcast transaction: ' + (result?.message || 'Unknown error'));
      }
    } catch (error) {
      throw new AdapterError('Failed to broadcast transaction: ' + (error as Error).message);
    }
  }

  async getTransaction(txHash: string): Promise<any> {
    try {
      return await this.tronweb.trx.getTransaction(txHash);
    } catch (error) {
      throw new AdapterError('Failed to get transaction: ' + (error as Error).message);
    }
  }

  async getTransactionInfo(txHash: string): Promise<any> {
    try {
      return await this.tronweb.trx.getTransactionInfo(txHash);
    } catch (error) {
      throw new AdapterError('Failed to get transaction info: ' + (error as Error).message);
    }
  }

  getTronWeb(): any {
    return this.tronweb;
  }
}
