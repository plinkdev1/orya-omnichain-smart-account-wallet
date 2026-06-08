/**
 * Step 4B: WalletConnectManager
 * Manages WalletConnect / ReOwn SDK integration for cross-device wallet connections
 */

// WalletConnect imports are optional - wrapped for graceful degradation
let wcInitialized = false;
let Core: any = null;
let Web3Wallet: any = null;
let getSdkError: any = null;

try {
  const wcCore = require("@walletconnect/core");
  const wcUtils = require("@walletconnect/utils");
  const wcWeb3 = require("@walletconnect/web3wallet");
  
  Core = wcCore.Core;
  Web3Wallet = wcWeb3.Web3Wallet;
  getSdkError = wcUtils.getSdkError;
  wcInitialized = true;
} catch (error) {
  console.warn('WalletConnect not available - WalletConnectManager will have limited functionality', error);
}

export interface WalletConnectConfig {
  projectId: string;
  relayUrl?: string;
  name: string;
  description: string;
  url: string;
  icons: string[];
}

export interface PairingSession {
  topic: string;
  peerMetadata: any;
  createdAt: number;
  isActive: boolean;
}

export interface SigningRequest {
  id: string;
  topic: string;
  method: string;
  params: any;
  peerName: string;
  createdAt: number;
}

/**
 * WalletConnectManager handles all WalletConnect interactions
 */
export class WalletConnectManager {
  private core: any = null;
  private web3wallet: any = null;
  private config: WalletConnectConfig;
  private pairingSessions: Map<string, PairingSession> = new Map();
  private signingRequests: Map<string, SigningRequest> = new Map();
  private isInitialized: boolean = false;
  private isAvailable: boolean;

