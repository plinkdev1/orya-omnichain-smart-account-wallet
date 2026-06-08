import { ReownAdapter, ReownAdapterConfig, IReownAdapter } from '../connectivity/reown/ReownAdapter';
import { useSessionStore } from '../connectivity/reown/sessionStore';

describe('ReownAdapter', () => {
  let adapter: ReownAdapter;
  const mockConfig: ReownAdapterConfig = {
    projectId: 'test-project-id',
    appName: 'Test Wallet',
    appDescription: 'Test wallet description',
    appUrl: 'https://test.wallet.com',
    appIcon: ['https://test.wallet.com/icon.png'],
    chains: {
      evm: ['mainnet'],
      solana: ['mainnet']
    },
    enableAutoConnect: false,
    sessionConfig: {
      ttl: 86400000,
      maxSessions: 10,
      autoCleanup: true
    }
  };

  beforeEach(() => {
    useSessionStore.getState().reset();
    ReownAdapter.resetInstance();
  });

  afterEach(async () => {
    if (adapter && adapter.isInitializedFlag()) {
      await adapter.destroy();
    }
  });

  describe('Initialization', () => {
    it('should create adapter instance with config', () => {
      adapter = new ReownAdapter(mockConfig);
      expect(adapter).toBeInstanceOf(ReownAdapter);
    });

    it('should initialize successfully', async () => {
      adapter = new ReownAdapter(mockConfig);
      await adapter.initialize();
      expect(adapter.isInitializedFlag()).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      adapter = new ReownAdapter(mockConfig);
      await adapter.initialize();
      const chainAdapterFirst = adapter.getChainAdapter();
      await adapter.initialize();
      const chainAdapterSecond = adapter.getChainAdapter();
      expect(chainAdapterFirst).toBe(chainAdapterSecond);
    });

    it('should use singleton instance pattern', () => {
      adapter = ReownAdapter.create(mockConfig);
      const instance1 = ReownAdapter.getInstance();
      expect(instance1).toBe(adapter);
    });

    it('should throw error when getInstance called without initialization', () => {
      expect(() => ReownAdapter.getInstance()).toThrow('ReownAdapter must be initialized with config on first call');
    });

    it('should handle initialization errors', async () => {
      const invalidConfig = { ...mockConfig, projectId: '' };
      adapter = new ReownAdapter(invalidConfig);

      await expect(adapter.initialize()).rejects.toBeDefined();
    });
  });

  describe('Connection Management', () => {
    beforeEach(async () => {
      adapter = new ReownAdapter(mockConfig);
      await adapter.initialize();
    });

    it('should report not connected initially', () => {
      expect(adapter.isConnected()).toBe(false);
    });

    it('should return empty array of active sessions initially', () => {
      const sessions = adapter.getActiveSessions();
      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBe(0);
    });

    it('should connect and return sessions', async () => {
      const sessions = await adapter.connect();
      expect(Array.isArray(sessions)).toBe(true);
    });

    it('should initialize automatically on connect if not initialized', async () => {
      adapter = new ReownAdapter(mockConfig);
      const sessions = await adapter.connect();
      expect(adapter.isInitializedFlag()).toBe(true);
      expect(Array.isArray(sessions)).toBe(true);
    });

    it('should disconnect and clear sessions', async () => {
      const store = useSessionStore.getState();
      store.addSession({
        id: 'test-session-1',
        topic: 'test-topic',
        peerName: 'Test Peer',
        peerMetadata: { name: 'Test Peer' },
        chainId: '1',
        chainNamespace: 'eip155',
        accounts: ['0x1234567890123456789012345678901234567890'],
        isApproved: true,
        createdAt: Date.now(),
        isActive: true
      });

      expect(adapter.getActiveSessions().length).toBe(1);
      await adapter.disconnect();
      expect(adapter.getActiveSessions().length).toBe(0);
    });

    it('should disconnect without error when no sessions exist', async () => {
      await expect(adapter.disconnect()).resolves.not.toThrow();
    });
  });

  describe('Chain Management', () => {
    beforeEach(async () => {
      adapter = new ReownAdapter(mockConfig);
      await adapter.initialize();
    });

    it('should have default active chain after initialization', () => {
      const chain = adapter.getActiveChain();
      expect(chain).toBeDefined();
    });

    it('should switch to valid chain', async () => {
      const chainAdapter = adapter.getChainAdapter();
      const chains = chainAdapter?.getAllChains();

      if (chains && chains.length > 0) {
        const chain = chains[0];
        const store = useSessionStore.getState();
        store.addSession({
          id: 'chain-switch-session',
          topic: 'chain-switch-topic',
          peerName: 'Chain Switch Peer',
          peerMetadata: { name: 'Chain Switch Peer' },
          chainId: chain.id,
          chainNamespace: chain.namespace,
          accounts: ['0x1234567890123456789012345678901234567890'],
          isApproved: true,
          createdAt: Date.now(),
          isActive: true
        });

        const result = await adapter.switchChain(chain.id);
        expect(result).toBe(true);
        expect(adapter.getActiveChain()).toBe(chain.id);
      }
    });

    it('should throw error when switching to invalid chain', async () => {
      await expect(adapter.switchChain('invalid-chain-id')).rejects.toBeDefined();
    });

    it('should throw error when switching chain without sessions', async () => {
      const chainAdapter = adapter.getChainAdapter();
      const chains = chainAdapter?.getAllChains();

      if (chains && chains.length > 0) {
        await expect(adapter.switchChain(chains[0].id)).rejects.toBeDefined();
      }
    });
  });

  describe('Message Signing', () => {
    beforeEach(async () => {
      adapter = new ReownAdapter(mockConfig);
      await adapter.initialize();
    });

    it('should throw error when signing without initialization', async () => {
      adapter = new ReownAdapter(mockConfig);
      await expect(adapter.signMessage('test message')).rejects.toBeDefined();
    });

    it('should throw error when signing without active sessions', async () => {
      await expect(adapter.signMessage('test message')).rejects.toBeDefined();
    });

    it('should create signing request with active session', async () => {
      const store = useSessionStore.getState();
      const chainAdapter = adapter.getChainAdapter();
      const chains = chainAdapter?.getAllChains();

      if (chains && chains.length > 0) {
        store.addSession({
          id: 'test-session-1',
          topic: 'test-topic',
          peerName: 'Test Peer',
          peerMetadata: { name: 'Test Peer' },
          chainId: chains[0].id,
          chainNamespace: 'eip155',
          accounts: ['0x1234567890123456789012345678901234567890'],
          isApproved: true,
          createdAt: Date.now(),
          isActive: true
        });

        const requestId = await adapter.signMessage('test message', chains[0].id);
        expect(requestId).toBeDefined();
        expect(typeof requestId).toBe('string');
      }
    });
  });

  describe('Transaction Signing', () => {
    beforeEach(async () => {
      adapter = new ReownAdapter(mockConfig);
      await adapter.initialize();
    });

    it('should throw error when signing without initialization', async () => {
      adapter = new ReownAdapter(mockConfig);
      await expect(adapter.signTransaction({ data: 'test' })).rejects.toBeDefined();
    });

    it('should throw error when signing without active sessions', async () => {
      await expect(adapter.signTransaction({ data: 'test' })).rejects.toBeDefined();
    });

    it('should create signing request for transaction', async () => {
      const store = useSessionStore.getState();
      const chainAdapter = adapter.getChainAdapter();
      const chains = chainAdapter?.getAllChains();

      if (chains && chains.length > 0) {
        store.addSession({
          id: 'test-session-1',
          topic: 'test-topic',
          peerName: 'Test Peer',
          peerMetadata: { name: 'Test Peer' },
          chainId: chains[0].id,
          chainNamespace: 'eip155',
          accounts: ['0x1234567890123456789012345678901234567890'],
          isApproved: true,
          createdAt: Date.now(),
          isActive: true
        });

        const requestId = await adapter.signTransaction({ data: 'test transaction' }, chains[0].id);
        expect(requestId).toBeDefined();
        expect(typeof requestId).toBe('string');
      }
    });

    it('should wait for signing result when approved', async () => {
      const store = useSessionStore.getState();
      const chainAdapter = adapter.getChainAdapter();
      const chains = chainAdapter?.getAllChains();

      if (chains && chains.length > 0) {
        store.addSession({
          id: 'test-session-2',
          topic: 'test-topic-2',
          peerName: 'Test Peer 2',
          peerMetadata: { name: 'Test Peer 2' },
          chainId: chains[0].id,
          chainNamespace: 'eip155',
          accounts: ['0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'],
          isApproved: true,
          createdAt: Date.now(),
          isActive: true
        });

        const requestId = await adapter.signTransaction({ data: 'another transaction' }, chains[0].id);
        const waitPromise = adapter.waitForSigningResult(requestId, { timeoutMs: 1000 });
        const manager = adapter.getWalletManager();
        manager.approveSigningRequest(requestId, '0xsigned');
        const request = await waitPromise;
        expect(request.signature).toBe('0xsigned');
        expect(request.status).toBe('signed');
      }
    });
  });

  describe('Destruction', () => {
    beforeEach(async () => {
      adapter = new ReownAdapter(mockConfig);
      await adapter.initialize();
    });

    it('should destroy adapter and clean up resources', async () => {
      expect(adapter.isInitializedFlag()).toBe(true);
      await adapter.destroy();
      expect(adapter.isInitializedFlag()).toBe(false);
    });

    it('should clear all sessions on destroy', async () => {
      const store = useSessionStore.getState();
      store.addSession({
        id: 'test-session-1',
        topic: 'test-topic',
        peerName: 'Test Peer',
        peerMetadata: { name: 'Test Peer' },
        chainId: '1',
        chainNamespace: 'eip155',
        accounts: ['0x1234567890123456789012345678901234567890'],
        isApproved: true,
        createdAt: Date.now(),
        isActive: true
      });

      expect(adapter.getActiveSessions().length).toBe(1);
      await adapter.destroy();
      expect(adapter.getActiveSessions().length).toBe(0);
    });

    it('should reset singleton instance on destroy', async () => {
      expect(ReownAdapter.getInstance()).toBe(adapter);
      await adapter.destroy();
      expect(() => ReownAdapter.getInstance()).toThrow();
    });

    it('should handle destroy errors gracefully', async () => {
      await expect(adapter.destroy()).resolves.not.toThrow();
    });
  });

  describe('Event Handlers', () => {
    beforeEach(async () => {
      adapter = new ReownAdapter(mockConfig);
      await adapter.initialize();
    });

    it('should register connection error handler', () => {
      const handler = jest.fn();
      const unsubscribe = adapter.onConnectionError(handler);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call connection error handler on error', async () => {
      const handler = jest.fn();
      adapter.onConnectionError(handler);

      try {
        await adapter.signMessage('test');
      } catch {
        expect(handler).toHaveBeenCalled();
      }
    });

    it('should unsubscribe connection error handler', async () => {
      const handler = jest.fn();
      const unsubscribe = adapter.onConnectionError(handler);
      unsubscribe();

      await expect(adapter.signMessage('test')).rejects.toBeDefined();
      expect(handler).not.toHaveBeenCalled();
    });

    it('should register disconnection handler', () => {
      const handler = jest.fn();
      const unsubscribe = adapter.onDisconnection(handler);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call disconnection handler on disconnect', async () => {
      const handler = jest.fn();
      adapter.onDisconnection(handler);
      await adapter.disconnect();
      expect(handler).toHaveBeenCalled();
    });

    it('should unsubscribe disconnection handler', async () => {
      const handler = jest.fn();
      const unsubscribe = adapter.onDisconnection(handler);
      unsubscribe();
      await adapter.disconnect();
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Accessor Methods', () => {
    beforeEach(async () => {
      adapter = new ReownAdapter(mockConfig);
      await adapter.initialize();
    });

    it('should return wallet manager', () => {
      const manager = adapter.getWalletManager();
      expect(manager).toBeDefined();
    });

    it('should return chain adapter', () => {
      const chainAdapter = adapter.getChainAdapter();
      expect(chainAdapter).toBeDefined();
    });

    it('should return session manager', () => {
      const sessionManager = adapter.getSessionManager();
      expect(sessionManager).toBeDefined();
    });

    it('should return signing queue', () => {
      const signingQueue = adapter.getSigningQueue();
      expect(signingQueue).toBeDefined();
    });

    it('should return initialization flag', () => {
      expect(adapter.isInitializedFlag()).toBe(true);
    });
  });

  describe('Configuration Handling', () => {
    it('should handle empty EVM chains configuration', async () => {
      const config = { ...mockConfig, chains: { evm: [], solana: ['mainnet'] } };
      adapter = new ReownAdapter(config);
      await adapter.initialize();
      expect(adapter.isInitializedFlag()).toBe(true);
    });

    it('should handle empty Solana chains configuration', async () => {
      const config = { ...mockConfig, chains: { evm: ['mainnet'], solana: [] } };
      adapter = new ReownAdapter(config);
      await adapter.initialize();
      expect(adapter.isInitializedFlag()).toBe(true);
    });

    it('should register testnet chains when specified', async () => {
      const config = { ...mockConfig, chains: { evm: ['testnet'], solana: ['testnet'] } };
      adapter = new ReownAdapter(config);
      await adapter.initialize();

      const chainAdapter = adapter.getChainAdapter();
      const chains = chainAdapter?.getAllChains();
      expect(chains && chains.length > 0).toBe(true);
    });

    it('should register all chains when "all" is specified', async () => {
      const config = { ...mockConfig, chains: { evm: ['all'], solana: ['all'] } };
      adapter = new ReownAdapter(config);
      await adapter.initialize();

      const chainAdapter = adapter.getChainAdapter();
      const chains = chainAdapter?.getAllChains();
      expect(chains && chains.length > 0).toBe(true);
    });

    it('should use default chains when not specified', async () => {
      const config = { ...mockConfig };
      delete config.chains;
      adapter = new ReownAdapter(config);
      await adapter.initialize();

      const chainAdapter = adapter.getChainAdapter();
      const chains = chainAdapter?.getAllChains();
      expect(chains && chains.length > 0).toBe(true);
    });
  });

  describe('Interface Compliance', () => {
    it('should implement IReownAdapter interface', () => {
      adapter = new ReownAdapter(mockConfig);

      const requiredMethods: (keyof IReownAdapter)[] = [
        'initialize',
        'connect',
        'disconnect',
        'isConnected',
        'getActiveSessions',
        'switchChain',
        'getActiveChain',
        'signMessage',
        'signTransaction',
        'destroy'
      ];

      for (const method of requiredMethods) {
        expect(typeof (adapter as any)[method]).toBe('function');
      }
    });
  });

  describe('Error Recovery', () => {
    beforeEach(async () => {
      adapter = new ReownAdapter(mockConfig);
      await adapter.initialize();
    });

    it('should recover from initialization errors', async () => {
      await adapter.destroy();
      const newAdapter = new ReownAdapter(mockConfig);
      await expect(newAdapter.initialize()).resolves.not.toThrow();
    });

    it('should handle disconnect errors gracefully', async () => {
      const store = useSessionStore.getState();
      store.reset();
      await expect(adapter.disconnect()).resolves.not.toThrow();
    });

    it('should handle destroy errors gracefully', async () => {
      const manager = adapter.getWalletManager();
      if (manager) {
        jest.spyOn(manager, 'destroy').mockImplementationOnce(() => {
          throw new Error('Destroy error');
        });
      }
      await expect(adapter.destroy()).resolves.not.toThrow();
    });
  });

  describe('Concurrent Operations', () => {
    beforeEach(async () => {
      adapter = new ReownAdapter(mockConfig);
      await adapter.initialize();
    });

    it('should handle multiple initializations gracefully', async () => {
      const promise1 = adapter.initialize();
      const promise2 = adapter.initialize();
      const promise3 = adapter.initialize();

      await expect(Promise.all([promise1, promise2, promise3])).resolves.not.toThrow();
    });

    it('should handle concurrent connect calls', async () => {
      const promise1 = adapter.connect();
      const promise2 = adapter.connect();
      const promise3 = adapter.connect();

      const results = await Promise.all([promise1, promise2, promise3]);
      expect(results.length).toBe(3);
      expect(Array.isArray(results[0])).toBe(true);
    });
  });

  describe('Session Persistence', () => {
    beforeEach(async () => {
      adapter = new ReownAdapter(mockConfig);
      await adapter.initialize();
    });

    it('should maintain session state across adapter lifecycle', async () => {
      const store = useSessionStore.getState();
      const chainAdapter = adapter.getChainAdapter();
      const chains = chainAdapter?.getAllChains();

      if (chains && chains.length > 0) {
        store.addSession({
          id: 'test-session-1',
          topic: 'test-topic',
          peerName: 'Test Peer',
          peerMetadata: { name: 'Test Peer' },
          chainId: chains[0].id,
          chainNamespace: 'eip155',
          accounts: ['0x1234567890123456789012345678901234567890'],
          isApproved: true,
          createdAt: Date.now(),
          isActive: true
        });

        expect(adapter.getActiveSessions().length).toBe(1);
        const activeSessions = adapter.getActiveSessions();
        expect(activeSessions[0].id).toBe('test-session-1');
      }
    });

    it('should clear persistent sessions on destroy', async () => {
      const store = useSessionStore.getState();
      const chainAdapter = adapter.getChainAdapter();
      const chains = chainAdapter?.getAllChains();

      if (chains && chains.length > 0) {
        store.addSession({
          id: 'test-session-1',
          topic: 'test-topic',
          peerName: 'Test Peer',
          peerMetadata: { name: 'Test Peer' },
          chainId: chains[0].id,
          chainNamespace: 'eip155',
          accounts: ['0x1234567890123456789012345678901234567890'],
          isApproved: true,
          createdAt: Date.now(),
          isActive: true
        });

        await adapter.destroy();
        expect(useSessionStore.getState().getAllSessions().length).toBe(0);
      }
    });
  });
});
