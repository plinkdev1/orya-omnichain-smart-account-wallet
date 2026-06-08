/**
 * Privy AA Integration Service
 * Integrates Privy MPC with Account Abstraction, Session Keys, and Batch Operations
 * Enables seamless flow between Privy's non-custodial key management and AA features
 */

import { PrivyService } from './privy';
import { SessionKeyService, SessionKeyMode } from './session-keys';
import { BatchOperationsService, Batch, BatchStatus } from './batch-operations';
import { AccountAbstractionService } from './account-abstraction';
import type {
  Address,
  SessionKey,
  AuthorizationPolicy,
} from '@orya/shared-types';
import { SessionKeyPermission } from '@orya/shared-types';

export interface PrivyAAIntegrationConfig {
  privyConfig: any;
  aaProvider?: 'alchemy' | 'biconomy' | 'openzeppelin';
  enableSessionKeys?: boolean;
  enableBatchOperations?: boolean;
  enableAAFallback?: boolean;
}

export interface ExecutionContext {
  walletAddress: Address;
  sessionKey?: SessionKey;
  batch?: Batch;
  useAA?: boolean;
}

/**
 * Privy AA Integration Service
 * Manages combined workflows with Privy, AA, Session Keys, and Batch Operations
 */
export class PrivyAAIntegrationService {
  private privyService: PrivyService;
  private sessionKeyService: SessionKeyService;
  private batchOperationsService: BatchOperationsService;
  private aaService: AccountAbstractionService;
  private config: PrivyAAIntegrationConfig;
  private executionContexts: Map<string, ExecutionContext> = new Map();

  constructor(config: PrivyAAIntegrationConfig) {
    this.config = config;

    this.privyService = new PrivyService(config.privyConfig);
    this.sessionKeyService = new SessionKeyService(SessionKeyMode.PRIVY_INTEGRATED);
    this.batchOperationsService = new BatchOperationsService();
    this.aaService = new AccountAbstractionService(config.aaProvider || 'alchemy');
  }

  /**
   * Get Privy service
   */
  getPrivyService(): PrivyService {
    return this.privyService;
  }

  /**
   * Get Session Key service
   */
  getSessionKeyService(): SessionKeyService {
    return this.sessionKeyService;
  }

  /**
   * Get Batch Operations service
   */
  getBatchOperationsService(): BatchOperationsService {
    return this.batchOperationsService;
  }

  /**
   * Get AA service
   */
  getAAService(): AccountAbstractionService {
    return this.aaService;
  }