  constructor(config: WalletConnectConfig) {
    this.config = config;
    this.isAvailable = wcInitialized;
    this.validateConfig();
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.projectId) {
      throw new Error("WalletConnect projectId is required");
    }
    if (!this.config.name || !this.config.url) {
      throw new Error("Wallet name and URL are required");
    }
  }

  /**
   * Initialize WalletConnect
   */
  async initialize(): Promise<void> {
    if (!this.isAvailable) {
      console.warn("WalletConnect not available - operating in limited mode");
      return;
    }

    try {
      if (this.isInitialized) {
        console.warn("WalletConnectManager already initialized");
        return;
      }

      // Initialize Core
      this.core = new Core({
        projectId: this.config.projectId,
        relayUrl: this.config.relayUrl || "wss://relay.walletconnect.com",
      });

      // Initialize Web3Wallet
      this.web3wallet = await Web3Wallet?.init?.({
        core: this.core,
        metadata: {
          name: this.config.name,
          description: this.config.description,
          url: this.config.url,
          icons: this.config.icons,
        },
      });

      // Setup event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log("WalletConnect initialized successfully");
    } catch (error) {
      console.error("Failed to initialize WalletConnect:", error);
      this.isAvailable = false;
      throw new Error(`WalletConnect initialization failed: ${(error as any).message}`);
    }
  }

  /**
   * Setup WalletConnect event listeners
   */
  private setupEventListeners(): void {
    if (!this.web3wallet) return;

    // Session proposal handler
    this.web3wallet.on("session_proposal", this.handleSessionProposal.bind(this));

    // Session request handler
    this.web3wallet.on("session_request", this.handleSessionRequest.bind(this));

    // Session delete handler
    this.web3wallet.on("session_delete", this.handleSessionDelete.bind(this));

    // Session update handler
    this.web3wallet.on("session_update", this.handleSessionUpdate.bind(this));
  }

  /**
   * Generate pairing QR URI
   */
  async generatePairingUri(): Promise<string> {
    if (!this.web3wallet) {
      throw new Error("WalletConnect not initialized");
    }

    try {
      // Create a new pairing
      const { uri, topic } = await this.core!.pairing.create();
      
      // Store pairing info
      this.pairingSessions.set(topic, {
        topic,
        peerMetadata: null,
        createdAt: Date.now(),
        isActive: false,
      });

      return uri;
    } catch (error) {
      throw new Error(`Failed to generate pairing URI: ${(error as any).message}`);
    }
  }

  /**
   * Handle session proposal from peer
   */
  private async handleSessionProposal(proposal: any): Promise<void> {
    const { id, params } = proposal;
    const { requiredNamespaces, optionalNamespaces, relays, proposer } = params;

    console.log("Session proposal received:", {
      id,
      proposer: proposer.metadata?.name,
      requiredNamespaces,
    });

    try {
      // For demo: auto-approve all sessions
      const namespaces: Record<string, any> = {};

      // Handle Sui namespace
      if (requiredNamespaces.sui || optionalNamespaces?.sui) {
        namespaces.sui = {
          chains: ["sui:mainnet"],
          methods: ["sui_signAndExecuteTransactionBlock", "sui_signData"],
          events: ["chainChanged", "accountsChanged"],
          accounts: ["sui:mainnet:0x0"], // Use user's actual address
        };
      }

      if (this.web3wallet) {
        await this.web3wallet.approveSession({
          id,
          namespaces,
        });
      }

      // Update pairing session
      this.pairingSessions.set(params.requiredNamespaces.sui?.chains?.[0] || "", {
        topic: proposal.topic,
        peerMetadata: proposer.metadata,
        createdAt: Date.now(),
        isActive: true,
      });
    } catch (error) {
      console.error("Failed to handle session proposal:", error);
      if (this.web3wallet) {
        await this.web3wallet.rejectSession({
          id,
          reason: getSdkError("USER_REJECTED"),
        });
      }
    }
  }

  /**
   * Handle signing request from peer
   */
  private async handleSessionRequest(request: any): Promise<void> {
    const { id, topic, method, params } = request;
    
    console.log("Session request received:", {
      id,
      method,
      topic,
    });

    // Create signing request
    const signingRequest: SigningRequest = {
      id: id.toString(),
      topic,
      method,
      params,
      peerName: this.getPeerName(topic),
      createdAt: Date.now(),
    };

    this.signingRequests.set(id.toString(), signingRequest);

    // In production, this would trigger UI for user approval
    // For now, emit an event that can be listened to
    this.emitSigningRequest(signingRequest);
  }

  /**
   * Handle session delete
   */
  private async handleSessionDelete(event: any): Promise<void> {
    const { topic } = event;
    console.log("Session deleted:", topic);
    this.pairingSessions.delete(topic);
  }

  /**
   * Handle session update
   */
  private async handleSessionUpdate(event: any): Promise<void> {
    const { topic, namespaces } = event;
    console.log("Session updated:", topic, namespaces);
  }

  /**
   * Approve signing request
   */
  async approveSigningRequest(requestId: string, signature: string): Promise<void> {
    if (!this.web3wallet) {
      throw new Error("WalletConnect not initialized");
    }

    const request = this.signingRequests.get(requestId);
    if (!request) {
      throw new Error(`Signing request not found: ${requestId}`);
    }

    try {
      await this.web3wallet.respondSessionRequest({
        topic: request.topic,
        response: {
          id: parseInt(requestId),
          jsonrpc: "2.0",
          result: signature,
        },
      });

      this.signingRequests.delete(requestId);
      console.log("Signing request approved:", requestId);
    } catch (error) {
      throw new Error(`Failed to approve signing request: ${(error as any).message}`);
    }
  }

  /**
   * Reject signing request
   */
  async rejectSigningRequest(requestId: string, reason?: string): Promise<void> {
    if (!this.web3wallet) {
      throw new Error("WalletConnect not initialized");
    }

    const request = this.signingRequests.get(requestId);
    if (!request) {
      throw new Error(`Signing request not found: ${requestId}`);
    }

    try {
      await this.web3wallet.respondSessionRequest({
        topic: request.topic,
        response: {
          id: parseInt(requestId),
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: reason || "User rejected signing request",
          },
        },
      });

      this.signingRequests.delete(requestId);
      console.log("Signing request rejected:", requestId);
    } catch (error) {
      throw new Error(`Failed to reject signing request: ${(error as any).message}`);
    }
  }

  /**
   * Get all active pairing sessions
   */
  getPairingSessions(): PairingSession[] {
    return Array.from(this.pairingSessions.values()).filter((s) => s.isActive);
  }

  /**
   * Get all pending signing requests
   */
  getPendingSigningRequests(): SigningRequest[] {
    return Array.from(this.signingRequests.values());
  }

  /**
   * Get peer name from topic
   */
  private getPeerName(topic: string): string {
    const session = this.pairingSessions.get(topic);
    return session?.peerMetadata?.name || "Unknown Peer";
  }

  /**
   * Emit signing request for external listeners
   */
  private emitSigningRequest(request: SigningRequest): void {
    const event = new CustomEvent("walletconnect-signing-request", {
      detail: request,
    });
    window.dispatchEvent(event);
  }

  /**
   * Listener for signing requests
   */
  onSigningRequest(callback: (request: SigningRequest) => void): () => void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail);
    };

    window.addEventListener("walletconnect-signing-request", handler);

    // Return unsubscribe function
    return () => {
      window.removeEventListener("walletconnect-signing-request", handler);
    };
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized && !!this.web3wallet;
  }

  /**
   * Disconnect all sessions
   */
  async disconnect(): Promise<void> {
    if (!this.web3wallet) return;

    try {
      const sessions = this.web3wallet.getActiveSessions();
      if (sessions && typeof sessions === 'object') {
        for (const session of Object.values(sessions)) {
          if (session && typeof session === 'object' && 'topic' in session) {
            await this.web3wallet.disconnectSession({
              topic: (session as any).topic,
              reason: getSdkError("USER_DISCONNECTED"),
            });
          }
        }
      }
      this.pairingSessions.clear();
      this.signingRequests.clear();
    } catch (error) {
      console.error("Failed to disconnect sessions:", error);
    }
  }
}

/**
 * Global WalletConnectManager instance
 */
let globalManager: WalletConnectManager | null = null;

/**
 * Initialize global WalletConnectManager
 */
export function initializeWalletConnectManager(
  config: WalletConnectConfig
): WalletConnectManager {
  if (globalManager) {
    console.warn("WalletConnectManager already initialized");
    return globalManager;
  }

  globalManager = new WalletConnectManager(config);
  return globalManager;
}

/**
 * Get global WalletConnectManager
 */
export function getWalletConnectManager(): WalletConnectManager | null {
  return globalManager;
}