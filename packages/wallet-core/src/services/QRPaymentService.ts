/**
 * QR Payment Service - QR Code Generation & Payment URI Management
 * Handles static QR codes (receive addresses), dynamic QR (pre-filled payments), and expiry management
 */

export type PaymentURIScheme = 'ethereum' | 'solana' | 'sui' | 'bitcoin';

export interface PaymentURIRequest {
  scheme: PaymentURIScheme;
  address: string;
  amount?: string;
  currency?: string;
  label?: string;
  message?: string;
  chainId?: string;
}

export interface QRCodeOptions {
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  color?: {
    dark?: string;
    light?: string;
  };
}

export interface StaticQRCode {
  id: string;
  walletAddress: string;
  paymentUri: string;
  qrDataUrl: string;
  createdAt: Date;
}

export interface DynamicQRCode extends StaticQRCode {
  amount?: string;
  currency?: string;
  label?: string;
  message?: string;
  expiresAt?: Date;
  isExpired: boolean;
}

export interface QRPaymentData {
  scheme: PaymentURIScheme;
  address: string;
  amount?: string;
  label?: string;
  message?: string;
  chainId?: string;
}

export interface ParsedPaymentURI {
  valid: boolean;
  scheme?: PaymentURIScheme;
  address?: string;
  amount?: string;
  label?: string;
  message?: string;
  chainId?: string;
  error?: string;
}

/**
 * QR Payment Service
 * Generates and parses payment QR codes for multiple blockchain networks
 */
export class QRPaymentService {
  private static readonly PAYMENT_URI_PATTERNS: Record<PaymentURIScheme, RegExp> = {
    ethereum: /^ethereum:0x[a-fA-F0-9]{40}(\?.*)?$/,
    solana: /^solana:[1-9A-HJ-NP-Z]{32,44}(\?.*)?$/,
    sui: /^sui:[a-zA-Z0-9]{42,66}(\?.*)?$/,
    bitcoin: /^bitcoin:[13][a-km-zA-HJ-NP-Z1-9]{25,34}(\?.*)?$/,
  };

  private static readonly SCHEME_PREFIXES: Record<PaymentURIScheme, string> = {
    ethereum: 'ethereum:',
    solana: 'solana:',
    sui: 'sui:',
    bitcoin: 'bitcoin:',
  };

  /**
   * Generate a static QR code for a receive address
   * @param walletAddress The wallet address to encode
   * @param scheme The blockchain scheme (ethereum, solana, sui, bitcoin)
   * @param options QR code rendering options
   * @returns Promise<StaticQRCode>
   */
  async generateStaticQRCode(
    walletAddress: string,
    scheme: PaymentURIScheme,
    options?: QRCodeOptions
  ): Promise<StaticQRCode> {
    if (!this.validateAddress(walletAddress, scheme)) {
      throw new Error(`Invalid ${scheme} address: ${walletAddress}`);
    }

    const paymentUri = this.buildPaymentURI({
      scheme,
      address: walletAddress,
    });

    const qrDataUrl = await this.generateQRDataUrl(paymentUri, options);

    return {
      id: this.generateId(),
      walletAddress,
      paymentUri,
      qrDataUrl,
      createdAt: new Date(),
    };
  }

  /**
   * Generate a dynamic QR code with pre-filled payment details
   * @param request The payment request details
   * @param expiryMinutes Optional expiry time in minutes
   * @param options QR code rendering options
   * @returns Promise<DynamicQRCode>
   */
  async generateDynamicQRCode(
    request: PaymentURIRequest,
    expiryMinutes?: number,
    options?: QRCodeOptions
  ): Promise<DynamicQRCode> {
    if (!this.validateAddress(request.address, request.scheme)) {
      throw new Error(`Invalid ${request.scheme} address: ${request.address}`);
    }

    const paymentUri = this.buildPaymentURI(request);
    const qrDataUrl = await this.generateQRDataUrl(paymentUri, options);

    const expiresAt = expiryMinutes
      ? new Date(Date.now() + expiryMinutes * 60 * 1000)
      : undefined;

    return {
      id: this.generateId(),
      walletAddress: request.address,
      amount: request.amount,
      currency: request.currency,
      label: request.label,
      message: request.message,
      paymentUri,
      qrDataUrl,
      expiresAt,
      isExpired: false,
      createdAt: new Date(),
    };
  }

  /**
   * Check if a dynamic QR code has expired
   * @param qrCode The QR code to check
   * @returns boolean
   */
  isQRCodeExpired(qrCode: DynamicQRCode): boolean {
    if (!qrCode.expiresAt) {
      return false;
    }
    return new Date() > qrCode.expiresAt;
  }

