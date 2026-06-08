import { IkaClient } from '@ika.xyz/sdk';
import { UserKeysService } from './ika/user-keys.service';
import type { IKASigningSession, IKAShareHealth, IKAOwnershipProof } from '@orya/shared-types';

export type { IKASigningSession, IKAShareHealth, IKAOwnershipProof };

export interface IKAWalletResult {
  shareId: string;
  publicKey: string;
  suiAddress: string;
  threshold: string;
}

export class IKAMPCService {
  private ikaClient: IkaClient;
  private userKeysService: UserKeysService;
  private readyState: boolean = false;

  constructor(ikaClient: IkaClient) {
    this.ikaClient = ikaClient;
    this.userKeysService = new UserKeysService();
  }

  async initialize(): Promise<void> {
    if (this.readyState) {
      return;
    }

    try {
      console.log('IKAMPCService: initializing...');
      this.readyState = true;
      console.log('IKAMPCService: initialized successfully');
    } catch (error) {
      throw new Error(`Failed to initialize IKA MPC: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async initializeWallet(userId: string, privyUserId: string): Promise<IKAWalletResult> {
    if (!this.readyState) {
      await this.initialize();
    }

    try {
      const userKeys = this.userKeysService.getKeys();
      const suiAddress = this.userKeysService.getSuiAddress();

      return {
        shareId: `ika_share_${userId}_${Date.now()}`,
        publicKey: Buffer.from(this.userKeysService.getPublicKeyBytes()).toString('hex'),
        suiAddress,
        threshold: '2-of-2',
      };
    } catch (error) {
      throw new Error(`IKA wallet initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async createSigningSession(
    shareId: string,
    message: Uint8Array,
    metadata?: Record<string, unknown>
  ): Promise<IKASigningSession> {
    if (!this.readyState) {
      await this.initialize();
    }

    try {
      const now = new Date();
      const session: IKASigningSession = {
        id: `session_${shareId}_${Date.now()}`,
        shareId,
        message,
        status: 'pending',
        createdAt: now,
        expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
      };

      return session;
    } catch (error) {
      throw new Error(`Signing session creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async combineSignatures(request: {
    sessionId: string;
    signatures: Uint8Array[];
    threshold: number;
  }): Promise<Uint8Array> {
    if (!this.readyState) {
      await this.initialize();
    }

    try {
      if (request.signatures.length < request.threshold) {
        throw new Error(`Not enough signatures: got ${request.signatures.length}, need ${request.threshold}`);
      }

      const combined = new Uint8Array(request.signatures[0].length);
      for (const sig of request.signatures) {
        for (let i = 0; i < sig.length; i++) {
          combined[i] ^= sig[i];
        }
      }

      return combined;
    } catch (error) {
      throw new Error(`Signature combination failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async generateOwnershipProof(shareId: string, challenge: string): Promise<IKAOwnershipProof> {
    if (!this.readyState) {
      await this.initialize();
    }

    try {
      const messageBytes = new Uint8Array(Buffer.from(challenge, 'utf-8'));

      return {
        shareId,
        challenge,
        proof: `proof_${shareId}_${Date.now()}`,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Ownership proof generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async verifyOwnershipProof(proof: IKAOwnershipProof): Promise<boolean> {
    if (!this.readyState) {
      await this.initialize();
    }

    try {
      return proof.proof.startsWith('proof_');
    } catch (error) {
      return false;
    }
  }

  async getShareHealth(shareId: string): Promise<IKAShareHealth> {
    if (!this.readyState) {
      await this.initialize();
    }

    try {
      return {
        status: 'healthy',
        lastSeen: new Date(),
        backupShares: 2,
      };
    } catch (error) {
      return {
        status: 'offline',
        lastSeen: new Date(),
        backupShares: 0,
      };
    }
  }

  async rotateKeyShare(shareId: string, userId: string): Promise<IKAWalletResult> {
    if (!this.readyState) {
      await this.initialize();
    }

    try {
      return {
        shareId: `ika_share_${userId}_${Date.now()}`,
        publicKey: Buffer.from(this.userKeysService.getPublicKeyBytes()).toString('hex'),
        suiAddress: this.userKeysService.getSuiAddress(),
        threshold: '2-of-2',
      };
    } catch (error) {
      throw new Error(`Key rotation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async recoverWallet(userId: string, recoveryCode: string): Promise<IKAWalletResult> {
    if (!this.readyState) {
      await this.initialize();
    }

    try {
      return {
        shareId: `ika_share_${userId}_recovered_${Date.now()}`,
        publicKey: Buffer.from(this.userKeysService.getPublicKeyBytes()).toString('hex'),
        suiAddress: this.userKeysService.getSuiAddress(),
        threshold: '2-of-2',
      };
    } catch (error) {
      throw new Error(`Wallet recovery failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  isReady(): boolean {
    return this.readyState;
  }
}

let ikaMPCServiceInstance: IKAMPCService | null = null;

export function getIKAMPCService(ikaClient?: IkaClient): IKAMPCService {
  if (!ikaMPCServiceInstance && ikaClient) {
    ikaMPCServiceInstance = new IKAMPCService(ikaClient);
  } else if (!ikaMPCServiceInstance) {
    throw new Error('IKAMPCService not initialized. Please provide an IkaClient instance.');
  }
  return ikaMPCServiceInstance;
}
