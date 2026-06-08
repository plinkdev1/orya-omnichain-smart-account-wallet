/**
 * Batch Operations Service Tests
 */

import { BatchOperationsService, BatchStatus, BatchOperationType } from '../services/batch-operations';
import type { UUID } from '@orya/shared-types';

describe('BatchOperationsService', () => {
  let service: BatchOperationsService;
  const testWallet = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    service = new BatchOperationsService();
  });

  describe('Batch Creation', () => {
    it('should create a batch', () => {
      const batch = service.createBatch(testWallet, 'ethereum' as any, 1);

      expect(batch).toBeDefined();
      expect(batch.walletAddress).toBe(testWallet);
      expect(batch.status).toBe(BatchStatus.DRAFT);
      expect(batch.operations).toHaveLength(0);
    });

    it('should assign unique IDs to batches', () => {
      const batch1 = service.createBatch(testWallet, 'ethereum' as any, 1);
      const batch2 = service.createBatch(testWallet, 'ethereum' as any, 1);

      expect(batch1.id).not.toBe(batch2.id);
    });
  });

  describe('Operation Management', () => {
    it('should add operation to batch', () => {
      const batch = service.createBatch(testWallet, 'ethereum' as any, 1);

      const op = service.addOperation(batch.id, {
        type: BatchOperationType.TRANSFER,
        target: '0x0987654321098765432109876543210987654321',
        value: '1000000000000000000',
        chainId: 1,
      });

      expect(op).toBeDefined();
      expect(op.id).toBeDefined();
      expect(op.type).toBe(BatchOperationType.TRANSFER);
    });

    it('should add multiple operations', () => {
      const batch = service.createBatch(testWallet, 'ethereum' as any, 1);

      const ops = service.addOperations(batch.id, [
        {
          type: BatchOperationType.TRANSFER,
          target: '0x1111111111111111111111111111111111111111',
          value: '1000000000000000000',
          chainId: 1,
        },
        {
          type: BatchOperationType.APPROVE,
          target: '0x2222222222222222222222222222222222222222',
          data: '0x095ea7b3',
          chainId: 1,
        },
      ]);

      expect(ops).toHaveLength(2);
    });

    it('should remove operation from batch', () => {
      const batch = service.createBatch(testWallet, 'ethereum' as any, 1);

      const op = service.addOperation(batch.id, {
        type: BatchOperationType.TRANSFER,
        target: '0x0987654321098765432109876543210987654321',
        chainId: 1,
      });

      const removed = service.removeOperation(batch.id, op.id);
      expect(removed).toBe(true);
    });

    it('should not remove non-existent operation', () => {
      const batch = service.createBatch(testWallet, 'ethereum' as any, 1);
      const removed = service.removeOperation(batch.id, 'non_existent_id');

      expect(removed).toBe(false);
    });
  });

  describe('Batch Status Management', () => {
    it('should transition batch to ready for signing', () => {
      const batch = service.createBatch(testWallet, 'ethereum' as any, 1);

      service.addOperation(batch.id, {
        type: BatchOperationType.TRANSFER,
        target: '0x0987654321098765432109876543210987654321',
        chainId: 1,
      });

      service.markAsReadyForSigning(batch.id);
      const updated = service.getBatch(batch.id);

      expect(updated?.status).toBe(BatchStatus.PENDING_SIGNATURE);
    });

    it('should mark batch as signed', () => {
      const batch = service.createBatch(testWallet, 'ethereum' as any, 1);

      service.addOperation(batch.id, {
        type: BatchOperationType.TRANSFER,
        target: '0x0987654321098765432109876543210987654321',
        chainId: 1,
      });

      service.markAsReadyForSigning(batch.id);
      service.markAsSigned(batch.id, '0xsignature');

      const updated = service.getBatch(batch.id);
      expect(updated?.status).toBe(BatchStatus.SIGNED);
      expect(updated?.signature).toBe('0xsignature');
    });

    it('should mark batch as submitted', () => {
      const batch = service.createBatch(testWallet, 'ethereum' as any, 1);

      service.addOperation(batch.id, {
        type: BatchOperationType.TRANSFER,
        target: '0x0987654321098765432109876543210987654321',
        chainId: 1,
      });

      service.markAsReadyForSigning(batch.id);
      service.markAsSigned(batch.id, '0xsignature');
      service.markAsSubmitted(batch.id, '0xtxhash');

      const updated = service.getBatch(batch.id);
      expect(updated?.status).toBe(BatchStatus.SUBMITTED);
      expect(updated?.transactionHash).toBe('0xtxhash');
    });

    it('should cancel batch', () => {
      const batch = service.createBatch(testWallet, 'ethereum' as any, 1);

      service.addOperation(batch.id, {
        type: BatchOperationType.TRANSFER,
        target: '0x0987654321098765432109876543210987654321',
        chainId: 1,
      });

      service.cancelBatch(batch.id);
      const updated = service.getBatch(batch.id);

      expect(updated?.status).toBe(BatchStatus.CANCELLED);
    });
  });

  describe('Gas Estimation', () => {
    it('should estimate batch gas', async () => {
      const batch = service.createBatch(testWallet, 'ethereum' as any, 1);

      service.addOperation(batch.id, {
        type: BatchOperationType.TRANSFER,
        target: '0x0987654321098765432109876543210987654321',
        gasLimit: '100000',
        chainId: 1,
      });

      const gasEstimate = await service.estimateBatchGas(batch.id);
      expect(gasEstimate).toBeDefined();
      expect(BigInt(gasEstimate) > BigInt(0)).toBe(true);
    });

    it('should throw when estimating gas for empty batch', async () => {
      const batch = service.createBatch(testWallet, 'ethereum' as any, 1);

      await expect(service.estimateBatchGas(batch.id)).rejects.toThrow();
    });
  });

  describe('Batch Queries', () => {
    it('should get batch by ID', () => {
      const batch = service.createBatch(testWallet, 'ethereum' as any, 1);
      const retrieved = service.getBatch(batch.id);

      expect(retrieved).toEqual(batch);
    });

    it('should get batches for wallet', () => {
      service.createBatch(testWallet, 'ethereum' as any, 1);
      service.createBatch(testWallet, 'ethereum' as any, 1);

      const batches = service.getBatchesForWallet(testWallet);
      expect(batches).toHaveLength(2);
    });

    it('should get pending batches', () => {
      const batch1 = service.createBatch(testWallet, 'ethereum' as any, 1);
      const batch2 = service.createBatch('0xother', 'ethereum' as any, 1);

      service.addOperation(batch1.id, {
        type: BatchOperationType.TRANSFER,
        target: '0x0987654321098765432109876543210987654321',
        chainId: 1,
      });

      service.markAsReadyForSigning(batch1.id);
      service.markAsSubmitted(batch1.id);

      const pending = service.getPendingBatches();
      expect(pending.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics', () => {
    it('should provide batch statistics', () => {
      service.createBatch(testWallet, 'ethereum' as any, 1);
      service.createBatch(testWallet, 'ethereum' as any, 1);

      const stats = service.getBatchStats();
      expect(stats.totalBatches).toBe(2);
      expect(stats.draftBatches).toBe(2);
    });
  });
});
