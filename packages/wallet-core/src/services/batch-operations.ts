/**
 * Batch Operations Service
 * Handles batching of multiple transactions or operations
 * Supports both traditional batching and UserOperation bundling (ERC-4337)
 */

import type { ChainType, UUID } from '@orya/shared-types';

export enum BatchOperationType {
  TRANSFER = 'transfer',
  SWAP = 'swap',
  STAKE = 'stake',
  BRIDGE = 'bridge',
  APPROVE = 'approve',
  CLAIM_REWARDS = 'claim_rewards',
  GENERIC_CALL = 'generic_call',
}

export enum BatchStatus {
  DRAFT = 'draft',
  READY = 'ready',
  PENDING_SIGNATURE = 'pending_signature',
  SIGNED = 'signed',
  SUBMITTED = 'submitted',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface BatchOperation {
  id: string;
  type: BatchOperationType;
  target: string;
  value?: string;
  data?: string;
  chainId: number;
  gasLimit?: string;
  metadata?: Record<string, any>;
}

export interface BatchOperationResult {
  operationId: string;
  status: 'success' | 'failed' | 'pending';
  hash?: string;
  gasUsed?: string;
  error?: string;
  blockNumber?: number;
  timestamp?: string;
}

export interface Batch {
  id: UUID;
  walletAddress: string;
  chainType: ChainType;
  chainId: number;
  operations: BatchOperation[];
  status: BatchStatus;
  totalGasEstimate?: string;
  totalGasUsed?: string;
  totalCostUsd?: number;
  results?: BatchOperationResult[];
  signature?: string;
  transactionHash?: string;
  userOpHash?: string;
  createdAt: string;
  submittedAt?: string;
  confirmedAt?: string;
  failedAt?: string;
  metadata?: Record<string, any>;
}

export interface BatchExecutionOptions {
  atomic?: boolean;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  paymaster?: string;
  timeout?: number;
}

/**
 * Batch Operations Service
 * Creates, manages, and executes batches of operations
 */
export class BatchOperationsService {
  private batches: Map<string, Batch> = new Map();
  private maxOperationsPerBatch: number = 20;
  private operationIdCounter: number = 0;

  /**
   * Create a new batch
   */
  createBatch(walletAddress: string, chainType: ChainType, chainId: number): Batch {
    const batch: Batch = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as UUID,
      walletAddress,
      chainType,
      chainId,
      operations: [],
      status: BatchStatus.DRAFT,
      createdAt: new Date().toISOString(),
    };

    this.batches.set(batch.id, batch);
    return batch;
  }

  /**
   * Add operation to batch
   */
  addOperation(
    batchId: UUID,
    operation: Omit<BatchOperation, 'id'>
  ): BatchOperation {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    if (batch.status !== BatchStatus.DRAFT && batch.status !== BatchStatus.READY) {
      throw new Error(`Cannot add operation to batch with status ${batch.status}`);
    }

    if (batch.operations.length >= this.maxOperationsPerBatch) {
      throw new Error(`Batch has reached maximum operations (${this.maxOperationsPerBatch})`);
    }

    const op: BatchOperation = {
      id: `op_${++this.operationIdCounter}`,
      ...operation,
    };

    batch.operations.push(op);
    batch.status = BatchStatus.READY;

    return op;
  }

  /**
   * Add multiple operations to batch
   */
  addOperations(
    batchId: UUID,
    operations: Omit<BatchOperation, 'id'>[]
  ): BatchOperation[] {
    return operations.map((op) => this.addOperation(batchId, op));
  }

  /**
   * Remove operation from batch
   */
  removeOperation(batchId: UUID, operationId: string): boolean {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    const index = batch.operations.findIndex((op) => op.id === operationId);
    if (index === -1) {
      return false;
    }

    batch.operations.splice(index, 1);
    return true;
  }

  /**
   * Get batch by ID
   */
  getBatch(batchId: UUID): Batch | undefined {
    return this.batches.get(batchId);
  }

  /**
   * Get all batches for a wallet
   */
  getBatchesForWallet(walletAddress: string): Batch[] {
    return Array.from(this.batches.values()).filter(
      (batch) => batch.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
  }

  /**
   * Get pending batches
   */
  getPendingBatches(): Batch[] {
    return Array.from(this.batches.values()).filter(
      (batch) => batch.status === BatchStatus.PENDING_SIGNATURE || batch.status === BatchStatus.SUBMITTED
    );
  }

  /**
   * Estimate gas for batch
   */
  async estimateBatchGas(batchId: UUID): Promise<string> {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    if (batch.operations.length === 0) {
      throw new Error('Batch has no operations');
    }

    let totalGas = '0';

    for (const operation of batch.operations) {
      const opGas = operation.gasLimit || '100000';
      totalGas = (BigInt(totalGas) + BigInt(opGas)).toString();
    }

    const gasBuffer = BigInt(totalGas) * BigInt(10) / BigInt(100);
    const estimatedGas = (BigInt(totalGas) + gasBuffer).toString();

    batch.totalGasEstimate = estimatedGas;
    return estimatedGas;
  }

  /**
   * Mark batch as ready for signing
   */
  markAsReadyForSigning(batchId: UUID): void {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    if (batch.operations.length === 0) {
      throw new Error('Batch has no operations');
    }

    batch.status = BatchStatus.PENDING_SIGNATURE;
  }

  /**
   * Mark batch as signed
   */
  markAsSigned(batchId: UUID, signature: string): void {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    batch.signature = signature;
    batch.status = BatchStatus.SIGNED;
  }

  /**
   * Mark batch as submitted
   */
  markAsSubmitted(batchId: UUID, transactionHash?: string, userOpHash?: string): void {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    batch.status = BatchStatus.SUBMITTED;
    batch.submittedAt = new Date().toISOString();
    if (transactionHash) {
      batch.transactionHash = transactionHash;
    }
    if (userOpHash) {
      batch.userOpHash = userOpHash;
    }
  }

  /**
   * Mark batch as confirmed with results
   */
  markAsConfirmed(batchId: UUID, results: BatchOperationResult[]): void {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    batch.status = BatchStatus.CONFIRMED;
    batch.confirmedAt = new Date().toISOString();
    batch.results = results;

    const failedResults = results.filter((r) => r.status === 'failed');
    if (failedResults.length > 0) {
      batch.status = BatchStatus.FAILED;
      batch.failedAt = new Date().toISOString();
    }
  }

  /**
   * Cancel batch
   */
  cancelBatch(batchId: UUID): void {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    if (batch.status === BatchStatus.CONFIRMED) {
      throw new Error('Cannot cancel confirmed batch');
    }

    batch.status = BatchStatus.CANCELLED;
  }

  /**
   * Clear batch (remove from storage)
   */
  clearBatch(batchId: UUID): void {
    this.batches.delete(batchId);
  }

  /**
   * Get batch statistics
   */
  getBatchStats(): {
    totalBatches: number;
    draftBatches: number;
    pendingBatches: number;
    confirmedBatches: number;
    failedBatches: number;
  } {
    const batches = Array.from(this.batches.values());
    return {
      totalBatches: batches.length,
      draftBatches: batches.filter((b) => b.status === BatchStatus.DRAFT).length,
      pendingBatches: batches.filter(
        (b) => b.status === BatchStatus.PENDING_SIGNATURE || b.status === BatchStatus.SUBMITTED
      ).length,
      confirmedBatches: batches.filter((b) => b.status === BatchStatus.CONFIRMED).length,
      failedBatches: batches.filter((b) => b.status === BatchStatus.FAILED).length,
    };
  }
}

export default BatchOperationsService;
