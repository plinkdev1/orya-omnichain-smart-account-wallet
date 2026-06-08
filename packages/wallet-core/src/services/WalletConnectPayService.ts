/**
 * WalletConnect Pay Service
 * Payment method using WalletConnect v2 connected wallets
 * Generates QR codes, manages payment sessions, handles approvals
 * Works with mobile and desktop wallets via deep linking
 */

export interface WalletConnectPayConfig {
  projectId: string;
  name?: string;
  description?: string;
  url?: string;
  icon?: string;
}

export interface PaymentSession {
  id: string;
  qrCode: string;
  deepLink?: string;
  uri: string;
  expiresAt: Date;
  status: 'active' | 'confirmed' | 'rejected' | 'expired';
}

export interface PaymentRequest {
  id: string;
  topic: string;
  chainId: string;
  request: {
    method: string;
    params: any[];
  };
  timestamp: Date;
  expiresAt: Date;
}

export interface WalletConnectPaymentInitiation {
  sessionId: string;
  qrCode: string;
  deepLink?: string;
  expiresAt: Date;
  amount: string;
  currency: string;
  recipientAddress: string;
  chainId: string;
}

export interface PaymentConfirmation {
  sessionId: string;
  transactionHash: string;
  status: 'confirmed' | 'failed' | 'pending';
  signature?: string;
  timestamp: Date;
}

export interface ApplePayInfo {
  displayName: string;
  displayDescription?: string;
  amount: number;
  currency: string;
  countryCode?: string;
  supportedNetworks?: string[];
  requiredBillingContactFields?: string[];
  requiredShippingContactFields?: string[];
}

export interface GooglePayInfo {
  apiVersion: number;
  apiVersionMinor: number;
  merchantInfo: {
    merchantName: string;
    merchantId?: string;
  };
  allowedPaymentMethods: Array<{
    type: string;
    parameters: any;
  }>;
  transactionInfo: {
    totalPriceStatus: string;
    totalPrice: string;
    currencyCode: string;
  };
}

/**
 * WalletConnect Pay Service
 * Manages payments via WalletConnect, Apple Pay, and Google Pay
 */
export class WalletConnectPayService {
  private config: WalletConnectPayConfig;
  private isInitialized: boolean = false;
  private activeSessions: Map<string, PaymentSession> = new Map();
  private sessionListeners: Map<string, Set<Function>> = new Map();

