/**
 * ReOwn AppKit Integration (WalletConnect v2+)
 * Modern wallet connection protocol with improved UX and multi-chain support
 * Replaces deprecated WalletConnect Core v1
 */

let AppKit: any;
try {
  const appKitModule = require('@reown/appkit');
  AppKit = appKitModule.AppKit;
} catch {
  AppKit = class {
    constructor(config: any) {
      console.warn('AppKit SDK not available. WalletConnect v2 features disabled.');
    }
  };
}

export interface WalletConnectAppKitConfig {
  projectId: string;
  chains: {
    chainId: number;
    name: string;
    currency: string;
    explorerUrl: string;
    rpcUrl: string;
  }[];
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  enableAnalytics?: boolean;
  enableEmail?: boolean;
}

export interface WalletSession {
  topic: string;
  namespace: string;
  chainId: number;
  accounts: string[];
  peerMetadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  createdAt: number;
  expiresAt?: number;
}

export interface SignRequest {
  id: string;
  topic: string;
  chainId: number;
  method: string;
  params: any;
  peerName: string;
  createdAt: number;
}

export interface SignResponse {
  id: string;
  result?: string;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * WalletConnect AppKit Manager
 * Handles all WalletConnect v2/ReOwn AppKit operations
 */
export class WalletConnectAppKitManager {
  private config: WalletConnectAppKitConfig;
  private sessions: Map<string, WalletSession> = new Map();
  private pendingRequests: Map<string, SignRequest> = new Map();
  private isInitialized: boolean = false;
  private isAvailable: boolean = true;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private appKit?: any;
  private static instance?: WalletConnectAppKitManager;

  constructor(config: WalletConnectAppKitConfig) {
    this.config = config;
    this.validateConfig();
  }

  static getInstance(config?: WalletConnectAppKitConfig): WalletConnectAppKitManager {
    if (!WalletConnectAppKitManager.instance && config) {
      WalletConnectAppKitManager.instance = new WalletConnectAppKitManager(config);
    }
    return WalletConnectAppKitManager.instance!;
  }

  static create(config: WalletConnectAppKitConfig): WalletConnectAppKitManager {
    WalletConnectAppKitManager.instance = new WalletConnectAppKitManager(config);
    return WalletConnectAppKitManager.instance;
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.projectId) {
      throw new Error('WalletConnect projectId is required');
    }
    if (!this.config.metadata.name || !this.config.metadata.url) {
      throw new Error('Metadata name and url are required');
    }
    if (!Array.isArray(this.config.chains) || this.config.chains.length === 0) {
      throw new Error('At least one chain configuration is required');
    }
  }

