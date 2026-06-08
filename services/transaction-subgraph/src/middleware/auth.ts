import type { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';
import type { Logger } from 'pino';
import type { RpcManager } from '../utils/rpc-manager';
import type { GraphQLContext } from '../types';

interface DecodedToken {
  sub: string;
  email: string;
  walletId: string;
  iat: number;
  exp: number;
}

export async function createContext(
  req: IncomingMessage,
  prisma: PrismaClient,
  redis: Redis,
  rpcManager: RpcManager,
  logger: Logger
): Promise<Partial<GraphQLContext>> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      prisma,
      redis,
      logger,
      rpcManager,
      session: null,
    };
  }

  try {
    const token = authHeader.slice(7);
    const secret = process.env.JWT_SECRET || 'dev-secret';

    const decoded = jwt.verify(token, secret) as DecodedToken;

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { preferences: true },
    });

    if (!user) {
      logger.warn('User from token not found', { userId: decoded.sub });
      return {
        user: null,
        prisma,
        redis,
        logger,
        rpcManager,
        session: null,
      };
    }

    const wallet = await prisma.wallet.findUnique({
      where: { id: decoded.walletId || user.id },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        walletId: wallet?.id || user.id,
      },
      prisma,
      redis,
      logger,
      rpcManager,
      session: {
        lastAuthTime: new Date(),
      },
    };
  } catch (error) {
    logger.warn('Auth verification failed', { error: (error as Error).message });
    return {
      user: null,
      prisma,
      redis,
      logger,
      rpcManager,
      session: null,
    };
  }
}

export function requireAuth(context: GraphQLContext): void {
  if (!context.user) {
    throw new Error('Unauthorized');
  }
}