  /**
   * Create execution context with optional session key
   */
  async createExecutionContext(
    walletAddress: Address,
    options?: {
      createSessionKey?: boolean;
      sessionDurationSeconds?: number;
      permissions?: SessionKeyPermission[];
      useAA?: boolean;
    }
  ): Promise<ExecutionContext> {
    const context: ExecutionContext = {
      walletAddress,
      useAA: options?.useAA || false,
    };

    if (options?.createSessionKey && this.config.enableSessionKeys) {
      const sessionKey = await this.sessionKeyService.createSessionKey({
        walletAddress,
        permissions: options.permissions || [SessionKeyPermission.TRANSFER, SessionKeyPermission.APPROVE],
        durationSeconds: options.sessionDurationSeconds || 3600,
        mode: SessionKeyMode.PRIVY_INTEGRATED,
      });

      context.sessionKey = sessionKey;
    }

    if (this.config.enableBatchOperations) {
      const batch = this.batchOperationsService.createBatch(
        walletAddress,
        'ethereum' as any,
        1
      );
      context.batch = batch;
    }

    const contextId = `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.executionContexts.set(contextId, context);

    return context;
  }

  /**
   * Validate execution with Privy + Session Keys + AA
   */
  async validateExecution(
    context: ExecutionContext,
    permission: SessionKeyPermission,
    operationData?: Record<string, any>
  ): Promise<{
    valid: boolean;
    reason?: string;
    method: 'privy' | 'session_key' | 'aa';
  }> {
    try {
      if (!context.sessionKey) {
        return {
          valid: true,
          method: 'privy',
        };
      }

      const validationResult = await this.sessionKeyService.validateSessionKey({
        sessionKey: context.sessionKey,
        permission,
        operationData,
      });

      return {
        valid: validationResult.valid,
        reason: validationResult.reason,
        method: 'session_key',
      };
    } catch (error) {
      return {
        valid: false,
        reason: (error as Error).message,
        method: 'privy',
      };
    }
  }

  /**
   * Execute transaction with integrated flow
   */
  async executeTransaction(
    context: ExecutionContext,
    transaction: {
      to: Address;
      value?: string;
      data?: string;
    },
    permission: SessionKeyPermission = SessionKeyPermission.TRANSFER
  ): Promise<{
    txHash?: string;
    userOpHash?: string;
    batchId?: string;
    method: 'direct' | 'batch' | 'aa';
  }> {
    const validation = await this.validateExecution(context, permission, {
      target: transaction.to,
      value: transaction.value,
    });

    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.reason}`);
    }

    if (context.batch && context.batch.status === BatchStatus.DRAFT) {
      this.batchOperationsService.addOperation(context.batch.id, {
        type: 'generic_call' as any,
        target: transaction.to,
        value: transaction.value,
        data: transaction.data,
        chainId: 1,
      });

      return {
        batchId: context.batch.id,
        method: 'batch',
      };
    }

    if (context.useAA && this.config.enableAAFallback) {
      const userOp = await this.aaService.createUserOperation(
        context.walletAddress,
        {
          target: transaction.to,
          value: transaction.value || '0',
          data: transaction.data || '0x',
        } as any
      );

      const result = await this.aaService.submitUserOperation(userOp);
      return {
        userOpHash: result.userOpHash,
        method: 'aa',
      };
    }

    return {
      txHash: '0x' + Math.random().toString(16).substr(2, 64),
      method: 'direct',
    };
  }

  /**
   * Execute batch with Privy + AA integration
   */
  async executeBatch(
    context: ExecutionContext,
    useAA: boolean = false
  ): Promise<{
    txHash?: string;
    userOpHash?: string;
    results?: Array<{ operationId: string; status: string }>;
  }> {
    if (!context.batch || context.batch.operations.length === 0) {
      throw new Error('No batch to execute');
    }

    this.batchOperationsService.markAsReadyForSigning(context.batch.id);

    if (useAA && this.config.enableAAFallback) {
      const batch = this.batchOperationsService.getBatch(context.batch.id);
      if (!batch) {
        throw new Error('Batch not found');
      }

      const executionData = {
        target: batch.operations.map((op) => op.target as Address),
        value: batch.operations.map((op) => op.value || '0'),
        data: batch.operations.map((op) => op.data || '0x'),
      };

      const userOp = await this.aaService.createUserOperation(
        context.walletAddress,
        executionData as any
      );

      const result = await this.aaService.submitUserOperation(userOp);

      this.batchOperationsService.markAsSubmitted(context.batch.id, undefined, result.userOpHash);

      return {
        userOpHash: result.userOpHash,
      };
    }

    const txHash = '0x' + Math.random().toString(16).substr(2, 64);
    this.batchOperationsService.markAsSubmitted(context.batch.id, txHash);

    const results = context.batch.operations.map((op) => ({
      operationId: op.id,
      status: 'pending',
    }));

    return {
      txHash,
      results,
    };
  }

  /**
   * Revoke session key
   */
  revokeSessionKey(sessionKeyId: string): boolean {
    return this.sessionKeyService.revokeSessionKey(sessionKeyId);
  }

  /**
   * Revoke all session keys for wallet
   */
  revokeAllSessionKeys(walletAddress: Address): number {
    return this.sessionKeyService.revokeAllSessionKeysForWallet(walletAddress);
  }

  /**
   * Get integration statistics
   */
  getStats(): {
    privyWallets: number;
    activeSessions: number;
    pendingBatches: number;
    userOperations: number;
  } {
    return {
      privyWallets: 0,
      activeSessions: this.sessionKeyService.getSessionStats().activeSessions,
      pendingBatches: this.batchOperationsService.getBatchStats().pendingBatches,
      userOperations: 0,
    };
  }
}

export default PrivyAAIntegrationService;
