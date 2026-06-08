import { useSessionStore, SigningRequest } from './sessionStore';
import type { ChainNamespace } from './ChainAdapter';

export interface SigningQueueConfig {
  maxQueueSize?: number;
  requestTimeout?: number;
  batchSize?: number;
}

export type SigningMethod =
  | 'personal_sign'
  | 'eth_sign'
  | 'eth_signTransaction'
  | 'eth_sendTransaction'
  | 'eth_signTypedData'
  | 'signMessage'
  | 'signTransaction'
  | 'signAllTransactions'
  | 'solana_signTransaction'
  | 'solana_signAndSendTransaction'
  | 'custom';

export interface SigningRequestDetails {
  method: SigningMethod;
  params: any;
  chainId: string;
  sessionId: string;
  peerName: string;
  chainNamespace?: ChainNamespace;
}

export interface SigningResultPayload {
  signature: string;
  publicKey?: string;
  rawTransaction?: string;
  txHash?: string;
  metadata?: Record<string, any>;
}

export class SigningQueue {
  private config: SigningQueueConfig;
  private requestTimers: Map<string, NodeJS.Timer> = new Map();
  private static instance: SigningQueue;

  private constructor(config: SigningQueueConfig = {}) {
    this.config = {
      maxQueueSize: config.maxQueueSize || 50,
      requestTimeout: config.requestTimeout || 300000, // 5 minutes
      batchSize: config.batchSize || 10,
    };
  }

  static getInstance(config?: SigningQueueConfig): SigningQueue {
    if (!SigningQueue.instance) {
      SigningQueue.instance = new SigningQueue(config);
    }
    return SigningQueue.instance;
  }

  static initialize(config?: SigningQueueConfig): SigningQueue {
    SigningQueue.instance = new SigningQueue(config);
    return SigningQueue.instance;
  }

  addRequest(details: SigningRequestDetails): SigningRequest {
    const store = useSessionStore.getState();
    const queue = store.getPendingSigningRequests();

    if (queue.length >= (this.config.maxQueueSize || 50)) {
      throw new Error('Signing queue is full');
    }

    const request: SigningRequest = {
      id: this.generateRequestId(),
      sessionId: details.sessionId,
      method: details.method,
      params: details.params,
      chainId: details.chainId,
      peerName: details.peerName,
      chainNamespace: details.chainNamespace,
      status: 'pending',
      createdAt: Date.now(),
    };

    store.addSigningRequest(request);
    this.setRequestTimeout(request.id);

    return request;
  }

  getPendingRequests(): SigningRequest[] {
    return useSessionStore.getState().getPendingSigningRequests();
  }

  getRequest(id: string): SigningRequest | undefined {
    return useSessionStore.getState().getSigningRequest(id);
  }

  approveRequest(id: string, result: string | SigningResultPayload): boolean {
    const store = useSessionStore.getState();
    const request = store.getSigningRequest(id);

    if (!request) {
      console.error(`Request ${id} not found`);
      return false;
    }

    if (request.status !== 'pending') {
      console.error(`Request ${id} is not pending`);
      return false;
    }

    const payload: SigningResultPayload = typeof result === 'string' ? { signature: result } : result;
    if (!payload.signature) {
      console.error(`Request ${id} approval missing signature`);
      return false;
    }

    this.clearRequestTimeout(id);

    const mergedMetadata = payload.metadata ? { ...(request.metadata || {}), ...payload.metadata } : request.metadata;

    store.updateSigningRequest(id, {
      status: 'signed',
      signature: payload.signature,
      publicKey: payload.publicKey,
      rawTransaction: payload.rawTransaction,
      txHash: payload.txHash,
      metadata: mergedMetadata,
      result: {
        signature: payload.signature,
        publicKey: payload.publicKey,
        rawTransaction: payload.rawTransaction,
        txHash: payload.txHash,
        metadata: mergedMetadata,
      },
      resolvedAt: Date.now(),
      completedAt: Date.now(),
    });

    return true;
  }

  rejectRequest(id: string, error?: string): boolean {
    const store = useSessionStore.getState();
    const request = store.getSigningRequest(id);

    if (!request) {
      console.error(`Request ${id} not found`);
      return false;
    }

    if (request.status !== 'pending') {
      console.error(`Request ${id} is not pending`);
      return false;
    }

    this.clearRequestTimeout(id);
    const timestamp = Date.now();

    store.updateSigningRequest(id, {
      status: 'rejected',
      error: error || 'User rejected request',
      resolvedAt: timestamp,
      completedAt: timestamp,
    });

    return true;
  }

