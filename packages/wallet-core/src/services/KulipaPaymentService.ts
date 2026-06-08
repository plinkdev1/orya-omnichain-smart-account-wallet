/**
 * Kulipa Payment Service
 * Crypto-native payment processing for SUI_NATIVE and INSTITUTIONAL users
 * Handles token swaps, direct crypto payments, and multisig transactions
 * Supports ERC-4337 smart contract accounts and multisig wallets
 */

export interface KulipaConfig {
  apiKey: string;
  secretKey: string;
  merchantId: string;
  apiUrl?: string;
  environment?: 'development' | 'production';
  webhookSecret?: string;
}

export interface CryptoPaymentRequest {
  userId: string;
  walletAddress: string;
  tokenAddress: string;
  amount: string;
  destinationAddress: string;
  chain: string;
  description?: string;
  metadata?: Record<string, string>;
  isMultisig?: boolean;
  requiredSignatures?: number;
}

export interface CryptoPaymentResponse {
  paymentId: string;
  status: 'initiated' | 'pending' | 'processing' | 'completed' | 'failed' | 'requires_approval';
  transactionHash?: string;
  amount: string;
  tokenAddress: string;
  chain: string;
  createdAt: Date;
  expiresAt?: Date;
  approvals?: ApprovalInfo[];
}

export interface ApprovalInfo {
  signer: string;
  approved: boolean;
  approvedAt?: Date;
  signature?: string;
}

export interface QuoteRequest {
  fromToken: string;
  toToken: string;
  amount: string;
  chain: string;
  slippage?: number;
}

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  price: number;
  slippage: number;
  priceImpact: number;
  estimatedGas: string;
  estimatedTime: number;
  expiresAt: Date;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: string;
  logo?: string;
  verified: boolean;
}

export interface TransactionRequest {
  userId: string;
  walletAddress: string;
  tokenAddress: string;
  amount: string;
  recipientAddress: string;
  chain: string;
  isMultisig?: boolean;
  signers?: string[];
}

export interface KulipaTransaction {
  transactionId: string;
  hash?: string;
  status: 'draft' | 'signed' | 'pending' | 'confirmed' | 'failed';
  type: 'transfer' | 'swap' | 'contract_call';
  amount: string;
  token: string;
  chain: string;
  from: string;
  to: string;
  timestamp: Date;
  confirmations: number;
  confirmationsRequired: number;
}

export interface MultisigWallet {
  address: string;
  chain: string;
  threshold: number;
  signers: string[];
  balance: string;
  balanceUSD: number;
  pendingTransactions: number;
}

/**
 * Kulipa Payment Service
 * Crypto-native payments for web3 power users and institutions
 */
export class KulipaPaymentService {
  private config: KulipaConfig;
  private isInitialized: boolean = false;
  private apiUrl: string;