  /**
   * Initialize AppKit
   * Instantiates @reown/appkit runtime once at provider layer
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('WalletConnectAppKit already initialized');
      return;
    }

    try {
      if (!this.appKit) {
        const networks = this.config.chains.map((chain) => ({
          chainId: chain.chainId,
          name: chain.name,
          currency: chain.currency,
          explorerUrl: chain.explorerUrl,
          rpcUrl: chain.rpcUrl
        }));
        
        this.appKit = new AppKit({
          projectId: this.config.projectId,
          metadata: this.config.metadata,
          networks: networks,
          sdkVersion: '1.1.2'
        });
      }
      this.isInitialized = true;
      console.log('WalletConnectAppKit initialized successfully');
    } catch (error) {
      this.isAvailable = false;
      throw new Error(
        `AppKit initialization failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Open AppKit modal for wallet connection
   * Opens the official AppKit modal UI
   */
  async openModal(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (this.appKit) {
        this.appKit.open();
      } else {
        throw new Error('AppKit not initialized');
      }
    } catch (error) {
      throw new Error(
        `Failed to open modal: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Close AppKit modal
   */
  async closeModal(): Promise<void> {
    try {
      if (this.appKit) {
        this.appKit.close();
      }
    } catch (error) {
      throw new Error(
        `Failed to close modal: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate connection URI with deep linking support
   * Returns URI for QR code or deep link
   */
  async generateConnectionUri(chainId?: number): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const selectedChain = chainId
        ? this.config.chains.find((c) => c.chainId === chainId)
        : this.config.chains[0];

      if (!selectedChain) {
        throw new Error(`Chain ${chainId} not supported`);
      }

      const uri = `wc:${this.config.projectId}@2?relay-protocol=irn&symKey=${this.generateSymmetricKey()}&chains=${selectedChain.chainId}`;

      return uri;
    } catch (error) {
      throw new Error(
        `Failed to generate URI: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Handle wallet connection
   */
  async handleWalletConnection(
    topic: string,
    namespace: string,
    chainId: number,
    accounts: string[],
    peerMetadata: any
  ): Promise<WalletSession> {
    try {
      const session: WalletSession = {
        topic,
        namespace,
        chainId,
        accounts,
        peerMetadata,
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      };

      this.sessions.set(topic, session);
      this.emit('session_connected', session);

      return session;
    } catch (error) {
      throw new Error(
        `Failed to handle wallet connection: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Handle signing request from connected wallet
   */
  async handleSigningRequest(
    id: string,
    topic: string,
    chainId: number,
    method: string,
    params: any,
    peerName: string
  ): Promise<SignRequest> {
    try {
      const request: SignRequest = {
        id,
        topic,
        chainId,
        method,
        params,
        peerName,
        createdAt: Date.now(),
      };

      this.pendingRequests.set(id, request);
      this.emit('sign_request', request);

      return request;
    } catch (error) {
      throw new Error(
        `Failed to handle signing request: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Approve signing request
   */
  async approveSignRequest(id: string, signature: string): Promise<SignResponse> {
    const request = this.pendingRequests.get(id);
    if (!request) {
      throw new Error(`Signing request not found: ${id}`);
    }

    try {
      const response: SignResponse = {
        id,
        result: signature,
      };

      this.pendingRequests.delete(id);
      this.emit('sign_response', response);

      return response;
    } catch (error) {
      throw new Error(
        `Failed to approve signing request: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Reject signing request
   */
  async rejectSignRequest(id: string, reason: string): Promise<SignResponse> {
    const request = this.pendingRequests.get(id);
    if (!request) {
      throw new Error(`Signing request not found: ${id}`);
    }

    try {
      const response: SignResponse = {
        id,
        error: {
          code: -32603,
          message: reason || 'User rejected the signing request',
        },
      };

      this.pendingRequests.delete(id);
      this.emit('sign_response', response);

      return response;
    } catch (error) {
      throw new Error(
        `Failed to reject signing request: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Disconnect session
   */
  async disconnectSession(topic: string): Promise<void> {
    try {
      const session = this.sessions.get(topic);
      if (!session) {
        throw new Error(`Session not found: ${topic}`);
      }

      this.sessions.delete(topic);
      this.emit('session_disconnected', topic);
    } catch (error) {
      throw new Error(
        `Failed to disconnect session: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): WalletSession[] {
    const now = Date.now();
    return Array.from(this.sessions.values()).filter(
      (session) => !session.expiresAt || session.expiresAt > now
    );
  }

  /**
   * Get pending signing requests
   */
  getPendingRequests(): SignRequest[] {
    return Array.from(this.pendingRequests.values());
  }

  /**
   * Get session by topic
   */
  getSession(topic: string): WalletSession | undefined {
    return this.sessions.get(topic);
  }

  /**
   * Get signing request by id
   */
  getSignRequest(id: string): SignRequest | undefined {
    return this.pendingRequests.get(id);
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: Function): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit event
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Generate symmetric key for URI
   */
  private generateSymmetricKey(): string {
    const chars = 'abcdef0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.isAvailable;
  }

  /**
   * Disconnect all sessions
   */
  async disconnectAll(): Promise<void> {
    try {
      const topics = Array.from(this.sessions.keys());
      for (const topic of topics) {
        await this.disconnectSession(topic);
      }
      this.sessions.clear();
      this.pendingRequests.clear();
    } catch (error) {
      throw new Error(
        `Failed to disconnect all: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get config
   */
  getConfig(): WalletConnectAppKitConfig {
    return JSON.parse(JSON.stringify(this.config));
  }
}

/**
 * Factory function
 */
export function createWalletConnectAppKit(
  config: WalletConnectAppKitConfig
): WalletConnectAppKitManager {
  return new WalletConnectAppKitManager(config);
}

let appKitInstance: WalletConnectAppKitManager | null = null;

/**
 * Initialize singleton
 */
export function initializeWalletConnectAppKit(
  config: WalletConnectAppKitConfig
): WalletConnectAppKitManager {
  if (!appKitInstance) {
    appKitInstance = createWalletConnectAppKit(config);
  }
  return appKitInstance;
}

/**
 * Get singleton
 */
export function getWalletConnectAppKit(): WalletConnectAppKitManager | null {
  return appKitInstance;
}
