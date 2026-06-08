import { IkaClient, IkaTransaction, Curve, prepareDKGSecondRoundAsync } from '@ika.xyz/sdk';
import { Transaction } from '@mysten/sui/transactions';
import { UserShareEncryptionKeys, IkaClient } from '@ika.xyz/sdk';
import { SuiClient } from '@mysten/sui/client';

export interface DWalletCreationProgress {
  step: 1 | 2 | 3 | 4;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message: string;
  transactionDigest?: string;
  error?: string;
}

export interface CreateDWalletParams {
  userId: string;
  userKeys: UserShareEncryptionKeys;
  ikaCoinId: string;
  onProgress?: (progress: DWalletCreationProgress) => void;
}

export interface DWalletCreationResult {
  dwalletId: string;
  dwalletCapId: string;
  address: string;
  encryptedUserShareId: string;
  publicOutput: Uint8Array;
  securityLevel: 'zero-trust';
}

export class DWalletCreationService {
  constructor(private ikaClient: IkaClient, private suiClient?: SuiClient) {}

  public async createZeroTrustDWallet(
    params: CreateDWalletParams
  ): Promise<DWalletCreationResult> {
    const { userKeys, ikaCoinId, onProgress } = params;

    try {
      const hasRegistered = await this.checkEncryptionKeyRegistered(
        userKeys.getSuiAddress()
      );

      if (!hasRegistered) {
        onProgress?.({
          step: 1,
          status: 'in_progress',
          message: 'Registering encryption key...',
        });

        const tx1 = await this.registerEncryptionKey(userKeys);
        const result1 = await this.signAndExecute(tx1, userKeys);

        onProgress?.({
          step: 1,
          status: 'completed',
          message: 'Encryption key registered',
          transactionDigest: result1.digest,
        });

        await this.waitForTransaction(result1.digest);
      } else {
        onProgress?.({
          step: 1,
          status: 'completed',
          message: 'Encryption key already registered',
        });
      }

      onProgress?.({
        step: 2,
        status: 'in_progress',
        message: 'Starting DKG first round...',
      });

      const { tx: tx2, dwalletCapId, sessionIdentifierPreimage } =
        await this.dkgFirstRound(userKeys, ikaCoinId);

      const result2 = await this.signAndExecute(tx2, userKeys);

      onProgress?.({
        step: 2,
        status: 'completed',
        message: 'DKG first round completed',
        transactionDigest: result2.digest,
      });

      await this.waitForTransaction(result2.digest);
      const dWallet = await this.findDWallet(result2.digest);

      onProgress?.({
        step: 3,
        status: 'in_progress',
        message: 'Completing DKG second round...',
      });

      const { tx: tx3, userPublicOutput } = await this.dkgSecondRound(
        userKeys,
        dWallet,
        sessionIdentifierPreimage,
        dwalletCapId,
        ikaCoinId
      );

      const result3 = await this.signAndExecute(tx3, userKeys);

      onProgress?.({
        step: 3,
        status: 'completed',
        message: 'DKG second round completed',
        transactionDigest: result3.digest,
      });

      await this.waitForTransaction(result3.digest);
      const updatedDWallet = await this.ikaClient.getDWallet(dWallet.id.id);

      onProgress?.({
        step: 4,
        status: 'in_progress',
        message: 'Accepting encrypted user share...',
      });

      const { tx: tx4, encryptedUserShareId } = await this.acceptUserShare(
        userKeys,
        updatedDWallet,
        userPublicOutput
      );

      const result4 = await this.signAndExecute(tx4, userKeys);

      onProgress?.({
        step: 4,
        status: 'completed',
        message: 'dWallet creation completed!',
        transactionDigest: result4.digest,
      });

      await this.waitForTransaction(result4.digest);
      const finalDWallet = await this.ikaClient.getDWallet(dWallet.id.id);

      if (finalDWallet.state.$kind !== 'Active') {
        throw new Error(`dWallet not active: ${finalDWallet.state.$kind}`);
      }

      return {
        dwalletId: finalDWallet.id.id,
        dwalletCapId,
        address: this.deriveDWalletAddress(finalDWallet),
        encryptedUserShareId,
        publicOutput: userPublicOutput,
        securityLevel: 'zero-trust',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('DWallet creation failed:', errorMessage);

      onProgress?.({
        step: 1,
        status: 'failed',
        message: 'Creation failed',
        error: errorMessage,
      });

      throw error;
    }
  }

  private async registerEncryptionKey(
    userKeys: UserShareEncryptionKeys
  ): Promise<Transaction> {
    const tx = new Transaction();
    const ikaTx = new IkaTransaction({
      ikaClient: this.ikaClient,
      transaction: tx,
      userShareEncryptionKeys: userKeys,
    });

    await ikaTx.registerEncryptionKey({
      curve: Curve.SECP256K1,
    });

    return tx;
  }

  private async dkgFirstRound(
    userKeys: UserShareEncryptionKeys,
    ikaCoinId: string
  ) {
    const tx = new Transaction();
    const ikaTx = new IkaTransaction({
      ikaClient: this.ikaClient,
      transaction: tx,
      userShareEncryptionKeys: userKeys,
    });

    const sessionIdentifierPreimage = new Uint8Array(32);
    crypto.getRandomValues(sessionIdentifierPreimage);

    const dwalletCap = await ikaTx.requestDWalletDKGFirstRoundAsync({
      curve: Curve.SECP256K1,
      ikaCoin: tx.object(ikaCoinId),
      suiCoin: tx.splitCoins(tx.gas, [1000000]),
    });

    tx.transferObjects([dwalletCap], userKeys.getSuiAddress());

    return {
      tx,
      dwalletCapId: 'pending',
      sessionIdentifierPreimage,
    };
  }

  private async dkgSecondRound(
    userKeys: UserShareEncryptionKeys,
    dWallet: any,
    sessionIdentifierPreimage: Uint8Array,
    dwalletCapId: string,
    ikaCoinId: string
  ) {
    const dkgSecondRoundInput = await prepareDKGSecondRoundAsync(
      this.ikaClient,
      dWallet,
      sessionIdentifierPreimage,
      userKeys
    );

    const tx = new Transaction();
    const ikaTx = new IkaTransaction({
      ikaClient: this.ikaClient,
      transaction: tx,
      userShareEncryptionKeys: userKeys,
    });

    await ikaTx.requestDWalletDKGSecondRound({
      dWalletCap: dwalletCapId,
      dkgSecondRoundInput,
      ikaCoin: tx.object(ikaCoinId),
      suiCoin: tx.splitCoins(tx.gas, [1000000]),
    });

    return {
      tx,
      userPublicOutput: dkgSecondRoundInput.userPublicOutput,
    };
  }

  private async acceptUserShare(
    userKeys: UserShareEncryptionKeys,
    dWallet: any,
    userPublicOutput: Uint8Array
  ) {
    const tx = new Transaction();
    const ikaTx = new IkaTransaction({
      ikaClient: this.ikaClient,
      transaction: tx,
      userShareEncryptionKeys: userKeys,
    });

    const encryptedUserShareId = 'pending';

    await ikaTx.acceptEncryptedUserShare({
      dWallet,
      userPublicOutput,
      encryptedUserSecretKeyShareId: encryptedUserShareId,
    });

    return {
      tx,
      encryptedUserShareId,
    };
  }

  private async checkEncryptionKeyRegistered(address: string): Promise<boolean> {
    try {
      const encryptionKey = await this.ikaClient.getActiveEncryptionKey(address);
      return encryptionKey !== null;
    } catch (error) {
      return false;
    }
  }

  private async signAndExecute(
    tx: Transaction,
    userKeys: UserShareEncryptionKeys
  ): Promise<{ digest: string }> {
    if (!this.suiClient) {
      throw new Error('SuiClient not initialized for DWalletCreationService');
    }

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

  private async findDWallet(txDigest: string): Promise<any> {
    if (!this.suiClient) {
      throw new Error('SuiClient not initialized for DWalletCreationService');
    }
    const suiClient = this.suiClient;

    const txEffect = await suiClient.getTransactionBlock({
      digest: txDigest,
      options: {
        showObjectChanges: true,
      },
    });

    if (!txEffect.objectChanges) {
      throw new Error('No object changes found in transaction');
    }

    const dWalletObject = txEffect.objectChanges.find(
      (change: any) =>
        change.type === 'created' &&
        change.objectType &&
        change.objectType.includes('DWallet')
    );

    if (!dWalletObject || dWalletObject.type !== 'created') {
      throw new Error('dWallet object not found in transaction');
    }

    return {
      id: { id: dWalletObject.objectId },
    };
  }

  private deriveDWalletAddress(dWallet: any): string {
    const publicKeyBytes = dWallet.publicKey;
    if (!publicKeyBytes) {
      throw new Error('Public key not found in dWallet object');
    }

    const buffer = Buffer.from(publicKeyBytes);
    return '0x' + buffer.toString('hex').slice(0, 40);
  }
}
