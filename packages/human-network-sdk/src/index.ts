const HUMAN_NETWORK_API_KEY = process.env.HUMAN_NETWORK_API_KEY!;

export interface HumanWalletResult {
  address: string;
  passportId?: string;
  walletId: string;
}

export interface WalletCreateOptions {
  userId: string;
  metadata?: Record<string, any>;
}

export interface PassportSession {
  embedUrl: string;
  sessionId: string;
}

export interface PassportStamp {
  id: string;
  name: string;
  verified: boolean;
  verifiedAt?: string;
}

export class HumanNetworkService {
  private apiKey: string;
  private network: 'mainnet' | 'testnet';
  private baseUrl: string;

  constructor(apiKey?: string, network: 'mainnet' | 'testnet' = 'testnet') {
    this.apiKey = apiKey || HUMAN_NETWORK_API_KEY;
    this.network = network;
    this.baseUrl =
      network === 'mainnet'
        ? 'https://api.humantech.io'
        : 'https://testnet-api.humantech.io';
  }

  async createWallet(userId: string, metadata?: Record<string, any>): Promise<HumanWalletResult> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/wallets/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          userId,
          metadata: {
            app: 'orya-wallet',
            ...metadata,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const wallet = await response.json();
      return {
        address: wallet.address,
        walletId: wallet.id,
        passportId: wallet.passportId,
      };
    } catch (error) {
      throw new Error(`Human Network wallet creation failed: ${error}`);
    }
  }

  async initializePassport(userId: string): Promise<PassportSession> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/passport/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const session = await response.json();
      return {
        embedUrl: session.embedUrl,
        sessionId: session.id,
      };
    } catch (error) {
      throw new Error(`Passport initialization failed: ${error}`);
    }
  }

  async getPassportStamps(userId: string): Promise<PassportStamp[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/passport/stamps/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const stamps = await response.json();
      return stamps;
    } catch (error) {
      throw new Error(`Failed to fetch stamps: ${error}`);
    }
  }

  async verifyHumanity(userId: string, minimumStamps: number = 3): Promise<boolean> {
    try {
      const stamps = await this.getPassportStamps(userId);
      const verifiedStamps = stamps.filter((stamp) => stamp.verified);
      return verifiedStamps.length >= minimumStamps;
    } catch (error) {
      return false;
    }
  }

  async getPassportStatus(userId: string): Promise<{ isVerified: boolean; stampCount: number }> {
    try {
      const stamps = await this.getPassportStamps(userId);
      const verifiedStamps = stamps.filter((stamp) => stamp.verified);
      return {
        isVerified: verifiedStamps.length >= 3,
        stampCount: verifiedStamps.length,
      };
    } catch (error) {
      return {
        isVerified: false,
        stampCount: 0,
      };
    }
  }
}

export const humanNetworkService = new HumanNetworkService();

export { PassportEmbed } from './PassportEmbed';
