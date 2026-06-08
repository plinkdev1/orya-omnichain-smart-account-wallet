import type { AppKitNetwork } from '@reown/appkit';
import {
  mainnet as ethereumMainnet,
  sepolia as ethereumSepolia,
  polygonMainnet,
  polygonAmoy,
  arbitrumMainnet,
  arbitrumSepolia,
  optimismMainnet,
  optimismSepolia
} from '@reown/appkit-networks/evm';
import { solanaMainnet, solanaDevnet, solanaTestnet } from '@reown/appkit-networks/solana';
import { ReOwnWalletManager, ReOwnManagerConfig } from './ReOwnWalletManager';
import { ChainAdapter } from './ChainAdapter';
import type { ChainNamespace } from './ChainAdapter';
import { SessionManager } from './SessionManager';
import { SigningQueue } from './SigningQueue';
import type { SigningResultPayload } from './SigningQueue';
import { useSessionStore, WalletSession, SigningRequest } from './sessionStore';

export interface IReownAdapter {
  initialize(): Promise<void>;
  connect(): Promise<WalletSession[]>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getActiveSessions(): WalletSession[];
  switchChain(chainId: string): Promise<boolean>;
  getActiveChain(): string | undefined;
  signMessage(message: string, chainId?: string): Promise<string>;
  signTransaction(transaction: any, chainId?: string): Promise<string>;
  waitForSigningResult(
    requestId: string,
    options?: {
      timeoutMs?: number;
      resolveStatuses?: SigningRequest['status'][];
    }
  ): Promise<SigningRequest>;
  destroy(): Promise<void>;
}

export type ReownBroadcastMode = 'adapter' | 'engine';

export interface ReownTransactionContext {
  request: SigningRequest;
  transaction: any;
  chainId: string;
  chainNamespace: ChainNamespace;
  session: WalletSession;
}

export interface ReownSignatureResponse {
  signature: string;
  publicKey?: string;
  rawTransaction?: string;
  txHash?: string;
  metadata?: Record<string, any>;
}

export interface ReownBroadcastInput extends ReownTransactionContext {
  rawTransaction?: string;
  signature: string;
}

export interface ReownBroadcastResult {
  txHash?: string;
  status?: 'pending' | 'confirmed' | 'failed';
  confirmations?: number;
  metadata?: Record<string, any>;
  errorMessage?: string;
}

export interface ReownStatusPollInput {
  txHash: string;
  context: ReownTransactionContext;
}

export interface ReownStatusPollResult {
  status: 'pending' | 'confirmed' | 'failed';
  confirmations?: number;
  metadata?: Record<string, any>;
  errorMessage?: string;
}

export interface ReownChainTransactionProvider {
  requestSignature: (context: ReownTransactionContext) => Promise<ReownSignatureResponse>;
  broadcast?: (input: ReownBroadcastInput) => Promise<ReownBroadcastResult | void>;
  pollStatus?: (input: ReownStatusPollInput) => Promise<ReownStatusPollResult | void>;
}

export interface ReownAppKitProvider {
  open?: (request: SigningRequest) => Promise<void>;
  close?: (requestId: string) => Promise<void>;
}

export interface ReownTransactionProviders {
  evm?: ReownChainTransactionProvider;
  solana?: ReownChainTransactionProvider;
  appKit?: ReownAppKitProvider;
}

export interface ReownAdapterConfig {
  projectId: string;
  appName: string;
  appDescription: string;
  appUrl: string;
  appIcon: string[];
  chains?: {
    evm?: ('mainnet' | 'testnet' | 'all')[];
    solana?: ('mainnet' | 'testnet' | 'all')[];
  };
  enableAutoConnect?: boolean;
  sessionConfig?: {
    ttl?: number;
    maxSessions?: number;
    autoCleanup?: boolean;
  };
  providers?: ReownTransactionProviders;
  broadcastMode?: ReownBroadcastMode;
  statusPollingIntervalMs?: number;
  defaultWaitTimeoutMs?: number;
}