  constructor(config: KulipaConfig) {
    this.config = config;
    this.apiUrl = config.apiUrl || 'https://api.kulipa.io/v1';
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      if (!this.config.apiKey || !this.config.secretKey) {
        throw new Error('Kulipa API key and secret key are required');
      }
      if (!this.config.merchantId) {
        throw new Error('Kulipa merchant ID is required');
      }

      this.isInitialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Kulipa: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async initiateCryptoPayment(request: CryptoPaymentRequest): Promise<CryptoPaymentResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const payload = {
        merchant_id: this.config.merchantId,
        user_id: request.userId,
        wallet_address: request.walletAddress,
        token_address: request.tokenAddress,
        amount: request.amount,
        destination_address: request.destinationAddress,
        chain: request.chain,
        description: request.description,
        is_multisig: request.isMultisig || false,
        required_signatures: request.requiredSignatures || 1,
        metadata: request.metadata,
      };

      const response = await this.apiCall('/payments/crypto', 'POST', payload);

      const expiresAt = response.expires_at ? new Date(response.expires_at) : undefined;

      return {
        paymentId: response.payment_id,
        status: response.status,
        transactionHash: response.transaction_hash,
        amount: response.amount,
        tokenAddress: response.token_address,
        chain: response.chain,
        createdAt: new Date(response.created_at),
        expiresAt,
        approvals: (response.approvals || []).map((a: any) => ({
          signer: a.signer,
          approved: a.approved,
          approvedAt: a.approved_at ? new Date(a.approved_at) : undefined,
          signature: a.signature,
        })),
      };
    } catch (error) {
      throw new Error(
        `Failed to initiate crypto payment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getSwapQuote(request: QuoteRequest): Promise<SwapQuote> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const query = new URLSearchParams({
        from_token: request.fromToken,
        to_token: request.toToken,
        amount: request.amount,
        chain: request.chain,
        slippage: (request.slippage || 0.5).toString(),
      });

      const response = await this.apiCall(`/swap/quote?${query}`, 'GET');

      return {
        fromToken: response.from_token,
        toToken: response.to_token,
        fromAmount: response.from_amount,
        toAmount: response.to_amount,
        price: response.price,
        slippage: response.slippage,
        priceImpact: response.price_impact,
        estimatedGas: response.estimated_gas,
        estimatedTime: response.estimated_time,
        expiresAt: new Date(response.expires_at),
      };
    } catch (error) {
      throw new Error(
        `Failed to get swap quote: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getSupportedTokens(chain: string): Promise<TokenInfo[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.apiCall(`/tokens?chain=${chain}`, 'GET');

      return response.tokens.map((t: any) => ({
        address: t.address,
        symbol: t.symbol,
        name: t.name,
        decimals: t.decimals,
        chainId: t.chain_id,
        logo: t.logo,
        verified: t.verified,
      }));
    } catch (error) {
      throw new Error(
        `Failed to get supported tokens: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async submitTransaction(request: TransactionRequest): Promise<KulipaTransaction> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const payload = {
        user_id: request.userId,
        wallet_address: request.walletAddress,
        token_address: request.tokenAddress,
        amount: request.amount,
        recipient_address: request.recipientAddress,
        chain: request.chain,
        is_multisig: request.isMultisig || false,
        signers: request.signers || [request.walletAddress],
      };

      const response = await this.apiCall('/transactions', 'POST', payload);

      return {
        transactionId: response.transaction_id,
        hash: response.hash,
        status: response.status,
        type: response.type,
        amount: response.amount,
        token: response.token,
        chain: response.chain,
        from: response.from,
        to: response.to,
        timestamp: new Date(response.timestamp),
        confirmations: response.confirmations || 0,
        confirmationsRequired: response.confirmations_required || 1,
      };
    } catch (error) {
      throw new Error(
        `Failed to submit transaction: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async approveTransaction(
    transactionId: string,
    signature: string
  ): Promise<KulipaTransaction> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.apiCall(`/transactions/${transactionId}/approve`, 'POST', {
        signature,
      });

      return {
        transactionId: response.transaction_id,
        hash: response.hash,
        status: response.status,
        type: response.type,
        amount: response.amount,
        token: response.token,
        chain: response.chain,
        from: response.from,
        to: response.to,
        timestamp: new Date(response.timestamp),
        confirmations: response.confirmations || 0,
        confirmationsRequired: response.confirmations_required || 1,
      };
    } catch (error) {
      throw new Error(
        `Failed to approve transaction: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getMultisigWallet(address: string, chain: string): Promise<MultisigWallet> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.apiCall(`/multisig/${address}?chain=${chain}`, 'GET');

      return {
        address: response.address,
        chain: response.chain,
        threshold: response.threshold,
        signers: response.signers,
        balance: response.balance,
        balanceUSD: response.balance_usd,
        pendingTransactions: response.pending_transactions,
      };
    } catch (error) {
      throw new Error(
        `Failed to get multisig wallet: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getPaymentStatus(paymentId: string): Promise<CryptoPaymentResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.apiCall(`/payments/${paymentId}`, 'GET');

      const expiresAt = response.expires_at ? new Date(response.expires_at) : undefined;

      return {
        paymentId: response.payment_id,
        status: response.status,
        transactionHash: response.transaction_hash,
        amount: response.amount,
        tokenAddress: response.token_address,
        chain: response.chain,
        createdAt: new Date(response.created_at),
        expiresAt,
        approvals: (response.approvals || []).map((a: any) => ({
          signer: a.signer,
          approved: a.approved,
          approvedAt: a.approved_at ? new Date(a.approved_at) : undefined,
          signature: a.signature,
        })),
      };
    } catch (error) {
      throw new Error(
        `Failed to get payment status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async apiCall(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.generateSignature(endpoint, method, data, timestamp);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      'X-Signature': signature,
      'X-Timestamp': timestamp.toString(),
      'X-Merchant-ID': this.config.merchantId,
    };

    const url = `${this.apiUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: method !== 'GET' && data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Kulipa API error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      throw new Error(
        `Kulipa API call failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private generateSignature(
    endpoint: string,
    method: string,
    data: any,
    timestamp: number
  ): string {
    const crypto = require('crypto');
    const message = `${method}${endpoint}${timestamp}${data ? JSON.stringify(data) : ''}`;
    return crypto.createHmac('sha256', this.config.secretKey).update(message).digest('hex');
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getConfig(): KulipaConfig {
    const config = { ...this.config };
    delete (config as any).secretKey;
    delete (config as any).webhookSecret;
    return config;
  }
}

export function createKulipaPaymentService(config: KulipaConfig): KulipaPaymentService {
  return new KulipaPaymentService(config);
}

let kulipaServiceInstance: KulipaPaymentService | null = null;

export function initializeKulipaService(config: KulipaConfig): KulipaPaymentService {
  if (!kulipaServiceInstance) {
    kulipaServiceInstance = createKulipaPaymentService(config);
  }
  return kulipaServiceInstance;
}

export function getKulipaService(): KulipaPaymentService | null {
  return kulipaServiceInstance;
}
