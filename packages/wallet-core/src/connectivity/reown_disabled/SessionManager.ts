import { useSessionStore, WalletSession, SigningRequest } from './sessionStore';
import { ReOwnConfigManager } from './ReOwnConfig';

export interface SessionConfig {
  ttl?: number;
  maxSessions?: number;
  autoCleanup?: boolean;
  cleanupInterval?: number;
}

export class SessionManager {
  private config: SessionConfig;
  private cleanupTimer?: NodeJS.Timer;
  private configManager: ReOwnConfigManager;

  private static instance: SessionManager;

  private constructor(configManager: ReOwnConfigManager, config: SessionConfig = {}) {
    this.configManager = configManager;
    this.config = {
      ttl: config.ttl || 86400000, // 24 hours
      maxSessions: config.maxSessions || 10,
      autoCleanup: config.autoCleanup !== false,
      cleanupInterval: config.cleanupInterval || 3600000, // 1 hour
    };

    if (this.config.autoCleanup) {
      this.startAutoCleanup();
    }
  }

  static getInstance(configManager: ReOwnConfigManager, config?: SessionConfig): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager(configManager, config);
    }
    return SessionManager.instance;
  }

  static initialize(configManager: ReOwnConfigManager, config?: SessionConfig): SessionManager {
    SessionManager.instance = new SessionManager(configManager, config);
    return SessionManager.instance;
  }

  private startAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  createSession(
    topic: string,
    peerMetadata: WalletSession['peerMetadata'],
    chainId: string,
    chainNamespace: WalletSession['chainNamespace'],
    accounts: string[]
  ): WalletSession {
    const store = useSessionStore.getState();
    const sessions = store.getAllSessions();

    if (sessions.length >= (this.config.maxSessions || 10)) {
      const oldestInactive = sessions
        .filter(s => !s.isActive)
        .sort((a, b) => a.createdAt - b.createdAt)[0];

      if (oldestInactive) {
        this.removeSession(oldestInactive.id);
      }
    }

    const session: WalletSession = {
      id: this.generateSessionId(),
      topic,
      peerName: peerMetadata.name,
      peerMetadata,
      chainId,
      chainNamespace,
      accounts,
      isApproved: false,
      createdAt: Date.now(),
      expiresAt: Date.now() + (this.config.ttl || 86400000),
      isActive: false,
    };

    store.addSession(session);
    return session;
  }

  approveSession(sessionId: string): boolean {
    const store = useSessionStore.getState();
    const session = store.getSession(sessionId);

    if (!session) {
      console.error(`Session ${sessionId} not found`);
      return false;
    }

    if (new Date().getTime() > (session.expiresAt || 0)) {
      this.removeSession(sessionId);
      console.error(`Session ${sessionId} has expired`);
      return false;
    }

    store.updateSession(sessionId, {
      isApproved: true,
      isActive: true,
    });

    store.removePendingApproval(sessionId);
    return true;
  }

  rejectSession(sessionId: string): boolean {
    const store = useSessionStore.getState();
    const session = store.getSession(sessionId);

    if (!session) {
      console.error(`Session ${sessionId} not found`);
      return false;
    }

    this.removeSession(sessionId);
    return true;
  }

  removeSession(sessionId: string): void {
    const store = useSessionStore.getState();
    store.removeSession(sessionId);
  }

  getSession(sessionId: string): WalletSession | undefined {
    return useSessionStore.getState().getSession(sessionId);
  }

  getAllSessions(): WalletSession[] {
    return useSessionStore.getState().getAllSessions();
  }

  getActiveSessions(): WalletSession[] {
    return this.getAllSessions().filter(s => s.isActive && s.isApproved);
  }

  getPendingApprovals(): WalletSession[] {
    const store = useSessionStore.getState();
    const pendingIds = store.getPendingApprovals();
    return pendingIds
      .map(id => store.getSession(id))
      .filter((s): s is WalletSession => s !== undefined);
  }

  switchToSession(sessionId: string): boolean {
    const store = useSessionStore.getState();
    const session = store.getSession(sessionId);

    if (!session || !session.isApproved) {
      console.error(`Cannot switch to session ${sessionId}: not found or not approved`);
      return false;
    }

    store.setActiveSession(sessionId);
    return true;
  }

  requestApproval(sessionId: string): void {
    const store = useSessionStore.getState();
    const session = store.getSession(sessionId);

    if (!session) {
      console.error(`Session ${sessionId} not found`);
      return;
    }

    store.addPendingApproval(sessionId);
  }

  clearExpiredSessions(): void {
    const store = useSessionStore.getState();
    const now = Date.now();
    const sessions = store.getAllSessions();

    sessions.forEach(session => {
      if (session.expiresAt && now > session.expiresAt) {
        this.removeSession(session.id);
      }
    });
  }

  cleanup(): void {
    this.clearExpiredSessions();
  }

  reset(): void {
    const store = useSessionStore.getState();
    this.stopAutoCleanup();
    store.reset();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  destroy(): void {
    this.reset();
  }
}
