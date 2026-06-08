import { IkaClient, IkaTransaction, SignatureAlgorithm } from '@ika.xyz/sdk';
import { Transaction } from '@mysten/sui/transactions';
import { UserShareEncryptionKeys } from '@ika.xyz/sdk';
import { SuiClient } from '@mysten/sui/client';

export interface CreatePresignParams {
  dWalletId: string;
  userKeys: UserShareEncryptionKeys;
  ikaCoinId: string;
}

export interface PresignResult {
  presignId: string;
  presignCapId: string;
  status: 'pending' | 'completed';
  transactionDigest: string;
}

export interface PresignObject {
  id: { id: string };
  state: { $kind: string };
}

export class PresignService {
  constructor(
    private ikaClient: IkaClient,
    private suiClient: SuiClient
  ) {}

  public async createPresign(
    params: CreatePresignParams
  ): Promise<PresignResult> {
    const { dWalletId, userKeys, ikaCoinId } = params;

    try {
      const dWallet = await this.ikaClient.getDWallet(dWalletId);

      if (dWallet.state.$kind !== 'Active') {
        throw new Error(`dWallet not active: ${dWallet.state.$kind}`);
      }

      const tx = new Transaction();
      const ikaTx = new IkaTransaction({
        ikaClient: this.ikaClient,
        transaction: tx,
        userShareEncryptionKeys: userKeys,
      });

      const unverifiedPresignCap = await ikaTx.requestPresign({
        dWallet,
        signatureAlgorithm: SignatureAlgorithm.ECDSA,
        ikaCoin: tx.object(ikaCoinId),
        suiCoin: tx.splitCoins(tx.gas, [1000000]),
      });

      tx.transferObjects([unverifiedPresignCap], userKeys.getSuiAddress());

      const result = await this.signAndExecute(tx, userKeys);

      await this.waitForTransaction(result.digest);

      const presignId = await this.extractPresignId(result.digest);
      const presignCapId = await this.extractPresignCapId(result.digest);

      return {
        presignId,
        presignCapId,
        status: 'pending',
        transactionDigest: result.digest,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Presign creation failed:', errorMessage);
      throw new Error(`Failed to create presign: ${errorMessage}`);
    }
  }

  public async getPresignStatus(presignId: string): Promise<string> {
    try {
      const presign = await this.ikaClient.getPresign(presignId);
      return presign.state.$kind;
    } catch (error) {
      console.error('Failed to get presign status:', error);
      throw new Error(`Failed to get presign status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async waitForPresignCompletion(presignId: string, maxAttempts: number = 30): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const status = await this.getPresignStatus(presignId);
        if (status === 'Completed') {
          return;
        }
      } catch (error) {
        // Presign might not be indexed yet, continue polling
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error(`Presign ${presignId} did not complete within timeout`);
  }

  private async extractPresignId(txDigest: string): Promise<string> {
    const txEffect = await this.suiClient.getTransactionBlock({
      digest: txDigest,
      options: {
        showObjectChanges: true,
      },
    });

    if (!txEffect.objectChanges) {
      throw new Error('No object changes found in transaction');
    }

    const presignObject = txEffect.objectChanges.find(
      (change: any) =>
        change.type === 'created' &&
        change.objectType &&
        change.objectType.includes('Presign')
    );

    if (!presignObject || presignObject.type !== 'created') {
      throw new Error('Presign object not found in transaction');
    }

    return presignObject.objectId;
  }

  private async extractPresignCapId(txDigest: string): Promise<string> {
    const txEffect = await this.suiClient.getTransactionBlock({
      digest: txDigest,
      options: {
        showObjectChanges: true,
      },
    });

    if (!txEffect.objectChanges) {
      throw new Error('No object changes found in transaction');
    }

    const presignCapObject = txEffect.objectChanges.find(
      (change: any) =>
        change.type === 'created' &&
        change.objectType &&
        change.objectType.includes('PresignCap')
    );

    if (!presignCapObject || presignCapObject.type !== 'created') {
      throw new Error('PresignCap object not found in transaction');
    }

    return presignCapObject.objectId;
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
      signature: signature,
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
