import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolvers } from './resolvers';
import { WalletType, GraphQLContext } from './types';

describe('Wallet Resolvers', () => {
  let mockContext: Partial<GraphQLContext>;

  beforeEach(() => {
    mockContext = {
      userId: 'user-1',
      logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      dataloaders: {
        walletById: {
          load: vi.fn(),
        },
        walletsByUserId: {
          load: vi.fn(),
        },
        balancesByWalletId: {
          load: vi.fn(),
        },
        nftsByWalletId: {
          load: vi.fn(),
        },
      },
      prisma: {
        wallet: {
          findUnique: vi.fn(),
          findFirst: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        },
        balance: {
          findUnique: vi.fn(),
          findMany: vi.fn(),
          deleteMany: vi.fn(),
        },
        nft: {
          deleteMany: vi.fn(),
        },
      },
      redis: {
        publish: vi.fn(),
        get: vi.fn(),
        setex: vi.fn(),
      },
      cacheManager: {
        get: vi.fn(),
        set: vi.fn(),
        getBalanceCacheKey: vi.fn(),
        getNFTsCacheKey: vi.fn(),
        getWalletCacheKey: vi.fn(),
        getGasEstimateCacheKey: vi.fn(),
      },
      walletService: {
        createWallet: vi.fn(),
        importWallet: vi.fn(),
        connectExternalWallet: vi.fn(),
        deleteWallet: vi.fn(),
      },
      balanceSyncService: {
        syncWalletBalances: vi.fn(),
        calculatePortfolioValue: vi.fn(),
      },
      nftService: {
        fetchNFTs: vi.fn(),
        fetchAllNFTs: vi.fn(),
      },
      pubSub: {
        asyncIterator: vi.fn(),
      },
    };
  });

  describe('Query.wallet', () => {
    it('should return a wallet for authenticated user', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        address: '0x123',
        chainType: 'ethereum',
        type: WalletType.EXTERNAL,
      };

      mockContext.dataloaders!.walletById.load = vi
        .fn()
        .mockResolvedValue(mockWallet);

      const result = await resolvers.Query.wallet(
        null,
        { id: 'wallet-1' },
        mockContext as GraphQLContext
      );

      expect(result).toEqual(mockWallet);
    });

    it('should throw error if wallet not found', async () => {
      mockContext.dataloaders!.walletById.load = vi.fn().mockResolvedValue(null);

      await expect(
        resolvers.Query.wallet(
          null,
          { id: 'wallet-1' },
          mockContext as GraphQLContext
        )
      ).rejects.toThrow('Wallet not found');
    });

    it('should throw error if user is not authenticated', async () => {
      mockContext.userId = null;

      await expect(
        resolvers.Query.wallet(
          null,
          { id: 'wallet-1' },
          mockContext as GraphQLContext
        )
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('Query.wallets', () => {
    it('should return wallets for user', async () => {
      const mockWallets = [
        {
          id: 'wallet-1',
          userId: 'user-1',
          address: '0x123',
          chainType: 'ethereum',
        },
        {
          id: 'wallet-2',
          userId: 'user-1',
          address: '0x456',
          chainType: 'polygon',
        },
      ];

      mockContext.dataloaders!.walletsByUserId.load = vi
        .fn()
        .mockResolvedValue(mockWallets);

      const result = await resolvers.Query.wallets(
        null,
        { userId: 'user-1' },
        mockContext as GraphQLContext
      );

      expect(result).toEqual(mockWallets);
    });

    it('should throw error if user tries to access other users wallets', async () => {
      mockContext.dataloaders!.walletsByUserId.load = vi.fn();

      await expect(
        resolvers.Query.wallets(
          null,
          { userId: 'other-user' },
          mockContext as GraphQLContext
        )
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('Query.balances', () => {
    it('should return balances for wallet', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        address: '0x123',
        chainType: 'ethereum',
      };

      const mockBalances = [
        {
          walletId: 'wallet-1',
          tokenAddress: 'native',
          symbol: 'ETH',
          decimals: 18,
          amount: '1.5',
          amountUSD: 2500,
        },
      ];

      mockContext.dataloaders!.walletById.load = vi
        .fn()
        .mockResolvedValue(mockWallet);
      mockContext.dataloaders!.balancesByWalletId.load = vi
        .fn()
        .mockResolvedValue(mockBalances);
      mockContext.cacheManager!.get = vi.fn().mockResolvedValue(null);
      mockContext.cacheManager!.set = vi.fn();
      mockContext.cacheManager!.getBalanceCacheKey = vi
        .fn()
        .mockReturnValue('balances:wallet-1');

      const result = await resolvers.Query.balances(
        null,
        { walletId: 'wallet-1' },
        mockContext as GraphQLContext
      );

      expect(result).toEqual(mockBalances);
    });
  });

  describe('Mutation.createWallet', () => {
    it('should create a new wallet', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        address: '0x789',
        chainType: 'ethereum',
        type: WalletType.MPC,
      };

      mockContext.walletService!.createWallet = vi
        .fn()
        .mockResolvedValue(mockWallet);

      const result = await resolvers.Mutation.createWallet(
        null,
        { chainId: 'ethereum', type: WalletType.MPC },
        mockContext as GraphQLContext
      );

      expect(result).toEqual(mockWallet);
      expect(mockContext.walletService!.createWallet).toHaveBeenCalledWith(
        'user-1',
        'ethereum',
        WalletType.MPC
      );
    });

    it('should throw error if not authenticated', async () => {
      mockContext.userId = null;

      await expect(
        resolvers.Mutation.createWallet(
          null,
          { chainId: 'ethereum', type: WalletType.MPC },
          mockContext as GraphQLContext
        )
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('Mutation.deleteWallet', () => {
    it('should delete wallet', async () => {
      mockContext.walletService!.deleteWallet = vi.fn().mockResolvedValue(true);

      const result = await resolvers.Mutation.deleteWallet(
        null,
        { walletId: 'wallet-1' },
        mockContext as GraphQLContext
      );

      expect(result).toBe(true);
      expect(mockContext.walletService!.deleteWallet).toHaveBeenCalledWith(
        'wallet-1',
        'user-1'
      );
    });
  });
});