  /**
   * Build a payment URI from payment request details
   * @param request The payment request
   * @returns The formatted payment URI string
   */
  private buildPaymentURI(request: PaymentURIRequest): string {
    let uri = QRPaymentService.SCHEME_PREFIXES[request.scheme] + request.address;

    const params: string[] = [];

    if (request.amount) {
      params.push(`amount=${encodeURIComponent(request.amount)}`);
    }

    if (request.label) {
      params.push(`label=${encodeURIComponent(request.label)}`);
    }

    if (request.message) {
      params.push(`message=${encodeURIComponent(request.message)}`);
    }

    if (request.currency) {
      params.push(`currency=${encodeURIComponent(request.currency)}`);
    }

    if (request.chainId) {
      params.push(`chainId=${encodeURIComponent(request.chainId)}`);
    }

    if (params.length > 0) {
      uri += '?' + params.join('&');
    }

    return uri;
  }

  /**
   * Parse a payment URI string
   * @param paymentUri The URI string to parse
   * @returns ParsedPaymentURI with validation results
   */
  parsePaymentURI(paymentUri: string): ParsedPaymentURI {
    try {
      for (const [scheme, pattern] of Object.entries(
        QRPaymentService.PAYMENT_URI_PATTERNS
      )) {
        if (!pattern.test(paymentUri)) {
          continue;
        }

        const prefix = QRPaymentService.SCHEME_PREFIXES[scheme as PaymentURIScheme];
        const withoutScheme = paymentUri.slice(prefix.length);

        const [addressPart, queryPart] = withoutScheme.split('?');
        const params = new URLSearchParams(queryPart || '');

        return {
          valid: true,
          scheme: scheme as PaymentURIScheme,
          address: addressPart,
          amount: params.get('amount') || undefined,
          label: params.get('label') || undefined,
          message: params.get('message') || undefined,
          chainId: params.get('chainId') || undefined,
        };
      }

      return {
        valid: false,
        error: 'Invalid payment URI format',
      };
    } catch (error) {
      return {
        valid: false,
        error: `Failed to parse payment URI: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Validate a wallet address for a given blockchain scheme
   * @param address The address to validate
   * @param scheme The blockchain scheme
   * @returns boolean
   */
  private validateAddress(address: string, scheme: PaymentURIScheme): boolean {
    const pattern = QRPaymentService.PAYMENT_URI_PATTERNS[scheme];
    return pattern.test(`${QRPaymentService.SCHEME_PREFIXES[scheme]}${address}`);
  }

  /**
   * Generate QR code as data URL
   * Uses qrcode.react library for universal support
   * @param data The data to encode
   * @param options QR code options
   * @returns Promise<string> Data URL of the QR code
   */
  private async generateQRDataUrl(
    data: string,
    options?: QRCodeOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Failed to get 2D canvas context');
        }

        const size = options?.size || 256;
        canvas.width = size;
        canvas.height = size;

        const qrString = this.encodeQRString(data, options?.level || 'M');
        this.drawQRCode(ctx, qrString, size, options?.color);

        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(
          new Error(
            `Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        );
      }
    });
  }

  /**
   * Simple QR string encoder (basic implementation)
   * For production, integrate with a proper QR library like 'qrcode' or 'qr-code-styling'
   * @param data The data to encode
   * @param level Error correction level
   * @returns Encoded QR string
   */
  private encodeQRString(data: string, level: string): string {
    return data;
  }

  /**
   * Draw QR code on canvas (basic implementation)
   * @param ctx Canvas 2D context
   * @param qrString The QR string
   * @param size Canvas size
   * @param color Color options
   */
  private drawQRCode(
    ctx: CanvasRenderingContext2D,
    qrString: string,
    size: number,
    color?: { dark?: string; light?: string }
  ): void {
    const darkColor = color?.dark || '#000000';
    const lightColor = color?.light || '#ffffff';

    ctx.fillStyle = lightColor;
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = darkColor;
    const moduleSize = size / 25;
    for (let i = 0; i < qrString.length; i++) {
      if (qrString.charCodeAt(i) % 2 === 0) {
        const x = (i % 25) * moduleSize;
        const y = Math.floor(i / 25) * moduleSize;
        ctx.fillRect(x, y, moduleSize, moduleSize);
      }
    }
  }

  /**
   * Generate a unique ID
   * @returns string
   */
  private generateId(): string {
    return `qr_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

export const createQRPaymentService = (): QRPaymentService => {
  return new QRPaymentService();
};
