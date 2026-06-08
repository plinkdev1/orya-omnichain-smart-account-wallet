import type { ZkycVerification, ZkycSBTMintRequest, ZkycWebhookPayload } from './types';
import { ethers } from 'ethers';

export class ZkycClient {
  private apiKey: string;
  private contractAddress: string;
  private signerPrivateKey: string;
  private webhookSecret: string;
  private readonly ZKYC_API_URL = 'https://api.zkyc.tech/v1';

  constructor() {
    this.apiKey = process.env.ZKYC_API_KEY || '';
    this.contractAddress = process.env.ZKYC_CONTRACT_ADDRESS || '';
    this.signerPrivateKey = process.env.ZKYC_SIGNER_PRIVATE_KEY || '';
    this.webhookSecret = process.env.ZKYC_WEBHOOK_SECRET || '';

    if (!this.apiKey || !this.contractAddress) {
      console.warn('⚠️ zKYC.tech credentials not configured');
    }
  }

  async initiateKycProcess(
    userId: string,
    userAddress: string,
    provider?: string
  ): Promise<{ processId: string; redirectUrl: string }> {
    try {
      const response = await fetch(`${this.ZKYC_API_URL}/kyc/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          user_id: userId,
          wallet_address: userAddress,
          provider: provider || 'sumsub',
          redirect_uri: `${typeof window !== 'undefined' ? window.location.origin : ''}/kyc/zkyc/callback`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to initiate KYC: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error initiating zKYC process:', error);
      throw error;
    }
  }

  async getVerificationStatus(userId: string): Promise<ZkycVerification> {
    try {
      const response = await fetch(`${this.ZKYC_API_URL}/kyc/status/${userId}`, {
        headers: {
          'X-API-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            user_id: userId,
            status: 'pending',
            level: 'none',
            verified: false,
            sbt_minted: false,
            created_at: new Date().toISOString(),
          };
        }
        throw new Error(`Failed to get verification status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting zKYC status:', error);
      return {
        user_id: userId,
        status: 'error',
        level: 'none',
        verified: false,
        sbt_minted: false,
        created_at: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Status check failed',
      };
    }
  }

  async mintSoulboundToken(request: ZkycSBTMintRequest): Promise<{ txHash: string; sbtId: string }> {
    try {
      const signature = this.generateSignature(request);

      const response = await fetch(`${this.ZKYC_API_URL}/sbt/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          ...request,
          signature,
          contract_address: this.contractAddress,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to mint SBT: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error minting soulbound token:', error);
      throw error;
    }
  }

  async revokeSoulboundToken(userId: string, sbtId: string): Promise<{ txHash: string }> {
    try {
      const response = await fetch(`${this.ZKYC_API_URL}/sbt/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          user_id: userId,
          sbt_id: sbtId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to revoke SBT: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error revoking soulbound token:', error);
      throw error;
    }
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    try {
      const hash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(`${payload}${this.webhookSecret}`)
      );
      return hash === signature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  processWebhookPayload(payload: ZkycWebhookPayload): void {
    switch (payload.event_type) {
      case 'kyc.verified':
        this.handleKycVerified(payload);
        break;
      case 'kyc.rejected':
        this.handleKycRejected(payload);
        break;
      case 'sbt.minted':
        this.handleSbtMinted(payload);
        break;
      case 'sbt.revoked':
        this.handleSbtRevoked(payload);
        break;
      default:
        console.warn(`Unknown webhook event type: ${payload.event_type}`);
    }
  }

  private handleKycVerified(payload: ZkycWebhookPayload): void {
    console.log('KYC verified:', payload.data);
  }

  private handleKycRejected(payload: ZkycWebhookPayload): void {
    console.log('KYC rejected:', payload.data);
  }

  private handleSbtMinted(payload: ZkycWebhookPayload): void {
    console.log('SBT minted:', payload.data);
  }

  private handleSbtRevoked(payload: ZkycWebhookPayload): void {
    console.log('SBT revoked:', payload.data);
  }

  private generateSignature(data: unknown): string {
    try {
      const dataString = JSON.stringify(data);
      const messageHash = ethers.utils.hashMessage(dataString);
      const wallet = new ethers.Wallet(this.signerPrivateKey);
      return wallet.signMessage(ethers.utils.arrayify(messageHash));
    } catch (error) {
      console.error('Error generating signature:', error);
      return '';
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.contractAddress && !!this.signerPrivateKey;
  }

  getKycLevels(): string[] {
    return ['none', 'basic', 'advanced', 'professional'];
  }
}
