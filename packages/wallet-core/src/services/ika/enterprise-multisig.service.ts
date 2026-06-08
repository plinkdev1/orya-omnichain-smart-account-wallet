import { IkaClient } from '@ika.xyz/sdk';
import { SuiClient } from '@mysten/sui/client';
import { UserShareEncryptionKeys } from '@ika.xyz/sdk';

export interface SignerInfo {
  address: string;
  role: 'owner' | 'approver' | 'signer';
  status: 'active' | 'inactive' | 'pending';
  addedAt: Date;
  permissions: string[];
}

export interface MultiSigPolicy {
  requiredSignatures: number;
  totalSigners: number;
  signers: SignerInfo[];
  timelock?: number;
  onlyRoleCanInitiate?: 'owner' | 'approver';
}

export interface MultiSigTransaction {
  id: string;
  dWalletId: string;
  transactionData: Uint8Array;
  signatures: Map<string, Uint8Array>;
  status: 'pending' | 'approved' | 'executed' | 'rejected';
  createdAt: Date;
  initiatedBy: string;
  requiredThreshold: number;
}

export interface ApprovalRequest {
  transactionId: string;
  signerAddress: string;
  approved: boolean;
  signature?: Uint8Array;
  timestamp: Date;
}

export class EnterpriseMultiSigService {
  private multisigPolicies: Map<string, MultiSigPolicy> = new Map();
  private multisigTransactions: Map<string, MultiSigTransaction> = new Map();
  private approvalLog: ApprovalRequest[] = [];

  constructor(
    private ikaClient: IkaClient,
    private suiClient: SuiClient
  ) {}