export class ReownAdapter implements IReownAdapter {
  private walletManager?: ReOwnWalletManager;
  private chainAdapter?: ChainAdapter;
  private sessionManager?: SessionManager;
  private signingQueue?: SigningQueue;
  private providers?: ReownTransactionProviders;
  private broadcastMode: ReownBroadcastMode;
  private statusPollingIntervalMs: number;
  private defaultWaitTimeoutMs: number;
  private statusPollers: Map<string, NodeJS.Timer> = new Map();
  private processedRequests: Set<string> = new Set();
  private config: ReownAdapterConfig;
  private isInitialized: boolean = false;
  private activeChainId?: string;
  private connectionErrorHandler?: (error: Error) => void;
  private disconnectionHandler?: () => void;
  private static instance?: ReownAdapter;

  constructor(config: ReownAdapterConfig) {
    this.config = config;
    this.providers = config.providers;
    this.broadcastMode = config.broadcastMode || 'engine';
    this.statusPollingIntervalMs = config.statusPollingIntervalMs ?? 5000;
    this.defaultWaitTimeoutMs = config.defaultWaitTimeoutMs ?? config.sessionConfig?.ttl ?? 300000;
  }

  setTransactionProviders(providers: ReownTransactionProviders): void {
    this.providers = providers;
  }

  setBroadcastMode(mode: ReownBroadcastMode): void {
    this.broadcastMode = mode;
  }

  setStatusPollingInterval(intervalMs: number): void {
    this.statusPollingIntervalMs = intervalMs;
  }

  setDefaultWaitTimeout(timeoutMs: number): void {
    this.defaultWaitTimeoutMs = timeoutMs;
  }

  static getInstance(config?: ReownAdapterConfig): ReownAdapter {
    if (!ReownAdapter.instance && !config) {
      throw new Error('ReownAdapter must be initialized with config on first call');
    }
    if (!ReownAdapter.instance && config) {
      ReownAdapter.instance = new ReownAdapter(config);
    }
    return ReownAdapter.instance!;
  }

  static create(config: ReownAdapterConfig): ReownAdapter {
    ReownAdapter.instance = new ReownAdapter(config);
    return ReownAdapter.instance;
  }

