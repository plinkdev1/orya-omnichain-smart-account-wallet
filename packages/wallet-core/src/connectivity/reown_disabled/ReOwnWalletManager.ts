import { ReOwnConfigManager, ReOwnProjectConfig } from './ReOwnConfig';
import { SessionManager, SessionConfig } from './SessionManager';
import { SigningQueue, SigningQueueConfig, SigningMethod, SigningRequestDetails, SigningResultPayload } from './SigningQueue';
import { ChainAdapter } from './ChainAdapter';
import { Analytics } from './Analytics';
import { useSessionStore, WalletSession, SigningRequest } from './sessionStore';
import { AppKitNetwork } from '@reown/appkit';

export type ReOwnWalletManagerEventType =
  | 'session_created'
  | 'session_approved'
  | 'session_rejected'
  | 'signing_request'
  | 'signing_approved'
  | 'signing_rejected'
  | 'error';

export interface ReOwnManagerConfig {
  reown: ReOwnProjectConfig;
  session?: SessionConfig;
  signingQueue?: SigningQueueConfig;
  enableAutoCleanup?: boolean;
}

export class ReOwnWalletManager {
  private configManager: ReOwnConfigManager;
  private sessionManager: SessionManager;
  private signingQueue: SigningQueue;
  private chainAdapter: ChainAdapter;
  private analytics: Analytics;

  private eventListeners: Map<ReOwnWalletManagerEventType, ((data: any) => void)[]> = new Map();
  private static instance: ReOwnWalletManager;

  private constructor(config: ReOwnManagerConfig) {
    this.configManager = ReOwnConfigManager.initialize(config.reown);
    this.chainAdapter = ChainAdapter.initialize();
    this.analytics = Analytics.initialize();
    this.sessionManager = SessionManager.initialize(this.configManager, config.session);
    this.signingQueue = SigningQueue.initialize(config.signingQueue);
  }

  static getInstance(config?: ReOwnManagerConfig): ReOwnWalletManager {
    if (!ReOwnWalletManager.instance) {
      if (!config) {
        throw new Error('ReOwnWalletManager must be initialized with config on first call');
      }
      ReOwnWalletManager.instance = new ReOwnWalletManager(config);
    }
    return ReOwnWalletManager.instance;
  }

  static initialize(config: ReOwnManagerConfig): ReOwnWalletManager {
    ReOwnWalletManager.instance = new ReOwnWalletManager(config);
    return ReOwnWalletManager.instance;
  }

  validateConfiguration(): boolean {
    const isValid = this.configManager.validateConfiguration();
    if (!isValid) {
      this.emit('error', {
        message: 'Invalid ReOwn configuration',
        timestamp: Date.now(),
      });
    }
    return isValid;
  }

  registerChains(networks: AppKitNetwork[]): void {
    networks.forEach(network => {
      this.chainAdapter.registerFromAppKitNetwork(network);
    });
  }

  async createSessionRequest(
    topic: string,
    peerMetadata: WalletSession['peerMetadata'],
    chainId: string,
    chainNamespace: WalletSession['chainNamespace'],
    accounts: string[]
  ): Promise<WalletSession> {
    try {
      const session = this.sessionManager.createSession(
        topic,
        peerMetadata,
        chainId,
        chainNamespace,
        accounts
      );

      this.sessionManager.requestApproval(session.id);

      this.analytics.trackSessionEvent(
        'session_created',
        session.id,
        chainId,
        'success',
        {
          peerName: peerMetadata.name,
          accountCount: accounts.length,
        }
      );

      this.emit('session_created', session);
      return session;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.analytics.trackEvent('error_occurred', 'error', { context: 'createSessionRequest', error: errorMessage });
      this.emit('error', { message: errorMessage, timestamp: Date.now() });
      throw error;
    }
  }

  approveSession(sessionId: string): boolean {
    try {
      const success = this.sessionManager.approveSession(sessionId);
      if (success) {
        const session = this.sessionManager.getSession(sessionId);
        if (session) {
          this.analytics.trackSessionEvent('session_approved', sessionId, session.chainId, 'success');
          this.emit('session_approved', session);
        }
      }
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.analytics.trackEvent('error_occurred', 'error', { context: 'approveSession', error: errorMessage });
      this.emit('error', { message: errorMessage, timestamp: Date.now() });
      return false;
    }
  }

  rejectSession(sessionId: string): boolean {
    try {
      const success = this.sessionManager.rejectSession(sessionId);
      if (success) {
        this.analytics.trackEvent('session_rejected', 'success', { sessionId });
        this.emit('session_rejected', { sessionId });
      }
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.analytics.trackEvent('error_occurred', 'error', { context: 'rejectSession', error: errorMessage });
      this.emit('error', { message: errorMessage, timestamp: Date.now() });
      return false;
    }
  }

