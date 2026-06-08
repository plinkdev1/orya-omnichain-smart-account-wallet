import type { TransGateConnectConfig, ZkPassVerification } from './types';

export class ZkPassClient {
  private appId: string;
  private apiKey: string;
  private readonly ZKPASS_API_URL = 'https://api.zkpass.org/v1';

  constructor() {
    this.appId = process.env.NEXT_PUBLIC_ZKPASS_APP_ID || '';
    this.apiKey = process.env.ZKPASS_API_KEY || '';

    if (!this.appId) {
      console.warn('⚠️ zkPass App ID not configured');
    }
  }

  getTransGateConfig(): TransGateConnectConfig {
    return {
      appId: this.appId,
      zkPass: {
        mode: 'popup',
        theme: 'dark',
      },
      environment: process.env.NODE_ENV === 'production' ? 'prod' : 'sandbox',
    };
  }

  async initiateVerification(
    userId: string,
    schemaId: string
  ): Promise<{ transactionId: string; uri: string }> {
    try {
      const response = await fetch(`${this.ZKPASS_API_URL}/verify/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          app_id: this.appId,
          user_id: userId,
          schema_id: schemaId,
          redirect_uri: `${window.location.origin}/kyc/zkpass/callback`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to initiate verification: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error initiating zkPass verification:', error);
      throw error;
    }
  }

  async verifyCredential(
    userId: string,
    credential: Record<string, unknown>
  ): Promise<ZkPassVerification> {
    try {
      const response = await fetch(`${this.ZKPASS_API_URL}/verify/credential`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          app_id: this.appId,
          user_id: userId,
          credential,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to verify credential: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying credential:', error);
      return {
        verified: false,
        transaction_id: '',
        proof: null,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  async getVerificationStatus(transactionId: string): Promise<ZkPassVerification> {
    try {
      const response = await fetch(`${this.ZKPASS_API_URL}/verify/status/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get verification status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting verification status:', error);
      return {
        verified: false,
        transaction_id: transactionId,
        proof: null,
        error: error instanceof Error ? error.message : 'Status check failed',
      };
    }
  }

  async revokeVerification(userId: string, transactionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.ZKPASS_API_URL}/verify/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          app_id: this.appId,
          user_id: userId,
          transaction_id: transactionId,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error revoking verification:', error);
      return false;
    }
  }

  validateAppId(): boolean {
    return !!this.appId && this.appId.length > 0;
  }

  getVerificationTypes(): string[] {
    return ['age', 'income', 'creditScore', 'education', 'employment'];
  }
}
