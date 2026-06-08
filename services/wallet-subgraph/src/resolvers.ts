import { GraphQLError } from 'graphql';
import { PubSub } from 'graphql-subscriptions';
import {
  Wallet,
  Balance,
  NFT,
  WalletType,
  GraphQLContext,
  GasEstimate,
} from './types';
import { requireAuth, canAccessWallet } from './middleware/auth';
import { WalletService } from './services/wallet-service';
import { BalanceSyncService } from './services/balance-sync';
import { NFTService } from './services/nft-service';
import { CacheManager, CACHE_TTL } from './utils/cache';

interface ResolverContext extends GraphQLContext {
  dataloaders: any;
  pubSub: PubSub;
  cacheManager: CacheManager;
  walletService: WalletService;
  balanceSyncService: BalanceSyncService;
  nftService: NFTService;
}

export const resolvers = {
  Query: {
    async wallet(parent: any, args: { id: string }, context: ResolverContext) {
      try {
        requireAuth(context);
        const wallet = await context.dataloaders.walletById.load(args.id);

        if (!wallet) {
          throw new GraphQLError('Wallet not found');
        }

        if (!canAccessWallet(context, wallet.userId)) {
          throw new GraphQLError('Unauthorized');
        }

        return wallet;
      } catch (error) {
        context.logger.error('Error fetching wallet:', error);
        throw error;
      }
    },

    async wallets(parent: any, args: { userId: string }, context: ResolverContext) {
      try {
        requireAuth(context);

        if (!canAccessWallet(context, args.userId)) {
          throw new GraphQLError('Unauthorized');
        }

        return context.dataloaders.walletsByUserId.load(args.userId);
      } catch (error) {
        context.logger.error('Error fetching wallets:', error);
        throw error;
      }
    },

    async walletByAddress(
      parent: any,
      args: { address: string; chainId: string },
      context: ResolverContext
    ) {
      try {
        requireAuth(context);
        const cacheKey = `wallet:${args.address}:${args.chainId}`;
        const cached = await context.cacheManager.get<Wallet>(cacheKey);
        if (cached) return cached;

        const wallet = await context.prisma.wallet.findFirst({
          where: {
            address: args.address,
            chainType: args.chainId,
            userId: context.userId,
          },
        });

        if (!wallet) {
          throw new GraphQLError('Wallet not found');
        }

        await context.cacheManager.set(cacheKey, wallet, CACHE_TTL.WALLET);
        return wallet;
      } catch (error) {
        context.logger.error('Error fetching wallet by address:', error);
        throw error;
      }
    },

    async balances(parent: any, args: { walletId: string }, context: ResolverContext) {
      try {
        requireAuth(context);
        const wallet = await context.dataloaders.walletById.load(args.walletId);

        if (!wallet || !canAccessWallet(context, wallet.userId)) {
          throw new GraphQLError('Unauthorized');
        }

        const cacheKey = context.cacheManager.getBalanceCacheKey(args.walletId);
        const cached = await context.cacheManager.get<Balance[]>(cacheKey);
        if (cached) return cached;

        const balances = await context.dataloaders.balancesByWalletId.load(args.walletId);
        await context.cacheManager.set(cacheKey, balances, CACHE_TTL.BALANCES);
        return balances;
      } catch (error) {
        context.logger.error('Error fetching balances:', error);
        throw error;
      }
    },

    async balance(
      parent: any,
      args: { walletId: string; tokenAddress: string },
      context: ResolverContext
    ) {
      try {
        requireAuth(context);
        const wallet = await context.dataloaders.walletById.load(args.walletId);

        if (!wallet || !canAccessWallet(context, wallet.userId)) {
          throw new GraphQLError('Unauthorized');
        }

        const cacheKey = context.cacheManager.getBalanceCacheKey(
          args.walletId,
          args.tokenAddress
        );
        const cached = await context.cacheManager.get<Balance>(cacheKey);
        if (cached) return cached;

        const balance = await context.prisma.balance.findUnique({
          where: {
            walletId_tokenAddress: {
              walletId: args.walletId,
              tokenAddress: args.tokenAddress,
            },
          },
        });

        if (!balance) {
          throw new GraphQLError('Balance not found');
        }

        await context.cacheManager.set(cacheKey, balance, CACHE_TTL.BALANCES);
        return balance;
      } catch (error) {
        context.logger.error('Error fetching balance:', error);
        throw error;
      }
    },

    async totalPortfolioValue(parent: any, args: { userId: string }, context: ResolverContext) {
      try {
        requireAuth(context);

        if (!canAccessWallet(context, args.userId)) {
          throw new GraphQLError('Unauthorized');
        }

        return context.balanceSyncService.calculatePortfolioValue(args.userId);
      } catch (error) {
        context.logger.error('Error calculating portfolio value:', error);
        throw error;
      }
    },

    async nfts(
      parent: any,
      args: { walletId: string; chainId?: string },
      context: ResolverContext
    ) {
      try {
        requireAuth(context);
        const wallet = await context.dataloaders.walletById.load(args.walletId);

        if (!wallet || !canAccessWallet(context, wallet.userId)) {
          throw new GraphQLError('Unauthorized');
        }

        const cacheKey = context.cacheManager.getNFTsCacheKey(args.walletId, args.chainId);
        const cached = await context.cacheManager.get<NFT[]>(cacheKey);
        if (cached) return cached;

        if (args.chainId) {
          return context.nftService.fetchNFTs(args.walletId, wallet.address, args.chainId);
        }

        return context.nftService.fetchAllNFTs(args.walletId, wallet.address);
      } catch (error) {
        context.logger.error('Error fetching NFTs:', error);
        throw error;
      }
    },

    async estimateGas(
      parent: any,
      args: {
        chainId: string;
        from: string;
        to: string;
        amount: string;
        tokenAddress: string;
      },
      context: ResolverContext
    ): Promise<GasEstimate> {
      try {
        const cacheKey = context.cacheManager.getGasEstimateCacheKey(args.chainId, args.from, args.to);
        const cached = await context.cacheManager.get<GasEstimate>(cacheKey);
        if (cached) return cached;

        const gasPrice = await context.rpcManager.getGasPrice(args.chainId);
        const gasLimit = '21000';
        const estimatedFee = (BigInt(gasPrice) * BigInt(gasLimit)).toString();
        const estimatedFeeUSD = parseFloat(estimatedFee) / 1e18 * 100;

        const estimate: GasEstimate = {
          chainId: args.chainId,
          gasPrice,
          gasLimit,
          estimatedFee,
          estimatedFeeUSD,
        };

        await context.cacheManager.set(cacheKey, estimate, CACHE_TTL.GAS_ESTIMATE);
        return estimate;
      } catch (error) {
        context.logger.error('Error estimating gas:', error);
        throw error;
      }
    },
  },

  Mutation: {
    async createWallet(
      parent: any,
      args: { chainId: string; type: WalletType },
      context: ResolverContext
    ): Promise<Wallet> {
      try {
        requireAuth(context);
        return context.walletService.createWallet(context.userId!, args.chainId, args.type);
      } catch (error) {
        context.logger.error('Error creating wallet:', error);
        throw error;
      }
    },

    async importWallet(
      parent: any,
      args: { chainId: string; privateKey: string },
      context: ResolverContext
    ): Promise<Wallet> {
      try {
        requireAuth(context);
        return context.walletService.importWallet(context.userId!, args.chainId, args.privateKey);
      } catch (error) {
        context.logger.error('Error importing wallet:', error);
        throw error;
      }
    },

    async connectExternalWallet(
      parent: any,
      args: { provider: string; address: string; signature: string },
      context: ResolverContext
    ): Promise<Wallet> {
      try {
        requireAuth(context);
        return context.walletService.connectExternalWallet(
          context.userId!,
          args.provider,
          args.address,
          args.signature
        );
      } catch (error) {
        context.logger.error('Error connecting external wallet:', error);
        throw error;
      }
    },

    async syncWalletBalances(
      parent: any,
      args: { walletId: string },
      context: ResolverContext
    ): Promise<Balance[]> {
      try {
        requireAuth(context);
        const wallet = await context.dataloaders.walletById.load(args.walletId);

        if (!wallet || !canAccessWallet(context, wallet.userId)) {
          throw new GraphQLError('Unauthorized');
        }

        const balances = await context.balanceSyncService.syncWalletBalances(
          wallet.id,
          wallet.userId,
          wallet.chainType,
          wallet.address
        );

        context.pubSub?.publish('BALANCE_UPDATED', {
          balanceUpdated: balances[0],
        });

        return balances;
      } catch (error) {
        context.logger.error('Error syncing wallet balances:', error);
        throw error;
      }
    },

    async deleteWallet(
      parent: any,
      args: { walletId: string },
      context: ResolverContext
    ): Promise<boolean> {
      try {
        requireAuth(context);
        return context.walletService.deleteWallet(args.walletId, context.userId!);
      } catch (error) {
        context.logger.error('Error deleting wallet:', error);
        throw error;
      }
    },
  },

  Subscription: {
    balanceUpdated: {
      subscribe: (parent: any, args: { walletId: string }, context: ResolverContext) => {
        requireAuth(context);
        return context.pubSub.asyncIterator([`BALANCE_UPDATED:${args.walletId}`]);
      },
    },

    walletSynced: {
      subscribe: (parent: any, args: { walletId: string }, context: ResolverContext) => {
        requireAuth(context);
        return context.pubSub.asyncIterator([`WALLET_SYNCED:${args.walletId}`]);
      },
    },
  },

  Wallet: {
    async balances(parent: Wallet, args: any, context: ResolverContext) {
      return context.dataloaders.balancesByWalletId.load(parent.id);
    },

    async nfts(parent: Wallet, args: any, context: ResolverContext) {
      return context.dataloaders.nftsByWalletId.load(parent.id);
    },
  },
};
