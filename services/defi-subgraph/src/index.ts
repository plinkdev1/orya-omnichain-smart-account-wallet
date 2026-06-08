import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';
import { resolvers } from './resolvers';
import type { GraphQLContext } from './types';
import { logger } from './utils/logger';
import { ProtocolAdapterRegistry } from './utils/protocol-adapter-registry';

const PORT = process.env.DEFI_SUBGRAPH_PORT || 4005;
const DATABASE_URL = process.env.DATABASE_URL;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function startServer() {
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL,
        },
      },
    });

    const redis = new Redis(REDIS_URL);

    redis.on('error', (error) => {
      logger.error({ error }, 'Redis connection error');
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
    });

    const protocolAdapters = new ProtocolAdapterRegistry();

    const schemaPath = join(__dirname, 'schema.graphql');
    const typeDefs = gql(readFileSync(schemaPath, 'utf8'));

    const server = new ApolloServer<GraphQLContext>({
      schema: buildSubgraphSchema({
        typeDefs,
        resolvers,
      }),
      introspection: true,
    });

    const { url } = await startStandaloneServer(server, {
      listen: { port: Number(PORT) },
      context: async () => ({
        prisma,
        redis,
        logger,
        protocolAdapters,
      }) as GraphQLContext,
    });

    logger.info(`🚀 DeFi Subgraph running at ${url}`);
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
