/**
 * Stripe Payment Service
 * Card payment processing for NORMIE users via Privy MPC embedded wallets
 * Handles card issuance, top-ups, and fiat settlements
 */

export interface StripeConfig {
  publishableKey: string;
  secretKey?: string;
  apiVersion?: string;
  environment?: 'development' | 'production';
}

export interface StripeCardToken {
  id: string;
  object: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  last4: string;
}

export interface PaymentIntentRequest {
  userId: string;
  amount: number;
  currency: string;
  description: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'requires_capture' | 'canceled';
  client_secret?: string;
  charges?: Array<{
    id: string;
    status: string;
    amount: number;
  }>;
  metadata?: Record<string, any>;
}

export interface CreateCardRequest {
  userId: string;
  email: string;
  fullName: string;
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export interface StripeCard {
  id: string;
  userId: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  holderName: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
  livemode: boolean;
}

export interface TopUpRequest {
  userId: string;
  amount: number;
  currency: string;
  walletAddress: string;
  paymentMethodId: string;
}

export interface TopUpResponse {
  transactionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amountUSD: number;
  amountCrypto: string;
  walletAddress: string;
  timestamp: Date;
}

/**
 * Stripe Payment Service
 * Manages card-based fiat payments for normie users
 */
export class StripePaymentService {
  private config: StripeConfig;
  private isInitialized: boolean = false;
  private stripeInstance: any = null;

  constructor(config: StripeConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      if (!this.config.publishableKey) {
        throw new Error('Stripe publishable key is required');
      }

      if (typeof window !== 'undefined' && (window as any).Stripe) {
        this.stripeInstance = (window as any).Stripe(this.config.publishableKey);
      }

      this.isInitialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Stripe: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntent> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const payload = {
        amount: Math.round(request.amount * 100),
        currency: request.currency.toLowerCase(),
        description: request.description,
        metadata: {
          userId: request.userId,
          ...request.metadata,
        },
      };

      if (request.paymentMethodId) {
        (payload as any).payment_method = request.paymentMethodId;
        (payload as any).confirm = true;
      }

      const response = await this.apiCall('/v1/payment_intents', 'POST', payload);

      return {
        id: response.id,
        amount: response.amount / 100,
        currency: response.currency,
        status: response.status,
        client_secret: response.client_secret,
        charges: response.charges?.data || [],
        metadata: response.metadata,
      };
    } catch (error) {
      throw new Error(
        `Failed to create payment intent: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<PaymentIntent> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.apiCall(
        `/v1/payment_intents/${paymentIntentId}/confirm`,
        'POST',
        {
          payment_method: paymentMethodId,
        }
      );

      return {
        id: response.id,
        amount: response.amount / 100,
        currency: response.currency,
        status: response.status,
        client_secret: response.client_secret,
        charges: response.charges?.data || [],
        metadata: response.metadata,
      };
    } catch (error) {
      throw new Error(
        `Failed to confirm payment intent: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.apiCall(`/v1/payment_intents/${paymentIntentId}`, 'GET');

      return {
        id: response.id,
        amount: response.amount / 100,
        currency: response.currency,
        status: response.status,
        client_secret: response.client_secret,
        charges: response.charges?.data || [],
        metadata: response.metadata,
      };
    } catch (error) {
      throw new Error(
        `Failed to retrieve payment intent: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async createPaymentMethod(request: CreateCardRequest): Promise<StripeCardToken> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const payload = {
        type: 'card',
        card: {
          number: request.cardNumber.replace(/\s/g, ''),
          exp_month: parseInt(request.expMonth),
          exp_year: parseInt(request.expYear),
          cvc: request.cvc,
        },
        billing_details: {
          name: request.fullName,
          email: request.email,
          ...request.billingAddress,
        },
        metadata: {
          userId: request.userId,
        },
      };

      const response = await this.apiCall('/v1/payment_methods', 'POST', payload);

      return {
        id: response.id,
        object: response.object,
        brand: response.card.brand,
        exp_month: response.card.exp_month,
        exp_year: response.card.exp_year,
        last4: response.card.last4,
      };
    } catch (error) {
      throw new Error(
        `Failed to create payment method: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async listPaymentMethods(userId: string): Promise<StripeCardToken[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.apiCall(
        `/v1/payment_methods?type=card&customer=${userId}`,
        'GET'
      );

      return response.data.map((pm: any) => ({
        id: pm.id,
        object: pm.object,
        brand: pm.card.brand,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year,
        last4: pm.card.last4,
      }));
    } catch (error) {
      throw new Error(
        `Failed to list payment methods: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await this.apiCall(`/v1/payment_methods/${paymentMethodId}/detach`, 'POST');
      return true;
    } catch (error) {
      throw new Error(
        `Failed to detach payment method: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async createCustomer(userId: string, email: string, name: string): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.apiCall('/v1/customers', 'POST', {
        email,
        name,
        metadata: {
          userId,
        },
      });

      return response.id;
    } catch (error) {
      throw new Error(
        `Failed to create customer: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async setupCardPayment(
    userId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; clientSecret?: string }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.apiCall('/v1/setup_intents', 'POST', {
        payment_method: paymentMethodId,
        confirm: true,
        metadata: {
          userId,
        },
      });

      return {
        success: response.status === 'succeeded',
        clientSecret: response.client_secret,
      };
    } catch (error) {
      throw new Error(
        `Failed to setup card payment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async handleWebhook(event: StripeWebhookEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          break;
        case 'payment_intent.payment_failed':
          break;
        case 'charge.refunded':
          break;
        default:
          break;
      }
    } catch (error) {
      throw new Error(
        `Failed to handle webhook: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async apiCall(
    endpoint: string,
    method: string = 'GET',
    data?: any
  ): Promise<any> {
    if (!this.config.secretKey && method !== 'GET') {
      throw new Error('Stripe secret key required for this operation');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${this.config.secretKey}`,
    };

    let url = `https://api.stripe.com${endpoint}`;

    if (method === 'GET' && data) {
      const params = new URLSearchParams(data);
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: method !== 'GET' && data ? new URLSearchParams(this.serializeData(data)).toString() : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Stripe API error: ${response.statusText}`);
    }

    return response.json();
  }

  private serializeData(obj: any, prefix: string = ''): Record<string, string> {
    const result: Record<string, string> = {};

    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}[${key}]` : key;

      if (value === null || value === undefined) {
        return;
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this.serializeData(value as any, fullKey));
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            Object.assign(result, this.serializeData(item as any, `${fullKey}[${index}]`));
          } else {
            result[`${fullKey}[${index}]`] = String(item);
          }
        });
      } else {
        result[fullKey] = String(value);
      }
    });

    return result;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getConfig(): StripeConfig {
    return { ...this.config };
  }
}

export function createStripePaymentService(config: StripeConfig): StripePaymentService {
  return new StripePaymentService(config);
}

let stripeServiceInstance: StripePaymentService | null = null;

export function initializeStripeService(config: StripeConfig): StripePaymentService {
  if (!stripeServiceInstance) {
    stripeServiceInstance = createStripePaymentService(config);
  }
  return stripeServiceInstance;
}

export function getStripeService(): StripePaymentService | null {
  return stripeServiceInstance;
}