  public async createMultiSigPolicy(
    dWalletId: string,
    policy: Omit<MultiSigPolicy, 'signers'>,
    signers: Omit<SignerInfo, 'addedAt' | 'status'>[]
  ): Promise<MultiSigPolicy> {
    try {
      console.log(`EnterpriseMultiSigService: Creating ${policy.requiredSignatures}-of-${policy.totalSigners} policy for ${dWalletId}`);

      if (policy.requiredSignatures > policy.totalSigners) {
        throw new Error('Required signatures cannot exceed total signers');
      }

      if (signers.length !== policy.totalSigners) {
        throw new Error(`Expected ${policy.totalSigners} signers, got ${signers.length}`);
      }

      const fullSigners: SignerInfo[] = signers.map((signer) => ({
        ...signer,
        status: 'active',
        addedAt: new Date(),
      }));

      const fullPolicy: MultiSigPolicy = {
        ...policy,
        signers: fullSigners,
      };

      this.multisigPolicies.set(dWalletId, fullPolicy);

      console.log(`EnterpriseMultiSigService: Policy created successfully`);
      console.log(`  Required signatures: ${policy.requiredSignatures}`);
      console.log(`  Total signers: ${policy.totalSigners}`);
      console.log(`  Time lock: ${policy.timelock ? policy.timelock + 'ms' : 'none'}`);

      return fullPolicy;
    } catch (error) {
      throw new Error(`Failed to create multi-sig policy: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async initiateMultiSigTransaction(
    dWalletId: string,
    transactionData: Uint8Array,
    initiatedBy: string
  ): Promise<MultiSigTransaction> {
    try {
      console.log(`EnterpriseMultiSigService: Initiating multi-sig transaction for ${dWalletId}`);

      const policy = this.multisigPolicies.get(dWalletId);
      if (!policy) {
        throw new Error('Multi-sig policy not found for dWallet');
      }

      if (policy.onlyRoleCanInitiate) {
        const initiator = policy.signers.find((s) => s.address === initiatedBy);
        if (!initiator || initiator.role !== policy.onlyRoleCanInitiate) {
          throw new Error(`Only ${policy.onlyRoleCanInitiate}s can initiate transactions`);
        }
      }

      const txId = `multisig_tx_${dWalletId}_${Date.now()}`;

      const transaction: MultiSigTransaction = {
        id: txId,
        dWalletId,
        transactionData,
        signatures: new Map(),
        status: 'pending',
        createdAt: new Date(),
        initiatedBy,
        requiredThreshold: policy.requiredSignatures,
      };

      this.multisigTransactions.set(txId, transaction);

      console.log(`EnterpriseMultiSigService: Transaction initiated: ${txId}`);

      return transaction;
    } catch (error) {
      throw new Error(`Failed to initiate multi-sig transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async addSignature(
    transactionId: string,
    signerAddress: string,
    signature: Uint8Array
  ): Promise<{ approved: boolean; progress: number }> {
    try {
      const transaction = this.multisigTransactions.get(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'pending') {
        throw new Error(`Transaction is already ${transaction.status}`);
      }

      const policy = this.multisigPolicies.get(transaction.dWalletId);
      if (!policy) {
        throw new Error('Policy not found');
      }

      const signer = policy.signers.find((s) => s.address === signerAddress);
      if (!signer) {
        throw new Error(`${signerAddress} is not authorized to sign`);
      }

      if (signer.status !== 'active') {
        throw new Error(`Signer ${signerAddress} is not active`);
      }

      transaction.signatures.set(signerAddress, signature);

      const approvalRequest: ApprovalRequest = {
        transactionId,
        signerAddress,
        approved: true,
        signature,
        timestamp: new Date(),
      };

      this.approvalLog.push(approvalRequest);

      const signatureCount = transaction.signatures.size;
      const progress = Math.floor((signatureCount / transaction.requiredThreshold) * 100);

      console.log(`EnterpriseMultiSigService: Signature added from ${signerAddress}`);
      console.log(`  Progress: ${signatureCount}/${transaction.requiredThreshold} (${progress}%)`);

      if (signatureCount >= transaction.requiredThreshold) {
        transaction.status = 'approved';
        console.log(`EnterpriseMultiSigService: Threshold reached - transaction approved`);
      }

      return {
        approved: signatureCount >= transaction.requiredThreshold,
        progress,
      };
    } catch (error) {
      throw new Error(`Failed to add signature: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async rejectTransaction(
    transactionId: string,
    rejectedBy: string,
    reason?: string
  ): Promise<void> {
    try {
      const transaction = this.multisigTransactions.get(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'pending' && transaction.status !== 'approved') {
        throw new Error(`Cannot reject transaction in ${transaction.status} state`);
      }

      transaction.status = 'rejected';

      const approvalRequest: ApprovalRequest = {
        transactionId,
        signerAddress: rejectedBy,
        approved: false,
        timestamp: new Date(),
      };

      this.approvalLog.push(approvalRequest);

      console.log(`EnterpriseMultiSigService: Transaction rejected by ${rejectedBy}`);
      if (reason) {
        console.log(`  Reason: ${reason}`);
      }
    } catch (error) {
      throw new Error(`Failed to reject transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async executeMultiSigTransaction(transactionId: string): Promise<string> {
    try {
      const transaction = this.multisigTransactions.get(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'approved') {
        throw new Error(`Cannot execute transaction in ${transaction.status} state. Must be approved.`);
      }

      const policy = this.multisigPolicies.get(transaction.dWalletId);
      if (!policy) {
        throw new Error('Policy not found');
      }

      if (transaction.signatures.size < transaction.requiredThreshold) {
        throw new Error(
          `Not enough signatures. Have ${transaction.signatures.size}, need ${transaction.requiredThreshold}`
        );
      }

      if (policy.timelock) {
        const elapsedTime = Date.now() - transaction.createdAt.getTime();
        if (elapsedTime < policy.timelock) {
          throw new Error(`Timelock not expired. Wait ${policy.timelock - elapsedTime}ms`);
        }
      }

      console.log(`EnterpriseMultiSigService: Executing multi-sig transaction`);

      const signatures = Array.from(transaction.signatures.values());
      const combinedSignature = this.combineSignatures(signatures);

      const suiClient = this.ikaClient.getSuiClient();
      const result = await suiClient.executeTransactionBlock({
        transactionBlock: Buffer.from(transaction.transactionData).toString('base64'),
        signature: Buffer.from(combinedSignature).toString('base64'),
        options: {
          showEffects: true,
        },
      });

      transaction.status = 'executed';

      console.log(`EnterpriseMultiSigService: Transaction executed successfully`);
      console.log(`  Transaction digest: ${result.digest}`);

      return result.digest;
    } catch (error) {
      throw new Error(`Failed to execute multi-sig transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async addSigner(
    dWalletId: string,
    signerAddress: string,
    role: 'owner' | 'approver' | 'signer',
    permissions: string[] = []
  ): Promise<void> {
    try {
      const policy = this.multisigPolicies.get(dWalletId);
      if (!policy) {
        throw new Error('Policy not found');
      }

      if (policy.signers.some((s) => s.address === signerAddress)) {
        throw new Error(`${signerAddress} is already a signer`);
      }

      const newSigner: SignerInfo = {
        address: signerAddress,
        role,
        status: 'active',
        addedAt: new Date(),
        permissions,
      };

      policy.signers.push(newSigner);
      policy.totalSigners++;

      console.log(`EnterpriseMultiSigService: Signer added`);
      console.log(`  Address: ${signerAddress}`);
      console.log(`  Role: ${role}`);
    } catch (error) {
      throw new Error(`Failed to add signer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async removeSigner(dWalletId: string, signerAddress: string): Promise<void> {
    try {
      const policy = this.multisigPolicies.get(dWalletId);
      if (!policy) {
        throw new Error('Policy not found');
      }

      const signerIndex = policy.signers.findIndex((s) => s.address === signerAddress);
      if (signerIndex === -1) {
        throw new Error(`${signerAddress} is not a signer`);
      }

      const activeSigners = policy.signers.filter((s) => s.status === 'active').length;
      if (activeSigners - 1 < policy.requiredSignatures) {
        throw new Error(`Cannot remove signer. Would fall below required signature threshold.`);
      }

      policy.signers.splice(signerIndex, 1);
      policy.totalSigners--;

      console.log(`EnterpriseMultiSigService: Signer removed: ${signerAddress}`);
    } catch (error) {
      throw new Error(`Failed to remove signer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public getMultiSigPolicy(dWalletId: string): MultiSigPolicy | undefined {
    return this.multisigPolicies.get(dWalletId);
  }

  public getTransaction(transactionId: string): MultiSigTransaction | undefined {
    return this.multisigTransactions.get(transactionId);
  }

  public getApprovalLog(): ApprovalRequest[] {
    return [...this.approvalLog];
  }

  public getPendingTransactions(dWalletId: string): MultiSigTransaction[] {
    return Array.from(this.multisigTransactions.values()).filter(
      (tx) => tx.dWalletId === dWalletId && tx.status === 'pending'
    );
  }

  private combineSignatures(signatures: Uint8Array[]): Uint8Array {
    if (signatures.length === 0) {
      throw new Error('No signatures to combine');
    }

    const combined = new Uint8Array(signatures[0].length);
    for (const sig of signatures) {
      for (let i = 0; i < sig.length; i++) {
        combined[i] ^= sig[i];
      }
    }

    return combined;
  }
}

export const createEnterpriseMultiSigService = (ikaClient: IkaClient, suiClient: SuiClient): EnterpriseMultiSigService => {
  return new EnterpriseMultiSigService(ikaClient, suiClient);
};
