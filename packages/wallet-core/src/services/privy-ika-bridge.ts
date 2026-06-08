import { PrivyService, PrivyWalletResult } from './privy';
import { IKAMPCService, IKAWalletResult, IKASigningSession } from './ika-mpc';
import type { EnhancedSigningRequest, EnhancedSigningResult, WalletLinkage, HealthCheckResult } from '@orya/shared-types';

export type { EnhancedSigningRequest, EnhancedSigningResult, WalletLinkage, HealthCheckResult };

export interface EnhancedWalletConfig {
  privyService: PrivyService;
  ikaMPCService: IKAMPCService;
  autoSync?: boolean;
  auditLogging?: boolean;
}

export interface EnhancedWalletResult {
  address: string;
  privyWalletId: string;
  ikaShareId: string;
  securityLevel: 'zero-trust-2pc' | 'zero-trust-2of3';
  createdAt: Date;
  threshold: string;
}

export class PrivyIKABridge {
  private config: EnhancedWalletConfig;
  private linkedWallets: Map<string, WalletLinkage> = new Map();
  private auditLog: Array<{ action: string; timestamp: Date; details: unknown }> = [];

  constructor(config: EnhancedWalletConfig) {
    this.config = config;
  }

  async createEnhancedWallet(userId: string, chainType: 'sui' = 'sui'): Promise<EnhancedWalletResult> {
    try {
      this.logAudit('WALLET_CREATE_START', { userId, chainType });

      if (!this.config.privyService.isReady()) {
        await this.config.privyService.initialize();
      }

      if (!this.config.ikaMPCService.isReady()) {
        await this.config.ikaMPCService.initialize();
      }

      const privyWallet = await this.config.privyService.createEmbeddedWallet(chainType as any);
      this.logAudit('PRIVY_WALLET_CREATED', { walletId: privyWallet.walletId, address: privyWallet.address });

      const ikaWallet = await this.config.ikaMPCService.initializeWallet(userId, privyWallet.walletId);
      this.logAudit('IKA_WALLET_INITIALIZED', { shareId: ikaWallet.shareId, address: ikaWallet.suiAddress });

      await this.linkWallets(privyWallet.walletId, ikaWallet.shareId);

      const result: EnhancedWalletResult = {
        address: ikaWallet.suiAddress,
        privyWalletId: privyWallet.walletId,
        ikaShareId: ikaWallet.shareId,
        securityLevel: 'zero-trust-2pc',
        createdAt: new Date(),
        threshold: ikaWallet.threshold,
      };

      this.logAudit('WALLET_CREATE_SUCCESS', result);
      return result;
    } catch (error) {
      this.logAudit('WALLET_CREATE_FAILED', { error: String(error) });
      throw new Error(`Enhanced wallet creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async signTransactionEnhanced(request: EnhancedSigningRequest): Promise<EnhancedSigningResult> {
    try {
      this.logAudit('SIGN_TRANSACTION_START', {
        privyWalletId: request.privyWalletId,
        ikaShareId: request.ikaShareId,
      });

      const txData = this.serializeTransaction(request.transaction);

      const privySignature = await this.config.privyService.signTransaction({
        walletId: request.privyWalletId,
        transaction: request.transaction,
        chainType: 'sui',
      });
      this.logAudit('PRIVY_SIGNATURE_OBTAINED', { walletId: request.privyWalletId });

      const privySigBytes = new Uint8Array(Buffer.from(privySignature, 'hex'));

      const signingSession = await this.config.ikaMPCService.createSigningSession(
        request.ikaShareId,
        txData,
        request.metadata
      );
      this.logAudit('IKA_SIGNING_SESSION_CREATED', { sessionId: signingSession.id });

      const finalSignature = await this.config.ikaMPCService.combineSignatures({
        sessionId: signingSession.id,
        signatures: [privySigBytes, signingSession.ikaSignature || new Uint8Array()],
        threshold: 2,
      });

      const proofOfCompletion = this.generateProofOfCompletion(
        request.privyWalletId,
        request.ikaShareId,
        finalSignature
      );

      const result: EnhancedSigningResult = {
        signature: finalSignature,
        signingSession,
        timestamp: new Date(),
        proofOfCompletion,
      };

      this.logAudit('SIGN_TRANSACTION_SUCCESS', {
        sessionId: signingSession.id,
        signatureLength: finalSignature.length,
      });

      return result;
    } catch (error) {
      this.logAudit('SIGN_TRANSACTION_FAILED', { error: String(error) });
      throw new Error(`Enhanced signing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async signMessageEnhanced(
    privyWalletId: string,
    ikaShareId: string,
    message: string
  ): Promise<EnhancedSigningResult> {
    try {
      this.logAudit('SIGN_MESSAGE_START', { privyWalletId, ikaShareId });

      const messageBytes = new Uint8Array(Buffer.from(message, 'utf-8'));

      const privySignature = await this.config.privyService.signMessage({
        walletId: privyWalletId,
        message,
        chainType: 'ethereum',
      });
      this.logAudit('PRIVY_MESSAGE_SIGNATURE', { walletId: privyWalletId });

      const privySigBytes = new Uint8Array(Buffer.from(privySignature.signature, 'hex'));

      const signingSession = await this.config.ikaMPCService.createSigningSession(ikaShareId, messageBytes, {
        messageType: 'message',
        original: message,
      });

      const finalSignature = await this.config.ikaMPCService.combineSignatures({
        sessionId: signingSession.id,
        signatures: [privySigBytes, signingSession.ikaSignature || new Uint8Array()],
        threshold: 2,
      });

      const proofOfCompletion = this.generateProofOfCompletion(privyWalletId, ikaShareId, finalSignature);

      const result: EnhancedSigningResult = {
        signature: finalSignature,
        signingSession,
        timestamp: new Date(),
        proofOfCompletion,
      };

      this.logAudit('SIGN_MESSAGE_SUCCESS', { sessionId: signingSession.id });
      return result;
    } catch (error) {
      this.logAudit('SIGN_MESSAGE_FAILED', { error: String(error) });
      throw new Error(`Message signing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async verifyWalletOwnership(privyWalletId: string, ikaShareId: string, challenge: string): Promise<boolean> {
    try {
      this.logAudit('VERIFY_OWNERSHIP_START', { privyWalletId, ikaShareId });

      const proof = await this.config.ikaMPCService.generateOwnershipProof(ikaShareId, challenge);
      const valid = await this.config.ikaMPCService.verifyOwnershipProof(proof);

      if (valid) {
        this.logAudit('VERIFY_OWNERSHIP_SUCCESS', { privyWalletId, ikaShareId });
      } else {
        this.logAudit('VERIFY_OWNERSHIP_FAILED', { privyWalletId, ikaShareId });
      }

      return valid;
    } catch (error) {
      this.logAudit('VERIFY_OWNERSHIP_ERROR', { error: String(error) });
      return false;
    }
  }

  async getWalletHealth(privyWalletId: string, ikaShareId: string): Promise<HealthCheckResult> {
    try {
      const [ikaHealth, linkageValid] = await Promise.all([
        this.config.ikaMPCService.getShareHealth(ikaShareId),
        this.verifyLinkage(privyWalletId, ikaShareId),
      ]);

      const result: HealthCheckResult = {
        privyHealthy: true,
        ikaHealthy: ikaHealth.status === 'healthy',
        linkageValid,
        overallStatus: ikaHealth.status === 'healthy' && linkageValid ? 'healthy' : 'degraded',
        lastCheck: new Date(),
      };

      this.logAudit('HEALTH_CHECK_COMPLETED', result);
      return result;
    } catch (error) {
      this.logAudit('HEALTH_CHECK_FAILED', { error: String(error) });
      return {
        privyHealthy: false,
        ikaHealthy: false,
        linkageValid: false,
        overallStatus: 'offline',
        lastCheck: new Date(),
      };
    }
  }

  async rotateKeyShares(userId: string, privyWalletId: string, ikaShareId: string): Promise<EnhancedWalletResult> {
    try {
      this.logAudit('KEY_ROTATION_START', { userId, privyWalletId, ikaShareId });

      const newIkaWallet = await this.config.ikaMPCService.rotateKeyShare(ikaShareId, userId);
      this.logAudit('IKA_KEY_ROTATION_COMPLETE', { oldShareId: ikaShareId, newShareId: newIkaWallet.shareId });

      await this.linkWallets(privyWalletId, newIkaWallet.shareId);

      const result: EnhancedWalletResult = {
        address: newIkaWallet.suiAddress,
        privyWalletId,
        ikaShareId: newIkaWallet.shareId,
        securityLevel: 'zero-trust-2pc',
        createdAt: new Date(),
        threshold: newIkaWallet.threshold,
      };

      this.logAudit('KEY_ROTATION_SUCCESS', result);
      return result;
    } catch (error) {
      this.logAudit('KEY_ROTATION_FAILED', { error: String(error) });
      throw new Error(`Key rotation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async recoverEnhancedWallet(userId: string, recoveryCode: string): Promise<EnhancedWalletResult> {
    try {
      this.logAudit('WALLET_RECOVERY_START', { userId });

      const recoveredIKAWallet = await this.config.ikaMPCService.recoverWallet(userId, recoveryCode);
      this.logAudit('IKA_WALLET_RECOVERED', { shareId: recoveredIKAWallet.shareId });

      return {
        address: recoveredIKAWallet.suiAddress,
        privyWalletId: `recovered-${userId}`,
        ikaShareId: recoveredIKAWallet.shareId,
        securityLevel: 'zero-trust-2pc',
        createdAt: new Date(),
        threshold: recoveredIKAWallet.threshold,
      };
    } catch (error) {
      this.logAudit('WALLET_RECOVERY_FAILED', { error: String(error) });
      throw new Error(`Wallet recovery failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async linkWallets(privyWalletId: string, ikaShareId: string): Promise<void> {
    try {
      const linkage: WalletLinkage = {
        privyWalletId,
        ikaShareId,
        linkType: 'enhanced-mpc',
        linkedAt: new Date(),
        status: 'active',
      };

      this.linkedWallets.set(`${privyWalletId}:${ikaShareId}`, linkage);

      await fetch('/api/wallets/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkage),
      });

      this.logAudit('WALLETS_LINKED', { privyWalletId, ikaShareId });
    } catch (error) {
      this.logAudit('WALLET_LINKAGE_FAILED', { error: String(error) });
      throw new Error(`Failed to link wallets: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async verifyLinkage(privyWalletId: string, ikaShareId: string): Promise<boolean> {
    try {
      const linkage = this.linkedWallets.get(`${privyWalletId}:${ikaShareId}`);

      if (!linkage || linkage.status !== 'active') {
        return false;
      }

      const response = await fetch('/api/wallets/verify-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privyWalletId, ikaShareId }),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private serializeTransaction(tx: unknown): Uint8Array {
    try {
      const jsonStr = JSON.stringify(tx);
      return new Uint8Array(Buffer.from(jsonStr, 'utf-8'));
    } catch (error) {
      throw new Error(`Failed to serialize transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private generateProofOfCompletion(privyWalletId: string, ikaShareId: string, signature: Uint8Array): string {
    const timestamp = Date.now();
    const proof = `${privyWalletId}:${ikaShareId}:${Buffer.from(signature).toString('hex')}:${timestamp}`;
    return Buffer.from(proof).toString('base64');
  }

  private logAudit(action: string, details: unknown): void {
    if (this.config.auditLogging) {
      this.auditLog.push({
        action,
        timestamp: new Date(),
        details,
      });

      if (this.auditLog.length > 1000) {
        this.auditLog = this.auditLog.slice(-500);
      }
    }
  }
}

export function createPrivyIKABridge(config: EnhancedWalletConfig): PrivyIKABridge {
  return new PrivyIKABridge(config);
}
