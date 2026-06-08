import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { readFileSync } from 'fs';
import { join } from 'path';
import Redis from 'ioredis';
import { PubSub } from 'graphql-subscriptions';
import { PrismaClient } from '@prisma/client';
import logger from './utils/logger';
import { resolvers } from './resolvers';
import { createDataLoaders } from './dataloader';
import { createContext } from './middleware/auth';
import { GraphQLContext } from './types';
import { RpcManager } from './utils/rpc-manager';
import { CacheManager } from './utils/cache';
import { WalletService } from './services/wallet-service';
import { BalanceSyncService } from './services/balance-sync';
import { NFTService } from './services/nft-service';

const PORT = parseInt(process.env.WALLET_SUBGRAPH_PORT || '4001');
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    logger.info(`Starting Wallet Subgraph Service (Port ${PORT})...`);

    const typeDefs = readFileSync(join(__dirname, './schema.graphql'), 'utf-8');

    const prisma = new PrismaClient({
      log: NODE_ENV === 'development'
        ? ['info', 'warn', 'error']
        : ['error'],
    });

    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 1,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      enableReadyCheck: true,
      enableOfflineQueue: true,
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
    });

    redis.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
    });

    const rpcManager = new RpcManager();
    const cacheManager = new CacheManager(redis);
    const dataloaders = createDataLoaders(prisma, logger);
    const pubSub = new PubSub();

    const walletService = new WalletService(prisma, redis);
    const balanceSyncService = new BalanceSyncService(rpcManager, cacheManager, redis, prisma);
    const nftService = new NFTService(cacheManager, prisma);

    const server = new ApolloServer<GraphQLContext>({
      schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
      context: async ({ req }) => {
        const baseContext = await createContext(req, prisma, redis, rpcManager, logger);
        return {
          ...baseContext,
          dataloaders,
          pubSub,
          cacheManager,
          walletService,
          balanceSyncService,
          nftService,
        };
      },
      plugins: {
        async serverWillStart() {
          logger.info('Wallet Subgraph Apollo Server starting...');
        },
        async serverDidStart() {
          logger.info(`Wallet Subgraph listening on http://localhost:${PORT}`);
        },
      },
      formatError: (error) => {
        logger.error('GraphQL error', { error: error.message, extensions: error.extensions });
        return {
          message: error.message,
          extensions: {
            code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
          },
        };
      },
    });

    const { url } = await startStandaloneServer(server, {
      listen: { port: PORT },
    });

    logger.info(`Wallet Subgraph Service ready at ${url}`);

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      await server.stop();
      await prisma.$disconnect();
      redis.disconnect();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

startServer();
