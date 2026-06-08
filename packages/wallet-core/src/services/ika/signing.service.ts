import { IkaClient, IkaTransaction, SignatureAlgorithm, Hash, UserShareEncryptionKeys } from '@ika.xyz/sdk';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';

export interface SignMessageParams {
  dWalletId: string;
  dWalletCapId: string;
  message: Uint8Array;
  presignId: string;
  encryptedUserShareId: string;
  userKeys: UserShareEncryptionKeys;
  ikaCoinId: string;
  hashScheme?: Hash;
}

export interface SignatureResult {
  signature: Uint8Array;
  transactionDigest: string;
  signedMessage: Uint8Array;
}

export interface SigningState {
  message: Uint8Array;
  hashScheme: Hash;
  timestamp: number;
}

export class SigningService {
  constructor(
    private ikaClient: IkaClient,
    private suiClient: SuiClient
  ) {}

  public async signMessage(
    params: SignMessageParams
  ): Promise<SignatureResult> {
    const {
      dWalletId,
      dWalletCapId,
      message,
      presignId,
      encryptedUserShareId,
      userKeys,
      ikaCoinId,
      hashScheme = Hash.KECCAK256,
    } = params;

    try {
      const dWallet = await this.ikaClient.getDWallet(dWalletId);

      if (dWallet.state.$kind !== 'Active') {
        throw new Error(`dWallet not active: ${dWallet.state.$kind}`);
      }

      const presign = await this.ikaClient.getPresign(presignId);

      if (presign.state.$kind !== 'Completed') {
        throw new Error(`Presign not ready: ${presign.state.$kind}`);
      }

      const encryptedUserShare = await this.ikaClient.getEncryptedUserSecretKeyShare(
        encryptedUserShareId
      );

      const tx = new Transaction();
      const ikaTx = new IkaTransaction({
        ikaClient: this.ikaClient,
        transaction: tx,
        userShareEncryptionKeys: userKeys,
      });

      const messageApproval = await ikaTx.approveMessage({
        dWalletCap: dWalletCapId,
        signatureAlgorithm: SignatureAlgorithm.ECDSA,
        hashScheme,
        message,
      });

      const verifiedPresignCap = await ikaTx.verifyPresignCap({
        presign,
      });

      await ikaTx.requestSign({
        dWallet,
        messageApproval,
        hashScheme,
        verifiedPresignCap,
        presign,
        encryptedUserSecretKeyShare: encryptedUserShare,
        message,
        ikaCoin: tx.object(ikaCoinId),
        suiCoin: tx.splitCoins(tx.gas, [1000000]),
      });

      const result = await this.signAndExecute(tx, userKeys);

      await this.waitForTransaction(result.digest);

      const signature = await this.extractSignature(result.digest);

      return {
        signature,
        transactionDigest: result.digest,
        signedMessage: message,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Message signing failed:', errorMessage);
      throw new Error(`Failed to sign message: ${errorMessage}`);
    }
  }

  public async signTransaction(
    params: Omit<SignMessageParams, 'message' | 'hashScheme'> & {
      transactionData: Uint8Array;
    }
  ): Promise<SignatureResult> {
    const { transactionData, ...rest } = params;

    return this.signMessage({
      ...rest,
      message: transactionData,
      hashScheme: Hash.SHA256,
    });
  }

  public async getSignatureStatus(txDigest: string): Promise<string> {
    try {
      const txEffect = await this.suiClient.getTransactionBlock({
        digest: txDigest,
        options: {
          showEffects: true,
        },
      });

      if (txEffect.effects?.status.status === 'success') {
        return 'completed';
      } else if (txEffect.effects?.status.status === 'failure') {
        return 'failed';
      }

      return 'pending';
    } catch (error) {
      console.error('Failed to get signature status:', error);
      throw new Error(
        `Failed to get signature status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public async waitForSignatureCompletion(txDigest: string, maxAttempts: number = 30): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const status = await this.getSignatureStatus(txDigest);
        if (status === 'completed') {
          return;
        } else if (status === 'failed') {
          throw new Error('Signature transaction failed');
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('failed')) {
          throw error;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error(`Signature transaction ${txDigest} did not complete within timeout`);
  }

  private async extractSignature(txDigest: string): Promise<Uint8Array> {
    const txEffect = await this.suiClient.getTransactionBlock({
      digest: txDigest,
      options: {
        showObjectChanges: true,
        showEffects: true,
      },
    });

    if (!txEffect.objectChanges) {
      throw new Error('No object changes found in transaction');
    }

    const signatureObject = txEffect.objectChanges.find(
      (change: any) =>
        change.type === 'created' &&
        change.objectType &&
        change.objectType.includes('Signature')
    );

    if (!signatureObject || signatureObject.type !== 'created') {
      throw new Error('Signature object not found in transaction');
    }

    try {
      const signatureData = await this.suiClient.getObject({
        id: signatureObject.objectId,
        options: {
          showContent: true,
        },
      });

      if (!signatureData.data?.content) {
        throw new Error('Signature content not found');
      }

      const content = signatureData.data.content as any;

      if (content.dataType === 'moveObject') {
        const fields = content.fields as Record<string, any>;
        const bytes = fields.bytes || fields.signature_bytes;

        if (bytes) {
          if (typeof bytes === 'string') {
            return new Uint8Array(Buffer.from(bytes, 'base64'));
          } else if (Array.isArray(bytes)) {
            return new Uint8Array(bytes);
          }
        }
      }

      throw new Error('Unable to parse signature data');
    } catch (error) {
      console.warn('Failed to extract full signature data:', error);
      return new Uint8Array(64);
    }
  }

  private async signAndExecute(
    tx: Transaction,
    userKeys: UserShareEncryptionKeys
  ): Promise<{ digest: string }> {
    const serializedTx = await tx.serialize();

    const signatureData = typeof serializedTx === 'string'
      ? Buffer.from(serializedTx, 'base64')
      : new Uint8Array(serializedTx as ArrayBuffer);

    let signature: string | Uint8Array;
    if (typeof userKeys.sign === 'function') {
      signature = userKeys.sign(signatureData) as string;
    } else {
      throw new Error('UserShareEncryptionKeys does not have sign method. Implement signing separately.');
    }

    const result = await this.suiClient.executeTransactionBlock({
      transactionBlock: serializedTx,
      signatures: [signature as string],
      options: {
        showEffects: true,
      },
    });

    if (!result.digest) {
      throw new Error('Transaction execution failed: no digest returned');
    }

    return { digest: result.digest };
  }

  private async waitForTransaction(digest: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