  async createSigningRequest(
    sessionId: string,
    method: SigningMethod,
    params: any,
    chainId: string
  ): Promise<SigningRequest> {
    try {
      const session = this.sessionManager.getSession(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (!this.chainAdapter.canSignRequest(chainId, method)) {
        throw new Error(`Method ${method} not supported for chain ${chainId}`);
      }

      const request = this.signingQueue.addRequest({
        method,
        params,
        chainId,
        sessionId,
        peerName: session.peerName,
        chainNamespace: session.chainNamespace,
      });

      this.analytics.trackSigningRequest(
        'signing_request_created',
        sessionId,
        chainId,
        method,
        'pending',
        { requestId: request.id }
      );

      this.emit('signing_request', request);
      return request;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.analytics.trackEvent('error_occurred', 'error', { context: 'createSigningRequest', error: errorMessage });
      this.emit('error', { message: errorMessage, timestamp: Date.now() });
      throw error;
    }
  }

  approveSigningRequest(requestId: string, result: string | SigningResultPayload): boolean {
    try {
      const signatureValue = typeof result === 'string' ? result : result.signature;
      if (!signatureValue) {
        throw new Error('Missing signature payload for signing request approval');
      }

      const success = this.signingQueue.approveRequest(requestId, result);
      if (success) {
        const request = this.signingQueue.getRequest(requestId);
        if (request) {
          this.analytics.trackSigningRequest(
            'signing_request_approved',
            request.sessionId,
            request.chainId,
            request.method,
            'success',
            { requestId, txHash: request.txHash }
          );
          this.emit('signing_approved', request);
        }
      }
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.analytics.trackEvent('error_occurred', 'error', { context: 'approveSigningRequest', error: errorMessage });
      this.emit('error', { message: errorMessage, timestamp: Date.now() });
      return false;
    }
  }

  rejectSigningRequest(requestId: string, reason?: string): boolean {
    try {
      const success = this.signingQueue.rejectRequest(requestId, reason);
      if (success) {
        const request = this.signingQueue.getRequest(requestId);
        if (request) {
          this.analytics.trackSigningRequest(
            'signing_request_rejected',
            request.sessionId,
            request.chainId,
            request.method,
            'error',
            { requestId },
            reason
          );
          this.emit('signing_rejected', request);
        }
      }
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.analytics.trackEvent('error_occurred', 'error', { context: 'rejectSigningRequest', error: errorMessage });
      this.emit('error', { message: errorMessage, timestamp: Date.now() });
      return false;
    }
  }

  getPendingApprovals(): WalletSession[] {
    return this.sessionManager.getPendingApprovals();
  }

  getPendingSigningRequests(): SigningRequest[] {
    return this.signingQueue.getPendingRequests();
  }

  getSession(sessionId: string): WalletSession | undefined {
    return this.sessionManager.getSession(sessionId);
  }

  getAllSessions(): WalletSession[] {
    return this.sessionManager.getAllSessions();
  }

  getActiveSessions(): WalletSession[] {
    return this.sessionManager.getActiveSessions();
  }

  getSigningRequest(requestId: string): SigningRequest | undefined {
    return this.signingQueue.getRequest(requestId);
  }

  switchToSession(sessionId: string): boolean {
    return this.sessionManager.switchToSession(sessionId);
  }

  on(eventType: ReOwnWalletManagerEventType, listener: (data: any) => void): () => void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.push(listener);
    this.eventListeners.set(eventType, listeners);

    return () => {
      const idx = listeners.indexOf(listener);
      if (idx > -1) {
        listeners.splice(idx, 1);
      }
    };
  }

  off(eventType: ReOwnWalletManagerEventType, listener: (data: any) => void): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const idx = listeners.indexOf(listener);
    if (idx > -1) {
      listeners.splice(idx, 1);
    }
  }

  private emit(eventType: ReOwnWalletManagerEventType, data: any): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${eventType}:`, error);
      }
    });
  }

  getAnalytics() {
    return this.analytics;
  }

  getSessionManager() {
    return this.sessionManager;
  }

  getSigningQueue() {
    return this.signingQueue;
  }

  getChainAdapter() {
    return this.chainAdapter;
  }

  getConfigManager() {
    return this.configManager;
  }

  destroy(): void {
    this.sessionManager.reset();
    this.signingQueue.destroy();
    this.analytics.destroy();
    this.chainAdapter.clear();
    this.eventListeners.clear();
    ReOwnWalletManager.instance = undefined as any;
  }
}

export function getReOwnWalletManager(config?: ReOwnManagerConfig): ReOwnWalletManager {
  return ReOwnWalletManager.getInstance(config);
}
