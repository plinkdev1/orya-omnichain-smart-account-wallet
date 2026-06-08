import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { GraphQLContext, TransactionRecord } from './types';
import { resolvers } from './resolvers';

describe('Transaction Resolvers', () => {
  let mockContext: GraphQLContext;

  beforeEach(() => {
    mockContext = {
      user: {
        id: 'user-1',
        walletId: 'wallet-1',
        email: 'test@example.com',
      },
      prisma: {} as any,
      redis: {} as any,
      dataloaders: {
        userLoader: {
          load: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@example.com' }),
        },
        walletLoader: {
          load: vi.fn().mockResolvedValue({ id: 'wallet-1' }),
        },
        transactionLoader: {
          load: vi.fn(),
        },
      },
      pubSub: {} as any,
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      } as any,
      rpcManager: {
        getGasPrice: vi.fn().mockResolvedValue('1000'),
      } as any,
      cacheManager: {} as any,
      protocolRouter: {
        getProtocol: vi.fn().mockResolvedValue({
          protocolId: 'aftermath-swap',
          metadata: {
            name: 'Aftermath Finance',
            id: 'aftermath-swap',
            chainId: 'sui',
            type: 'swap',
          },
          isPreferred: true,
          isFallback: false,
        }),
        getBestProtocolForIntent: vi.fn(),
        executeWithFailover: vi.fn(),
        getProtocolQuote: vi.fn(),
        executeProtocolSwap: vi.fn(),
        invalidateProtocolCache: vi.fn(),
      } as any,
      transactionService: {
        getTransaction: vi.fn(),
        getTransactions: vi.fn(),
        createTransaction: vi.fn(),
        updateTransactionStatus: vi.fn(),
        cancelTransaction: vi.fn(),
        startMonitoring: vi.fn(),
        publishTransactionEvent: vi.fn(),
      } as any,
      session: {
        lastAuthTime: new Date(),
      },
    };
  });

  describe('Query.transaction', () => {
    it('should fetch a single transaction', async () => {
      const mockTx: TransactionRecord = {
        id: 'tx-1',
        userId: 'user-1',
        walletId: 'wallet-1',
        chainId: 'ethereum',
        type: 'SWAP',
        status: 'PENDING',
        fromAddress: 'user-1',
        toAddress: 'token-address',
        amount: '1000000000000000000',
        tokenSymbol: 'ETH',
        tokenAddress: '0x...',
        protocol: 'uniswap',
        fee: '0',
        feeUSD: 0,
        createdAt: new Date(),
      };

      mockContext.transactionService.getTransaction = vi.fn().mockResolvedValue(mockTx);

      const result = await resolvers.Query.transaction(null, { id: 'tx-1' }, mockContext);

      expect(result).toEqual(mockTx);
      expect(mockContext.transactionService.getTransaction).toHaveBeenCalledWith('tx-1');
    });

    it('should throw error if not authenticated', async () => {
      mockContext.user = null;

      await expect(
        resolvers.Query.transaction(null, { id: 'tx-1' }, mockContext)
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('Query.transactions', () => {
    it('should fetch multiple transactions with pagination', async () => {
      const mockTxs = [
        {
          id: 'tx-1',
          userId: 'user-1',
          walletId: 'wallet-1',
          type: 'SWAP',
          status: 'PENDING',
          createdAt: new Date(),
        } as TransactionRecord,
      ];

      mockContext.transactionService.getTransactions = vi
        .fn()
        .mockResolvedValue({ transactions: mockTxs, total: 1 });

      const result = await resolvers.Query.transactions(
        null,
        {
          userId: 'user-1',
          pagination: { first: 10 },
        },
        mockContext
      );

      expect(result.edges).toHaveLength(1);
      expect(result.pageInfo.totalCount).toBe(1);
      expect(mockContext.transactionService.getTransactions).toHaveBeenCalled();
    });
  });

  describe('Query.estimateGas', () => {
    it('should estimate gas for transaction', async () => {
      const result = await resolvers.Query.estimateGas(
        null,
        {
          chainId: 'ethereum',
          from: '0x...',
          to: '0x...',
          amount: '1000000000000000000',
          tokenAddress: '0x...',
        },
        mockContext
      );

      expect(result.chainId).toBe('ethereum');
      expect(result.gasPrice).toBe('1000');
      expect(result.gasLimit).toBe('21000');
      expect(mockContext.rpcManager.getGasPrice).toHaveBeenCalledWith('ethereum');
    });
  });

  describe('Query.swapQuote', () => {
    it('should get swap quote from protocol', async () => {
      const mockQuote = {
        fromAmount: '1000000000000000000',
        toAmount: '3000000000000000000',
        minAmountOut: '2900000000000000000',
        priceImpact: 0.01,
        estimatedGas: '100000',
        estimatedGasUSD: 50,
        route: [],
        validUntil: new Date(),
        metadata: {},
      };

      mockContext.protocolRouter.getProtocolQuote = vi.fn().mockResolvedValue(mockQuote);

      const result = await resolvers.Query.swapQuote(
        null,
        {
          chainId: 'ethereum',
          fromToken: 'ETH',
          toToken: 'USDC',
          amount: '1000000000000000000',
          slippage: 0.01,
        },
        mockContext
      );

      expect(result.fromToken).toBe('ETH');
      expect(result.toToken).toBe('USDC');
      expect(result.protocol).toBe('Aftermath Finance');
    });
  });

  describe('Mutation.executeSwap', () => {
    it('should execute direct swap', async () => {
      const mockQuote = {
        fromAmount: '1000000000000000000',
        toAmount: '3000000000000000000',
        minAmountOut: '2900000000000000000',
        priceImpact: 0.01,
        estimatedGas: '100000',
        estimatedGasUSD: 50,
        route: [],
        validUntil: new Date(),
        metadata: {},
      };

      const mockResult = {
        transactionHash: '0x123',
        status: 'pending',
        fromAmount: '1000000000000000000',
        toAmount: '3000000000000000000',
        actualPriceImpact: 0.01,
        gasUsed: '100000',
      };

      mockContext.protocolRouter.getProtocolQuote = vi.fn().mockResolvedValue(mockQuote);
      mockContext.protocolRouter.executeProtocolSwap = vi.fn().mockResolvedValue(mockResult);
      mockContext.transactionService.createTransaction = vi.fn().mockResolvedValue({
        id: 'tx-1',
        hash: '0x123',
      });

      const result = await resolvers.Mutation.executeSwap(
        null,
        {
          chainId: 'ethereum',
          fromToken: 'ETH',
          toToken: 'USDC',
          amount: '1000000000000000000',
          slippage: 0.01,
        },
        mockContext
      );

      expect(result.id).toBe('tx-1');
      expect(mockContext.transactionService.createTransaction).toHaveBeenCalled();
      expect(mockContext.transactionService.publishTransactionEvent).toHaveBeenCalledWith(
        'created',
        expect.objectContaining({ type: 'SWAP' })
      );
    });
  });

  describe('Mutation.cancelTransaction', () => {
    it('should cancel pending transaction', async () => {
      const mockCancelledTx: TransactionRecord = {
        id: 'tx-1',
        userId: 'user-1',
        walletId: 'wallet-1',
        status: 'CANCELLED',
        type: 'SWAP',
        chainId: 'ethereum',
        fromAddress: 'user-1',
        toAddress: 'token',
        amount: '1000',
        tokenSymbol: 'ETH',
        tokenAddress: '0x...',
        protocol: 'uniswap',
        fee: '0',
        feeUSD: 0,
        createdAt: new Date(),
      };

      mockContext.transactionService.cancelTransaction = vi.fn().mockResolvedValue(mockCancelledTx);

      const result = await resolvers.Mutation.cancelTransaction(
        null,
        { id: 'tx-1' },
        mockContext
      );

      expect(result.status).toBe('CANCELLED');
      expect(mockContext.transactionService.publishTransactionEvent).toHaveBeenCalledWith(
        'cancelled',
        expect.any(Object)
      );
    });
  });

  describe('Mutation.sendTokens', () => {
    it('should create send transaction', async () => {
      const mockTx: TransactionRecord = {
        id: 'tx-1',
        userId: 'user-1',
        walletId: 'wallet-1',
        type: 'SEND',
        status: 'PENDING',
        chainId: 'ethereum',
        fromAddress: 'user-1',
        toAddress: '0xrecipient',
        amount: '1000000000000000000',
        tokenSymbol: 'ETH',
        tokenAddress: '0x...',
        protocol: 'direct',
        fee: '0',
        feeUSD: 0,
        createdAt: new Date(),
      };

      mockContext.transactionService.createTransaction = vi.fn().mockResolvedValue(mockTx);

      const result = await resolvers.Mutation.sendTokens(
        null,
        {
          walletId: 'wallet-1',
          toAddress: '0xrecipient',
          amount: '1000000000000000000',
          tokenAddress: '0x...',
        },
        mockContext
      );

      expect(result.type).toBe('SEND');
      expect(result.status).toBe('PENDING');
    });
  });

  describe('Mutation.initiateSwap', () => {
    it('should execute intent-based swap with failover', async () => {
      const mockResult = {
        transactionHash: '0x123',
        status: 'pending',
        fromAmount: '1000000000000000000',
        toAmount: '3000000000000000000',
        actualPriceImpact: 0.01,
      };

      mockContext.protocolRouter.getBestProtocolForIntent = vi.fn().mockResolvedValue({
        protocolId: 'aftermath-swap',
        metadata: {
          name: 'Aftermath Finance',
          id: 'aftermath-swap',
          chainId: 'sui',
          type: 'swap',
        },
        isPreferred: true,
        isFallback: false,
      });

      mockContext.protocolRouter.executeWithFailover = vi.fn().mockResolvedValue(mockResult);
      mockContext.transactionService.createTransaction = vi.fn().mockResolvedValue({
        id: 'tx-1',
        hash: '0x123',
        type: 'SWAP',
      });

      const result = await resolvers.Mutation.initiateSwap(
        null,
        {
          intent: {
            chainId: 'sui',
            inputToken: 'SUI',
            outputToken: 'USDC',
            amount: '1000000000',
            minOutputAmount: '900000000',
            maxSlippage: 0.01,
            deadline: new Date(),
            routingPreference: 'BEST_PRICE',
          },
        },
        mockContext
      );

      expect(result.id).toBe('tx-1');
      expect(mockContext.protocolRouter.executeWithFailover).toHaveBeenCalled();
    });
  });

  describe('Mutation.initiateBridge', () => {
    it('should create bridge transaction', async () => {
      const mockTx: TransactionRecord = {
        id: 'tx-1',
        userId: 'user-1',
        walletId: 'wallet-1',
        type: 'BRIDGE',
        status: 'PENDING',
        chainId: 'ethereum',
        fromAddress: 'user-1',
        toAddress: 'base',
        amount: '1000000000000000000',
        tokenSymbol: 'ETH',
        tokenAddress: '0x...',
        protocol: 'bridge-aggregator',
        fee: '0',
        feeUSD: 0,
        createdAt: new Date(),
      };

      mockContext.transactionService.createTransaction = vi.fn().mockResolvedValue(mockTx);

      const result = await resolvers.Mutation.initiateBridge(
        null,
        {
          intent: {
            sourceChainId: 'ethereum',
            destinationChainId: 'base',
            token: 'ETH',
            amount: '1000000000000000000',
            minReceiveAmount: '990000000000000000',
            deadline: new Date(),
          },
        },
        mockContext
      );

      expect(result.type).toBe('BRIDGE');
      expect(result.status).toBe('PENDING');
    });
  });
});