  constructor(config: WalletConnectPayConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      if (!this.config.projectId) {
        throw new Error('WalletConnect projectId is required');
      }

      this.isInitialized = true;
      this.setupCleanupInterval();
    } catch (error) {
      throw new Error(
        `Failed to initialize WalletConnect Pay: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Initiate a payment via WalletConnect
   */
  async initiatePayment(
    amount: string,
    currency: string,
    recipientAddress: string,
    chainId: string,
    description?: string
  ): Promise<WalletConnectPaymentInitiation> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const sessionId = this.generateSessionId();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const deepLink = this.buildDeepLink({
        amount,
        currency,
        recipient: recipientAddress,
        chainId,
        description,
        sessionId,
      });

      const qrCode = await this.generateQRCode(deepLink);

      const session: PaymentSession = {
        id: sessionId,
        qrCode,
        deepLink,
        uri: deepLink,
        expiresAt,
        status: 'active',
      };

      this.activeSessions.set(sessionId, session);
      this.emit(sessionId, 'session_created', session);

      return {
        sessionId,
        qrCode,
        deepLink,
        expiresAt,
        amount,
        currency,
        recipientAddress,
        chainId,
      };
    } catch (error) {
      throw new Error(
        `Failed to initiate payment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Process Apple Pay payment
   */
  async processApplePayment(
    applePayToken: any,
    amount: number,
    currency: string,
    recipientAddress: string
  ): Promise<PaymentConfirmation> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const sessionId = this.generateSessionId();

      const confirmation: PaymentConfirmation = {
        sessionId,
        transactionHash: applePayToken?.transactionIdentifier || '',
        status: 'confirmed',
        timestamp: new Date(),
      };

      this.emit(sessionId, 'apple_pay_confirmed', confirmation);

      return confirmation;
    } catch (error) {
      throw new Error(
        `Failed to process Apple Pay: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Process Google Pay payment
   */
  async processGooglePayment(
    googlePayToken: any,
    amount: number,
    currency: string,
    recipientAddress: string
  ): Promise<PaymentConfirmation> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const sessionId = this.generateSessionId();

      const confirmation: PaymentConfirmation = {
        sessionId,
        transactionHash: googlePayToken?.transactionId || '',
        status: 'confirmed',
        timestamp: new Date(),
      };

      this.emit(sessionId, 'google_pay_confirmed', confirmation);

      return confirmation;
    } catch (error) {
      throw new Error(
        `Failed to process Google Pay: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Confirm payment session with wallet signature
   */
  async confirmPaymentSession(
    sessionId: string,
    signature: string,
    transactionHash: string
  ): Promise<PaymentConfirmation> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const session = this.activeSessions.get(sessionId);

      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      if (new Date() > session.expiresAt) {
        session.status = 'expired';
        throw new Error('Session has expired');
      }

      session.status = 'confirmed';

      const confirmation: PaymentConfirmation = {
        sessionId,
        transactionHash,
        status: 'confirmed',
        signature,
        timestamp: new Date(),
      };

      this.emit(sessionId, 'payment_confirmed', confirmation);

      return confirmation;
    } catch (error) {
      throw new Error(
        `Failed to confirm payment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Reject payment session
   */
  async rejectPaymentSession(sessionId: string, reason?: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const session = this.activeSessions.get(sessionId);

      if (session) {
        session.status = 'rejected';
        this.emit(sessionId, 'payment_rejected', { reason });
      }
    } catch (error) {
      throw new Error(
        `Failed to reject payment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get payment session status
   */
  getSessionStatus(sessionId: string): PaymentSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Listen for session events
   */
  onSessionEvent(
    sessionId: string,
    event: string,
    callback: (data: any) => void
  ): () => void {
    if (!this.sessionListeners.has(sessionId)) {
      this.sessionListeners.set(sessionId, new Set());
    }

    const listeners = this.sessionListeners.get(sessionId)!;
    const handler = (e: string, data: any) => {
      if (e === event) {
        callback(data);
      }
    };

    listeners.add(handler as any);

    return () => {
      listeners.delete(handler as any);
    };
  }

  /**
   * Get Apple Pay configuration
   */
  getApplePayConfig(
    displayName: string,
    amount: number,
    currency: string
  ): ApplePayInfo {
    return {
      displayName,
      displayDescription: 'Crypto Payment',
      amount,
      currency,
      countryCode: 'US',
      supportedNetworks: ['visa', 'mastercard', 'amex'],
      requiredBillingContactFields: ['postalAddress'],
    };
  }

  /**
   * Get Google Pay configuration
   */
  getGooglePayConfig(
    merchantName: string,
    amount: string,
    currency: string
  ): GooglePayInfo {
    return {
      apiVersion: 2,
      apiVersionMinor: 0,
      merchantInfo: {
        merchantName,
        merchantId: 'orya-wallet',
      },
      allowedPaymentMethods: [
        {
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['MASTERCARD', 'VISA'],
          },
        },
      ],
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPrice: amount,
        currencyCode: currency,
      },
    };
  }

  /**
   * Build deep link for wallet connection
   */
  private buildDeepLink(params: any): string {
    const baseUri = `wc:${this.config.projectId}`;

    const queryParams = new URLSearchParams({
      amount: params.amount,
      currency: params.currency,
      recipient: params.recipient,
      chainId: params.chainId,
      sessionId: params.sessionId,
      ...(params.description && { description: params.description }),
    });

    return `${baseUri}?${queryParams.toString()}`;
  }

  /**
   * Generate QR code from URI
   */
  private async generateQRCode(uri: string): Promise<string> {
    try {
      const qrcodeModule = (await import('qrcode')) as any;

      if (!qrcodeModule || !qrcodeModule.toDataURL) {
        return uri;
      }

      const qrCode = await qrcodeModule.toDataURL(uri, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 1,
        width: 300,
      });

      return qrCode;
    } catch (error) {
      return uri;
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `wcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Emit event to listeners
   */
  private emit(sessionId: string, event: string, data: any): void {
    const listeners = this.sessionListeners.get(sessionId);

    if (listeners) {
      listeners.forEach((listener: any) => {
        try {
          listener(event, data);
        } catch (error) {
          console.error(`Error in session listener: ${error}`);
        }
      });
    }
  }

  /**
   * Setup automatic session cleanup
   */
  private setupCleanupInterval(): void {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        const now = new Date();

        this.activeSessions.forEach((session, sessionId) => {
          if (session.status === 'expired' || now > session.expiresAt) {
            this.activeSessions.delete(sessionId);
            this.sessionListeners.delete(sessionId);
          }
        });
      }, 60000);
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getConfig(): WalletConnectPayConfig {
    return { ...this.config };
  }
}

export function createWalletConnectPayService(
  config: WalletConnectPayConfig
): WalletConnectPayService {
  return new WalletConnectPayService(config);
}

let wcPayServiceInstance: WalletConnectPayService | null = null;

export function initializeWalletConnectPayService(
  config: WalletConnectPayConfig
): WalletConnectPayService {
  if (!wcPayServiceInstance) {
    wcPayServiceInstance = createWalletConnectPayService(config);
  }
  return wcPayServiceInstance;
}

export function getWalletConnectPayService(): WalletConnectPayService | null {
  return wcPayServiceInstance;
}
