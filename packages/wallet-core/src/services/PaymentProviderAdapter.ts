/**
 * Payment Provider Adapter
 * Unified abstraction layer for routing payments to different providers
 * Supports Stripe (NORMIE), Kulipa (POWER_USER, INSTITUTIONAL), and WalletConnect Pay
 */

import type { StripePaymentService, PaymentIntentRequest, PaymentIntent } from './StripePaymentService';
import type { KulipaPaymentService, CryptoPaymentRequest, CryptoPaymentResponse } from './KulipaPaymentService';

export type WalletType = 'NORMIE_EVERYDAY' | 'SUI_NATIVE_SELF' | 'EXTERNAL_CONNECTED' | 'INSTITUTIONAL_SUITE';
export type PaymentMethod = 'stripe' | 'kulipa' | 'walletconnect' | 'apple_pay' | 'google_pay';

export interface PaymentRoute {
  walletType: WalletType;
  method: PaymentMethod;
  provider: 'stripe' | 'kulipa' | 'walletconnect';
  isEnabled: boolean;
}

export interface UnifiedPaymentRequest {
  userId: string;
  walletType: WalletType;
  walletAddress: string;
  amount: number;
  amountCrypto?: string;
  currency: string;
  tokenAddress?: string;
  description: string;
  recipient?: string;
  metadata?: Record<string, string>;
  isMultisig?: boolean;
}

export interface UnifiedPaymentResponse {
  paymentId: string;
  status: 'initiated' | 'pending' | 'processing' | 'completed' | 'failed';
  provider: 'stripe' | 'kulipa' | 'walletconnect';
  amount: number;
  currency?: string;
  transactionHash?: string;
  clientSecret?: string;
  approvals?: any[];
  expiresAt?: Date;
}

export type PaymentRouteConfig = {
  [key in WalletType]?: {
    primaryMethod: PaymentMethod;
    fallbackMethods: PaymentMethod[];
  };
};

/**
 * Payment Provider Adapter
 * Routes payments to appropriate provider based on wallet type
 */
export class PaymentProviderAdapter {
  private stripeService: StripePaymentService | null = null;
  private kulipaService: KulipaPaymentService | null = null;
  private routeConfig: PaymentRouteConfig;

  constructor(
    stripeService?: StripePaymentService,
    kulipaService?: KulipaPaymentService
  ) {
    this.stripeService = stripeService || null;
    this.kulipaService = kulipaService || null;

    this.routeConfig = {
      NORMIE_EVERYDAY: {
        primaryMethod: 'stripe',
        fallbackMethods: [],
      },
      SUI_NATIVE_SELF: {
        primaryMethod: 'kulipa',
        fallbackMethods: ['walletconnect'],
      },
      EXTERNAL_CONNECTED: {
        primaryMethod: 'walletconnect',
        fallbackMethods: ['stripe', 'kulipa'],
      },
      INSTITUTIONAL_SUITE: {
        primaryMethod: 'kulipa',
        fallbackMethods: ['walletconnect'],
      },
    };
  }

  async setStripeService(service: StripePaymentService): Promise<void> {
    this.stripeService = service;
    await service.initialize();
  }

  async setKulipaService(service: KulipaPaymentService): Promise<void> {
    this.kulipaService = service;
    await service.initialize();
  }

  /**
   * Get recommended payment methods for wallet type
   */
  getPaymentMethods(walletType: WalletType): PaymentMethod[] {
    const config = this.routeConfig[walletType];
    if (!config) {
      return [];
    }

    const methods: PaymentMethod[] = [config.primaryMethod, ...config.fallbackMethods];

    if (walletType === 'NORMIE_EVERYDAY') {
      return ['stripe', 'apple_pay', 'google_pay'];
    }

    if (walletType === 'INSTITUTIONAL_SUITE' || walletType === 'SUI_NATIVE_SELF') {
      return ['kulipa', 'walletconnect'];
    }

    if (walletType === 'EXTERNAL_CONNECTED') {
      return ['walletconnect', 'stripe', 'apple_pay', 'google_pay'];
    }

    return methods;
  }

  /**
   * Get payment routes for all wallet types
   */
  getAllPaymentRoutes(): PaymentRoute[] {
    const routes: PaymentRoute[] = [];

    const walletTypes: WalletType[] = [
      'NORMIE_EVERYDAY',
      'SUI_NATIVE_SELF',
      'EXTERNAL_CONNECTED',
      'INSTITUTIONAL_SUITE',
    ];

    walletTypes.forEach((walletType) => {
      const methods = this.getPaymentMethods(walletType);

      methods.forEach((method) => {
        routes.push({
          walletType,
          method,
          provider: this.getProviderForMethod(method),
          isEnabled: this.isMethodEnabled(method),
        });
      });
    });

    return routes;
  }

  /**
   * Route payment to appropriate provider
   */
  async routePayment(request: UnifiedPaymentRequest): Promise<UnifiedPaymentResponse> {
    const methods = this.getPaymentMethods(request.walletType);

    for (const method of methods) {
      try {
        const provider = this.getProviderForMethod(method);

        if (provider === 'stripe' && this.stripeService) {
          return await this.routeToStripe(request, method);
        }

        if (provider === 'kulipa' && this.kulipaService) {
          return await this.routeToKulipa(request, method);
        }

        if (provider === 'walletconnect') {
          return await this.routeToWalletConnectPay(request, method);
        }
      } catch (error) {
        continue;
      }
    }

    throw new Error(
      `No available payment method for wallet type: ${request.walletType}`
    );
  }

