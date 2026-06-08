import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { GraphQLContext, JWTPayload } from '../types';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export async function createContext(
  req: Request,
  prisma: any,
  redis: any,
  rpcManager: any,
  logger: any
): Promise<Omit<GraphQLContext, 'dataloaders'>> {
  const context: Omit<GraphQLContext, 'dataloaders'> = {
    req,
    prisma,
    redis,
    logger,
    rpcManager,
    user: null,
    userId: null,
  };

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return context;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (user) {
      context.user = user;
      context.userId = user.id;
    }
  } catch (error) {
    logger.warn('Invalid JWT token:', { error: (error as Error).message });
  }

  return context;
}

export function requireAuth(context: GraphQLContext): void {
  if (!context.userId) {
    throw new Error('Authentication required');
  }
}

export function canAccessWallet(context: GraphQLContext, walletUserId: string): boolean {
  if (!context.userId) {
    return false;
  }
  return context.userId === walletUserId;
}

export function generateAccessToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}