  static resetInstance(): void {
    ReownAdapter.instance = undefined;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.walletManager = ReOwnWalletManager.initialize({
        reown: {
          projectId: this.config.projectId,
          name: this.config.appName,
          description: this.config.appDescription,
          url: this.config.appUrl,
          icons: this.config.appIcon
        },
        session: this.config.sessionConfig,
        enableAutoCleanup: true
      });

      this.chainAdapter = this.walletManager.getChainAdapter();
      this.sessionManager = this.walletManager.getSessionManager();
      this.signingQueue = this.walletManager.getSigningQueue();

      this.registerChains();

      if (!this.walletManager.validateConfiguration()) {
        throw new Error('Invalid Reown configuration');
      }

      this.setupEventListeners();

      ReownAdapter.instance = this;
      this.isInitialized = true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.handleConnectionError(err);
      throw err;
    }
  }

  async connect(): Promise<WalletSession[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const sessions = this.sessionManager?.getActiveSessions() || [];
      return sessions;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.handleConnectionError(err);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      const sessions = this.sessionManager?.getAllSessions() || [];

      for (const session of sessions) {
        this.sessionManager?.removeSession(session.id);
      }

      this.activeChainId = undefined;

      if (this.disconnectionHandler) {
        this.disconnectionHandler();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error during disconnect:', err);
      throw err;
    }
  }

  isConnected(): boolean {
    if (!this.isInitialized) {
      return false;
    }

    const activeSessions = this.sessionManager?.getActiveSessions() || [];
    return activeSessions.length > 0;
  }

  getActiveSessions(): WalletSession[] {
    if (!this.isInitialized) {
      return [];
    }

    return this.sessionManager?.getActiveSessions() || [];
  }

  async switchChain(chainId: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const chain = this.chainAdapter?.getChain(chainId);
      if (!chain) {
        throw new Error(`Chain ${chainId} not registered`);
      }

      const activeSessions = this.sessionManager?.getActiveSessions() || [];
      if (activeSessions.length === 0) {
        throw new Error('No active sessions to switch chain');
      }

      this.activeChainId = chainId;
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.handleConnectionError(err);
      throw err;
    }
  }

  getActiveChain(): string | undefined {
    return this.activeChainId;
  }

  async signMessage(message: string, chainId?: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Adapter not initialized');
    }

    try {
      const chain = chainId || this.activeChainId;
      if (!chain) {
        throw new Error('No chain selected');
      }

      const activeSessions = this.sessionManager?.getActiveSessions() || [];
      if (activeSessions.length === 0) {
        throw new Error('No active sessions');
      }

      const session = activeSessions[0];

      const method = chain.startsWith('solana') ? 'signMessage' : 'personal_sign';
      const request = await this.walletManager?.createSigningRequest(
        session.id,
        method as any,
        [message],
        chain
      );

      if (!request) {
        throw new Error('Failed to create signing request');
      }

      const store = useSessionStore.getState();
      const chainNamespace = this.resolveChainNamespace(chain);
      store.updateSigningRequest(request.id, { chainNamespace });

      return request.id;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.handleConnectionError(err);
      throw err;
    }
  }

  async signTransaction(transaction: any, chainId?: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Adapter not initialized');
    }

    try {
      const chain = chainId || this.activeChainId;
      if (!chain) {
        throw new Error('No chain selected');
      }

      const session = this.selectSessionForChain(chain);
      if (!session) {
        throw new Error('No active sessions');
      }

      const chainNamespace = this.resolveChainNamespace(chain);
      const method = chainNamespace === 'solana' ? 'solana_signTransaction' : 'eth_signTransaction';
      const request = await this.walletManager?.createSigningRequest(
        session.id,
        method as any,
        [transaction],
        chain
      );

      if (!request) {
        throw new Error('Failed to create signing request');
      }

      const store = useSessionStore.getState();
      store.updateSigningRequest(request.id, { chainNamespace });

      this.processTransactionRequest({
        request,
        transaction,
        chainId: chain,
        chainNamespace,
        session,
      }).catch(error => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.handleConnectionError(err);
      });

      return request.id;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.handleConnectionError(err);
      throw err;
    }
  }

  async waitForSigningResult(
    requestId: string,
    options: {
      timeoutMs?: number;
      resolveStatuses?: SigningRequest['status'][];
    } = {}
  ): Promise<SigningRequest> {
    if (!this.signingQueue) {
      throw new Error('Signing queue not initialized');
    }

    const request = await this.signingQueue.waitForCompletion(requestId, {
      timeoutMs: options.timeoutMs ?? this.defaultWaitTimeoutMs,
      resolveStatuses: options.resolveStatuses,
    });

    if (request.status !== 'pending') {
      this.stopStatusPolling(requestId);
    }

    return request;
  }

  async destroy(): Promise<void> {
    try {
      if (this.walletManager) {
        this.walletManager.destroy();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error during destroy:', err);
    } finally {
      const store = useSessionStore.getState();
      store.reset();

      this.isInitialized = false;
      this.activeChainId = undefined;
      this.clearStatusPollers();
      this.walletManager = undefined;
      this.chainAdapter = undefined;
      this.sessionManager = undefined;
      this.signingQueue = undefined;

      ReownAdapter.instance = undefined;
    }
  }

  onConnectionError(handler: (error: Error) => void): () => void {
    this.connectionErrorHandler = handler;
    return () => {
      this.connectionErrorHandler = undefined;
    };
  }

  onDisconnection(handler: () => void): () => void {
    this.disconnectionHandler = handler;
    return () => {
      this.disconnectionHandler = undefined;
    };
  }

  private selectSessionForChain(chainId: string): WalletSession | undefined {
    const sessions = this.sessionManager?.getActiveSessions() || [];
    if (sessions.length === 0) {
      return undefined;
    }
    const exactMatch = sessions.find(session => session.chainId === chainId);
    return exactMatch || sessions[0];
  }

  private resolveChainNamespace(chainId: string): ChainNamespace {
    if (this.chainAdapter) {
      const namespace = this.chainAdapter.getChainNamespace(chainId);
      if (namespace) {
        return namespace;
      }
    }

    if (chainId.startsWith('eip155')) {
      return 'eip155';
    }
    if (chainId.startsWith('solana')) {
      return 'solana';
    }
    if (chainId.startsWith('cosmos')) {
      return 'cosmos';
    }
    if (chainId.startsWith('sui')) {
      return 'sui';
    }
    return 'other';
  }

  private getProviderForNamespace(namespace: ChainNamespace): ReownChainTransactionProvider | undefined {
    if (namespace === 'eip155') {
      return this.providers?.evm;
    }
    if (namespace === 'solana') {
      return this.providers?.solana;
    }
    return undefined;
  }

  private async processTransactionRequest(context: ReownTransactionContext): Promise<void> {
    const provider = this.getProviderForNamespace(context.chainNamespace);
    if (!provider) {
      return;
    }

    const existing = this.processedRequests.has(context.request.id);
    if (existing) {
      return;
    }
    this.processedRequests.add(context.request.id);

    try {
      await this.providers?.appKit?.open?.(context.request);

      const signatureResponse = await provider.requestSignature(context);
      if (!signatureResponse?.signature) {
        throw new Error('Signing provider did not return a signature');
      }

      const payload: SigningResultPayload = {
        signature: signatureResponse.signature,
        publicKey: signatureResponse.publicKey,
        rawTransaction: signatureResponse.rawTransaction,
        txHash: signatureResponse.txHash,
        metadata: signatureResponse.metadata,
      };

      this.walletManager?.approveSigningRequest(context.request.id, payload);

      const txHashFromSignature = signatureResponse.txHash;

      if (this.broadcastMode === 'adapter' && provider.broadcast) {
        const broadcastResult = await provider.broadcast({
          ...context,
          rawTransaction: signatureResponse.rawTransaction,
          signature: signatureResponse.signature,
        });

        const broadcastTxHash = broadcastResult?.txHash || txHashFromSignature;
        if (broadcastTxHash) {
          this.signingQueue?.markBroadcasted(context.request.id, broadcastTxHash, broadcastResult?.metadata);
        }

        if (broadcastResult?.status === 'failed') {
          const errorMessage = broadcastResult.errorMessage || 'Transaction broadcast failed';
          this.signingQueue?.markFailed(context.request.id, errorMessage, broadcastResult.metadata);
          this.stopStatusPolling(context.request.id);
          return;
        }

        if (broadcastResult?.status === 'confirmed') {
          this.signingQueue?.updateConfirmations(
            context.request.id,
            broadcastResult.confirmations ?? 1,
            'confirmed',
            broadcastResult.metadata
          );
          this.stopStatusPolling(context.request.id);
        } else if (provider.pollStatus && broadcastTxHash) {
          this.startStatusPolling(context.request.id, provider, context, broadcastTxHash);
        }
      } else if (txHashFromSignature) {
        this.signingQueue?.markBroadcasted(context.request.id, txHashFromSignature, signatureResponse.metadata);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.signingQueue?.markFailed(context.request.id, message);
      this.walletManager?.rejectSigningRequest(context.request.id, message);
      this.stopStatusPolling(context.request.id);
      throw error;
    } finally {
      await this.providers?.appKit?.close?.(context.request.id).catch(() => undefined);
    }
  }

  private startStatusPolling(
    requestId: string,
    provider: ReownChainTransactionProvider,
    context: ReownTransactionContext,
    txHash: string
  ): void {
    if (!provider.pollStatus) {
      return;
    }

    this.stopStatusPolling(requestId);

    const poll = async () => {
      try {
        const result = await provider.pollStatus!({ txHash, context });
        if (!result) {
          return;
        }

        if (result.status === 'pending') {
          this.signingQueue?.updateConfirmations(
            requestId,
            result.confirmations ?? 0,
            'broadcasted',
            result.metadata
          );
          return;
        }

        if (result.status === 'confirmed') {
          this.signingQueue?.updateConfirmations(
            requestId,
            result.confirmations ?? 1,
            'confirmed',
            result.metadata
          );
          this.stopStatusPolling(requestId);
          return;
        }

        if (result.status === 'failed') {
          const errorMessage = result.errorMessage || 'Transaction failed';
          this.signingQueue?.markFailed(requestId, errorMessage, result.metadata);
          this.stopStatusPolling(requestId);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.signingQueue?.markFailed(requestId, message);
        this.stopStatusPolling(requestId);
      }
    };

    const interval = setInterval(poll, this.statusPollingIntervalMs);
    this.statusPollers.set(requestId, interval);
    void poll();
  }

  private stopStatusPolling(requestId: string): void {
    const timer = this.statusPollers.get(requestId);
    if (timer) {
      clearInterval(timer);
      this.statusPollers.delete(requestId);
    }
    this.processedRequests.delete(requestId);
  }

  private clearStatusPollers(): void {
    this.statusPollers.forEach(timer => clearInterval(timer));
    this.statusPollers.clear();
    this.processedRequests.clear();
  }

  private registerChains(): void {
    if (!this.walletManager) {
      return;
    }

    const configManager = this.walletManager.getConfigManager();
    const chains: AppKitNetwork[] = [];
    const evmSelection = this.resolveChainSelection(this.config.chains?.evm);
    const solanaSelection = this.resolveChainSelection(this.config.chains?.solana);

    if (evmSelection) {
      configManager.enableEVMChains(evmSelection);
      if (evmSelection === 'mainnet' || evmSelection === 'all') {
        chains.push(ethereumMainnet, polygonMainnet, arbitrumMainnet, optimismMainnet);
      }
      if (evmSelection === 'testnet' || evmSelection === 'all') {
        chains.push(ethereumSepolia, polygonAmoy, arbitrumSepolia, optimismSepolia);
      }
    }

    if (solanaSelection) {
      configManager.enableSolanaChains(solanaSelection);
      if (solanaSelection === 'mainnet' || solanaSelection === 'all') {
        chains.push(solanaMainnet);
      }
      if (solanaSelection === 'testnet' || solanaSelection === 'all') {
        chains.push(solanaDevnet, solanaTestnet);
      }
    }

    if (chains.length === 0) {
      return;
    }

    const uniqueChains = new Map<string, AppKitNetwork>();
    chains.forEach(network => {
      uniqueChains.set(network.id.toString(), network);
    });

    const registeredChains = Array.from(uniqueChains.values());
    if (registeredChains.length === 0) {
      return;
    }

    this.walletManager.registerChains(registeredChains);
    this.activeChainId = registeredChains[0].id.toString();
  }

  private resolveChainSelection(
    chains?: ('mainnet' | 'testnet' | 'all')[]
  ): 'mainnet' | 'testnet' | 'all' | undefined {
    if (!chains || chains.length === 0) {
      return 'mainnet';
    }

    if (chains.includes('all')) {
      return 'all';
    }

    const hasMainnet = chains.includes('mainnet');
    const hasTestnet = chains.includes('testnet');

    if (hasMainnet && hasTestnet) {
      return 'all';
    }

    if (hasTestnet) {
      return 'testnet';
    }

    if (hasMainnet) {
      return 'mainnet';
    }

    return undefined;
  }

  private setupEventListeners(): void {
    if (!this.walletManager) return;

    this.walletManager.on('session_created', (session: WalletSession) => {
      console.log('Session created:', session.id);
    });

    this.walletManager.on('session_approved', (session: WalletSession) => {
      console.log('Session approved:', session.id);
    });

    this.walletManager.on('session_rejected', (data: any) => {
      console.log('Session rejected:', data.sessionId);
    });

    this.walletManager.on('error', (error: any) => {
      console.error('ReOwn error:', error);
      if (error instanceof Error) {
        this.handleConnectionError(error);
      } else {
        this.handleConnectionError(new Error(String(error)));
      }
    });
  }

  private handleConnectionError(error: Error): void {
    if (this.connectionErrorHandler) {
      try {
        this.connectionErrorHandler(error);
      } catch (err) {
        console.error('Error in connection error handler:', err);
      }
    }
  }

  getWalletManager(): ReOwnWalletManager | undefined {
    return this.walletManager;
  }

  getChainAdapter(): ChainAdapter | undefined {
    return this.chainAdapter;
  }

  getSessionManager(): SessionManager | undefined {
    return this.sessionManager;
  }

  getSigningQueue(): SigningQueue | undefined {
    return this.signingQueue;
  }

  isInitializedFlag(): boolean {
    return this.isInitialized;
  }
}
