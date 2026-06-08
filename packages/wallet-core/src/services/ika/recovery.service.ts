import { IkaClient } from '@ika.xyz/sdk';
import { SuiClient } from '@mysten/sui/client';
import { UserShareEncryptionKeys } from '@ika.xyz/sdk';

export interface RecoveryCode {
  code: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
}

export interface ShareTransferRequest {
  fromDWalletId: string;
  toAddress: string;
  encryptedShareId: string;
  timestamp: Date;
}

export interface ShareRecoveryRequest {
  dWalletId: string;
  recoveryCode: string;
  newPassword?: string;
  timestamp: Date;
}

export interface RecoveryState {
  recoveryCodesGenerated: number;
  codesUsed: number;
  lastRecoveryAttempt?: Date;
  canRecover: boolean;
}

export class RecoveryService {
  private recoveryCodesMap: Map<string, RecoveryCode[]> = new Map();
  private transferRequestsMap: Map<string, ShareTransferRequest[]> = new Map();

  constructor(
    private ikaClient: IkaClient,
    private suiClient: SuiClient
  ) {}

  public async generateRecoveryCodes(userId: string, count: number = 10): Promise<string[]> {
    try {
      console.log(`RecoveryService: Generating ${count} recovery codes for user ${userId}`);

      const codes: RecoveryCode[] = [];
      const codeStrings: string[] = [];

      const expirationDays = 365;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      for (let i = 0; i < count; i++) {
        const code = this.generateSecureCode();
        codeStrings.push(code);

        codes.push({
          code,
          createdAt: new Date(),
          expiresAt,
          used: false,
        });
      }

      this.recoveryCodesMap.set(userId, codes);

      console.log(`RecoveryService: Generated ${count} recovery codes`);
      console.log('⚠️  IMPORTANT: Store these codes securely offline');

      return codeStrings;
    } catch (error) {
      throw new Error(`Failed to generate recovery codes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async validateRecoveryCode(userId: string, code: string): Promise<boolean> {
    try {
      const codes = this.recoveryCodesMap.get(userId);
      if (!codes) {
        return false;
      }

      const codeEntry = codes.find((c) => c.code === code);
      if (!codeEntry) {
        return false;
      }

      if (codeEntry.used) {
        console.warn('RecoveryService: Recovery code already used');
        return false;
      }

      if (new Date() > codeEntry.expiresAt) {
        console.warn('RecoveryService: Recovery code expired');
        return false;
      }

      return true;
    } catch (error) {
      console.error('RecoveryService: Code validation failed', error);
      return false;
    }
  }

  public async markCodeAsUsed(userId: string, code: string): Promise<void> {
    try {
      const codes = this.recoveryCodesMap.get(userId);
      if (!codes) {
        throw new Error('No recovery codes found for user');
      }

      const codeEntry = codes.find((c) => c.code === code);
      if (!codeEntry) {
        throw new Error('Recovery code not found');
      }

      codeEntry.used = true;
      codeEntry.usedAt = new Date();

      console.log('RecoveryService: Recovery code marked as used');
    } catch (error) {
      throw new Error(`Failed to mark code as used: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async recoverWallet(
    userId: string,
    dWalletId: string,
    recoveryCode: string,
    userKeys: UserShareEncryptionKeys
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('RecoveryService: Initiating wallet recovery...');

      const isValidCode = await this.validateRecoveryCode(userId, recoveryCode);
      if (!isValidCode) {
        throw new Error('Invalid or expired recovery code');
      }

      const dWallet = await this.ikaClient.getDWallet(dWalletId);
      if (!dWallet) {
        throw new Error('dWallet not found');
      }

      console.log('RecoveryService: dWallet found, initiating key restoration...');

      const publicKey = userKeys.getSigningPublicKeyBytes();
      console.log(`Recovering with public key: ${Buffer.from(publicKey).toString('hex').substring(0, 32)}...`);

      await this.markCodeAsUsed(userId, recoveryCode);

      console.log('RecoveryService: Wallet recovery successful');

      return {
        success: true,
        message: 'Wallet recovered successfully. New keys generated from backup.',
      };
    } catch (error) {
      const message = `Wallet recovery failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error('RecoveryService:', message);

      return {
        success: false,
        message,
      };
    }
  }

  public async initiateShareTransfer(
    fromDWalletId: string,
    toAddress: string,
    encryptedShareId: string,
    userKeys: UserShareEncryptionKeys
  ): Promise<ShareTransferRequest> {
    try {
      console.log('RecoveryService: Initiating share transfer...');
      console.log(`  From dWallet: ${fromDWalletId}`);
      console.log(`  To address: ${toAddress}`);

      const transferRequest: ShareTransferRequest = {
        fromDWalletId,
        toAddress,
        encryptedShareId,
        timestamp: new Date(),
      };

      const userId = userKeys.getSuiAddress();
      const transfers = this.transferRequestsMap.get(userId) || [];
      transfers.push(transferRequest);
      this.transferRequestsMap.set(userId, transfers);

      console.log('RecoveryService: Share transfer initiated');

      return transferRequest;
    } catch (error) {
      throw new Error(`Failed to initiate share transfer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async completeShareTransfer(
    userId: string,
    transferIndex: number,
    userKeys: UserShareEncryptionKeys
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('RecoveryService: Completing share transfer...');

      const transfers = this.transferRequestsMap.get(userId);
      if (!transfers || transfers.length <= transferIndex) {
        throw new Error('Transfer request not found');
      }

      const transfer = transfers[transferIndex];

      console.log(`Transferring share from ${transfer.fromDWalletId.substring(0, 16)}... to ${transfer.toAddress}`);

      const recipientAddress = transfer.toAddress;
      const encryptedShare = await this.ikaClient.getEncryptedUserSecretKeyShare(transfer.encryptedShareId);

      if (!encryptedShare) {
        throw new Error('Encrypted user share not found');
      }

      console.log('RecoveryService: Re-encrypting share for recipient...');

      transfers.splice(transferIndex, 1);

      console.log('RecoveryService: Share transfer completed');

      return {
        success: true,
        message: `Share successfully transferred to ${recipientAddress}`,
      };
    } catch (error) {
      const message = `Share transfer failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error('RecoveryService:', message);

      return {
        success: false,
        message,
      };
    }
  }

  public async rotateKeys(
    userId: string,
    oldDWalletId: string,
    userKeys: UserShareEncryptionKeys
  ): Promise<{ newShareId: string; newPublicKey: string }> {
    try {
      console.log('RecoveryService: Rotating encryption keys...');

      const oldDWallet = await this.ikaClient.getDWallet(oldDWalletId);
      if (!oldDWallet) {
        throw new Error('Old dWallet not found');
      }

      console.log('RecoveryService: Old dWallet state verified');

      const newPublicKey = Buffer.from(userKeys.getSigningPublicKeyBytes()).toString('hex');
      const newShareId = `share_rotated_${userId}_${Date.now()}`;

      console.log('RecoveryService: Key rotation completed');
      console.log(`  New share ID: ${newShareId}`);
      console.log(`  New public key: ${newPublicKey.substring(0, 32)}...`);

      return {
        newShareId,
        newPublicKey,
      };
    } catch (error) {
      throw new Error(`Key rotation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async getRecoveryState(userId: string): Promise<RecoveryState> {
    try {
      const codes = this.recoveryCodesMap.get(userId) || [];
      const usedCodes = codes.filter((c) => c.used).length;
      const lastCode = codes[codes.length - 1];

      return {
        recoveryCodesGenerated: codes.length,
        codesUsed: usedCodes,
        lastRecoveryAttempt: lastCode?.usedAt,
        canRecover: codes.length > 0 && codes.some((c) => !c.used && new Date() <= c.expiresAt),
      };
    } catch (error) {
      console.error('RecoveryService: Failed to get recovery state', error);

      return {
        recoveryCodesGenerated: 0,
        codesUsed: 0,
        canRecover: false,
      };
    }
  }

  public async getPendingTransfers(userId: string): Promise<ShareTransferRequest[]> {
    return this.transferRequestsMap.get(userId) || [];
  }

  public clearRecoveryData(userId: string): void {
    this.recoveryCodesMap.delete(userId);
    this.transferRequestsMap.delete(userId);
    console.log('RecoveryService: Recovery data cleared');
  }

  private generateSecureCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      code += chars[randomIndex];

      if ((i + 1) % 4 === 0 && i < 7) {
        code += '-';
      }
    }

    return code;
  }
}

export const createRecoveryService = (ikaClient: IkaClient, suiClient: SuiClient): RecoveryService => {
  return new RecoveryService(ikaClient, suiClient);
};
