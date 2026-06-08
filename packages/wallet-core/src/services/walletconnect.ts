import { Core } from '@walletconnect/core';
import { Web3Wallet } from '@walletconnect/web3wallet';
import { getSdkError } from '@walletconnect/utils';
import type { SessionTypes } from '@walletconnect/types';

export interface WalletConnectConfig {
  projectId: string;
  name?: string;
  description?: string;
  url?: string;
  icon?: string;
}

export interface SessionProposal {
  id: string;
  proposer: {
    metadata: {
      name: string;
      description: string;
      url: string;
      icons: string[];
    };
  };
  requiredNamespaces: Record<string, any>;
  optionalNamespaces?: Record<string, any>;
}

export interface SessionRequest {
  id: string;
  topic: string;
  chainId: string;
  request: {
    method: string;
    params: any[];
  };
}

export interface PairingInfo {
  topic: string;
  uri: string;
}

export class WalletConnectService {
  private wallet: Web3Wallet | null = null;
  private core: Core | null = null;
  private initialized = false;
  private config: WalletConnectConfig;
  private listeners: Map<string, Set<Function>> = new Map();
  private currentPairing: PairingInfo | null = null;

  constructor(config: WalletConnectConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      if (!this.config.projectId) {
        throw new Error('WalletConnect projectId is required');
      }

      this.core = new Core({
        projectId: this.config.projectId,
      });

      this.wallet = await Web3Wallet.init({
        core: this.core,
        metadata: {
          name: this.config.name || 'ORŸA Wallet',
          description: this.config.description || 'Quiet Luxury for Digital Assets',
          url: this.config.url || 'https://orya.app',
          icons: this.config.icon ? [this.config.icon] : ['https://orya.app/logo.png'],
        },
      });

      this.setupEventListeners();
      this.initialized = true;
    } catch (error) {
      this.core = null;
      this.wallet = null;
      throw new Error(`Failed to initialize WalletConnect: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private setupEventListeners(): void {
    if (!this.wallet) return;

    this.wallet.on('session_proposal', (proposal: any) => {
      this.currentPairing = null;
      this.emit('session_proposal', {
        id: proposal.id,
        proposer: proposal.params.proposer,
        requiredNamespaces: proposal.params.requiredNamespaces,
        optionalNamespaces: proposal.params.optionalNamespaces,
      });
    });

    this.wallet.on('session_request', (request: any) => {
      this.emit('session_request', {
        id: request.id,
        topic: request.topic,
        chainId: request.chainId,
        request: request.request,
      });
    });

    this.wallet.on('session_delete', (session: any) => {
      this.emit('session_delete', session);
    });

    this.wallet.on('session_update', (session: any) => {
      this.emit('session_update', session);
    });
  }

  private emit(event: string, data: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  on(event: string, handler: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  async pairWithUri(uri: string): Promise<void> {
    if (!this.wallet) {
      throw new Error('WalletConnect not initialized');
    }
    this.currentPairing = null;
    await this.wallet.core.pairing.pair({ uri });
  }

  async createPairingUri(): Promise<PairingInfo> {
    if (!this.core || !this.wallet) {
      throw new Error('WalletConnect not initialized');
    }

    try {
      const { uri, topic } = await this.core.pairing.create();
      this.currentPairing = { topic, uri };
      this.emit('pairing_created', { topic, uri });
      return { topic, uri };
    } catch (error) {
      throw new Error(`Failed to create pairing URI: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async cancelPairing(topic?: string): Promise<void> {
    if (!this.core) {
      return;
    }

    const targetTopic = topic || this.currentPairing?.topic;
    if (!targetTopic) {
      return;
    }

    try {
      await this.core.pairing.delete({
        topic: targetTopic,
        reason: getSdkError('USER_DISCONNECTED'),
      });
    } catch (error) {
      throw new Error(`Failed to cancel pairing: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      if (this.currentPairing?.topic === targetTopic) {
        this.currentPairing = null;
      }
      this.emit('pairing_closed', targetTopic);
    }
  }

  async approveSession(
    proposalId: string,
    accounts: string[],
    chains: string[]
  ): Promise<SessionTypes.Struct> {
    if (!this.wallet) {
      throw new Error('WalletConnect not initialized');
    }

    const session = await this.wallet.approveSession({
      id: proposalId,
      namespaces: {
        eip155: {
          accounts: accounts.map((addr) => `eip155:${chains[0] || '1'}:${addr}`),
          methods: [
            'eth_sendTransaction',
            'eth_signTransaction',
            'eth_sign',
            'personal_sign',
            'eth_signTypedData',
          ],
          events: ['chainChanged', 'accountsChanged'],
        },
      },
    });

    this.currentPairing = null;
    this.emit('session_created', session);

    return session;
  }

  async rejectSession(proposalId: string, reason: string): Promise<void> {
    if (!this.wallet) {
      throw new Error('WalletConnect not initialized');
    }

    await this.wallet.rejectSession({
      id: proposalId,
      reason: {
        code: 5000,
        message: reason,
      },
    });

    this.currentPairing = null;
    this.emit('session_rejected', proposalId);
  }

  getSessions(): Record<string, SessionTypes.Struct> {
    if (!this.wallet) return {};
    return this.wallet.getActiveSessions();
  }

  async disconnectSession(topic: string): Promise<void> {
    if (!this.wallet) {
      throw new Error('WalletConnect not initialized');
    }

    await this.wallet.disconnectSession({
      topic,
      reason: {
        code: 6000,
        message: 'User disconnected',
      },
    });
  }

  async respondToSessionRequest(
    requestId: string,
    topic: string,
    response: any
  ): Promise<void> {
    if (!this.wallet) {
      throw new Error('WalletConnect not initialized');
    }

    await this.wallet.respondSessionRequest({
      topic,
      response: {
        id: requestId,
        jsonrpc: '2.0',
        result: response,
      },
    });
  }

  async rejectSessionRequest(
    requestId: string,
    topic: string,
    error: { code: number; message: string }
  ): Promise<void> {
    if (!this.wallet) {
      throw new Error('WalletConnect not initialized');
    }

    await this.wallet.respondSessionRequest({
      topic,
      response: {
        id: requestId,
        jsonrpc: '2.0',
        error,
      },
    });
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const walletConnectService = new WalletConnectService({
  projectId: typeof process !== 'undefined' && process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
    ? process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
    : '',
});