  markBroadcasted(id: string, txHash: string, metadata?: Record<string, any>): boolean {
    const store = useSessionStore.getState();
    const request = store.getSigningRequest(id);

    if (!request) {
      console.error(`Request ${id} not found`);
      return false;
    }

    const mergedMetadata = metadata ? { ...(request.metadata || {}), ...metadata } : request.metadata;

    store.updateSigningRequest(id, {
      status: 'broadcasted',
      txHash,
      metadata: mergedMetadata,
      broadcastedAt: Date.now(),
    });

    return true;
  }

  updateConfirmations(id: string, confirmations: number, status?: SigningRequest['status'], metadata?: Record<string, any>): boolean {
    const store = useSessionStore.getState();
    const request = store.getSigningRequest(id);

    if (!request) {
      console.error(`Request ${id} not found`);
      return false;
    }

    const nextStatus = status || request.status;
    const mergedMetadata = metadata ? { ...(request.metadata || {}), ...metadata } : request.metadata;
    const update: Partial<SigningRequest> = {
      confirmations,
      status: nextStatus,
      metadata: mergedMetadata,
    };

    if (nextStatus === 'confirmed' || nextStatus === 'failed') {
      update.completedAt = Date.now();
    }

    store.updateSigningRequest(id, update);
    return true;
  }

  markFailed(id: string, error: string, metadata?: Record<string, any>): boolean {
    const store = useSessionStore.getState();
    const request = store.getSigningRequest(id);

    if (!request) {
      console.error(`Request ${id} not found`);
      return false;
    }

    const mergedMetadata = metadata ? { ...(request.metadata || {}), ...metadata } : request.metadata;

    store.updateSigningRequest(id, {
      status: 'failed',
      error,
      metadata: mergedMetadata,
      completedAt: Date.now(),
    });

    return true;
  }

  removeRequest(id: string): void {
    this.clearRequestTimeout(id);
    useSessionStore.getState().removeSigningRequest(id);
  }

  getQueueStats() {
    const requests = useSessionStore.getState().getPendingSigningRequests();
    const store = useSessionStore.getState();
    
    const allRequests = Array.from(
      new Map(Array.from((store as any).signingQueue || []).map((r: any) => [r[0], r[1]]))
        .values()
    );

    return {
      pending: requests.length,
      total: allRequests.length,
      approved: allRequests.filter((r: any) => r.status === 'signed').length,
      rejected: allRequests.filter((r: any) => r.status === 'rejected').length,
    };
  }

  clear(): void {
    const requests = useSessionStore.getState().getPendingSigningRequests();
    requests.forEach(req => this.removeRequest(req.id));
  }

  async waitForCompletion(
    id: string,
    options: {
      timeoutMs?: number;
      intervalMs?: number;
      resolveStatuses?: SigningRequest['status'][];
    } = {}
  ): Promise<SigningRequest> {
    const timeoutMs = options.timeoutMs ?? this.config.requestTimeout ?? 300000;
    const intervalMs = options.intervalMs ?? 250;
    const resolveStatuses = options.resolveStatuses ?? ['signed', 'broadcasted', 'confirmed', 'failed', 'rejected'];
    const start = Date.now();

    return new Promise<SigningRequest>((resolve, reject) => {
      const check = () => {
        const request = this.getRequest(id);
        if (!request) {
          clearInterval(timer);
          reject(new Error(`Signing request ${id} not found`));
          return;
        }

        if (resolveStatuses.includes(request.status)) {
          clearInterval(timer);
          resolve(request);
          return;
        }

        if (Date.now() - start > timeoutMs) {
          clearInterval(timer);
          reject(new Error(`Signing request ${id} timed out`));
        }
      };

      const timer = setInterval(check, intervalMs);
      check();
    });
  }

  private setRequestTimeout(requestId: string): void {
    const timeout = setTimeout(() => {
      const store = useSessionStore.getState();
      const request = store.getSigningRequest(requestId);

      if (request && request.status === 'pending') {
        this.rejectRequest(requestId, 'Request timeout');
      }

      this.requestTimers.delete(requestId);
    }, this.config.requestTimeout);

    this.requestTimers.set(requestId, timeout);
  }

  private clearRequestTimeout(requestId: string): void {
    const timeout = this.requestTimers.get(requestId);
    if (timeout) {
      clearTimeout(timeout);
      this.requestTimers.delete(requestId);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  destroy(): void {
    this.requestTimers.forEach(timeout => clearTimeout(timeout));
    this.requestTimers.clear();
    this.clear();
  }
}