  /**
   * Route to Stripe for card payments
   */
  private async routeToStripe(
    request: UnifiedPaymentRequest,
    method: PaymentMethod
  ): Promise<UnifiedPaymentResponse> {
    if (!this.stripeService) {
      throw new Error('Stripe service not configured');
    }

    if (!this.stripeService.isReady()) {
      await this.stripeService.initialize();
    }

    const paymentRequest: PaymentIntentRequest = {
      userId: request.userId,
      amount: request.amount,
      currency: request.currency,
      description: request.description,
      metadata: {
        walletType: request.walletType,
        walletAddress: request.walletAddress,
        paymentMethod: method,
        ...request.metadata,
      },
    };

    const result: PaymentIntent = await this.stripeService.createPaymentIntent(
      paymentRequest
    );

    return {
      paymentId: result.id,
      status: result.status as any,
      provider: 'stripe',
      amount: result.amount,
      currency: result.currency,
      clientSecret: result.client_secret,
    };
  }

  /**
   * Route to Kulipa for crypto payments
   */
  private async routeToKulipa(
    request: UnifiedPaymentRequest,
    method: PaymentMethod
  ): Promise<UnifiedPaymentResponse> {
    if (!this.kulipaService) {
      throw new Error('Kulipa service not configured');
    }

    if (!this.kulipaService.isReady()) {
      await this.kulipaService.initialize();
    }

    const cryptoRequest: CryptoPaymentRequest = {
      userId: request.userId,
      walletAddress: request.walletAddress,
      tokenAddress: request.tokenAddress || '',
      amount: request.amountCrypto || request.amount.toString(),
      destinationAddress: request.recipient || '',
      chain: this.guessChainFromWalletType(request.walletType),
      description: request.description,
      isMultisig: request.isMultisig,
      metadata: {
        paymentMethod: method,
        ...request.metadata,
      },
    };

    const result: CryptoPaymentResponse = await this.kulipaService.initiateCryptoPayment(
      cryptoRequest
    );

    return {
      paymentId: result.paymentId,
      status: result.status as any,
      provider: 'kulipa',
      amount: parseFloat(result.amount),
      transactionHash: result.transactionHash,
      expiresAt: result.expiresAt,
      approvals: result.approvals,
    };
  }

  /**
   * Route to WalletConnect Pay
   */
  private async routeToWalletConnectPay(
    request: UnifiedPaymentRequest,
    method: PaymentMethod
  ): Promise<UnifiedPaymentResponse> {
    return {
      paymentId: `wcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'initiated',
      provider: 'walletconnect',
      amount: request.amount,
      currency: request.currency,
    };
  }

  /**
   * Check if payment method is enabled
   */
  private isMethodEnabled(method: PaymentMethod): boolean {
    if (method === 'stripe') {
      return this.stripeService !== null;
    }

    if (method === 'kulipa') {
      return this.kulipaService !== null;
    }

    if (method === 'walletconnect') {
      return true;
    }

    if (method === 'apple_pay') {
      return typeof window !== 'undefined' && !!(window as any).ApplePaySession;
    }

    if (method === 'google_pay') {
      return typeof window !== 'undefined' && !!(window as any).google?.payments?.api;
    }

    return false;
  }

  /**
   * Map payment method to provider
   */
  private getProviderForMethod(method: PaymentMethod): 'stripe' | 'kulipa' | 'walletconnect' {
    if (method === 'stripe') return 'stripe';
    if (method === 'kulipa') return 'kulipa';
    if (method === 'apple_pay' || method === 'google_pay') return 'walletconnect';
    return 'walletconnect';
  }

  /**
   * Guess chain from wallet type
   */
  private guessChainFromWalletType(walletType: WalletType): string {
    if (walletType === 'SUI_NATIVE_SELF' || walletType === 'INSTITUTIONAL_SUITE') {
      return 'sui';
    }
    return 'ethereum';
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(
    paymentId: string,
    provider: 'stripe' | 'kulipa' | 'walletconnect'
  ): Promise<UnifiedPaymentResponse> {
    if (provider === 'stripe' && this.stripeService) {
      const result = await this.stripeService.retrievePaymentIntent(paymentId);
      return {
        paymentId: result.id,
        status: result.status as any,
        provider,
        amount: result.amount,
        currency: result.currency,
        clientSecret: result.client_secret,
      };
    }

    if (provider === 'kulipa' && this.kulipaService) {
      const result = await this.kulipaService.getPaymentStatus(paymentId);
      return {
        paymentId: result.paymentId,
        status: result.status as any,
        provider,
        amount: parseFloat(result.amount),
        transactionHash: result.transactionHash,
        expiresAt: result.expiresAt,
      };
    }

    throw new Error(`Provider ${provider} not configured or supported`);
  }

  /**
   * Configure payment routes
   */
  setPaymentRouteConfig(config: PaymentRouteConfig): void {
    this.routeConfig = { ...this.routeConfig, ...config };
  }
}

export function createPaymentProviderAdapter(
  stripeService?: StripePaymentService,
  kulipaService?: KulipaPaymentService
): PaymentProviderAdapter {
  return new PaymentProviderAdapter(stripeService, kulipaService);
}
