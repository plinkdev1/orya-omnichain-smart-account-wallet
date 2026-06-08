import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import { GraphQLContext, JWTPayload } from '../types';
import { Logger } from 'pino';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

export interface AuthRequest {
  req: any;
}

export async function authenticateRequest(
  req: any,
  logger: Logger
): Promise<string | null> {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader) {
      return null;
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      return decoded.userId;
    } catch (error) {
      logger.warn('JWT verification failed', { error: (error as Error).message });
      return null;
    }
  } catch (error) {
    logger.error('Authentication error', { error });
    return null;
  }
}

export async function validateFirebaseToken(
  token: string,
  logger: Logger
): Promise<any> {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    logger.warn('Firebase token verification failed', { error });
    return null;
  }
}

export function generateAccessToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY, algorithm: 'HS256' }
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '7d', algorithm: 'HS256' }
  );
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function createContext(
  req: any,
  prisma: any,
  redis: any,
  logger: Logger
): Promise<Partial<GraphQLContext>> {
  const userId = await authenticateRequest(req, logger);

  let user = null;
  if (userId) {
    const cacheKey = `user:${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      user = JSON.parse(cached);
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          preferences: {
            include: {
              autoSigning: true,
            },
          },
        },
      });
      if (user) {
        await redis.setex(cacheKey, 300, JSON.stringify(user));
      }
    }
  }

  return {
    user,
    userId,
    req,
    prisma,
    redis,
    logger,
  };
}

export function requireAuth(context: GraphQLContext): string {
  if (!context.userId) {
    throw new Error('Unauthorized: Authentication required');
  }
  return context.userId;
}

export function requireAdmin(context: GraphQLContext): string {
  if (!context.userId) {
    throw new Error('Unauthorized: Authentication required');
  }

  if (context.user?.email && !isAdminEmail(context.user.email)) {
    throw new Error('Forbidden: Admin access required');
  }

  return context.userId;
}

export function canAccessUserData(context: GraphQLContext, userId: string): boolean {
  if (!context.userId) return false;
  if (isAdminEmail(context.user?.email)) return true;
  return context.userId === userId;
}

function isAdminEmail(email?: string): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
  return adminEmails.includes(email);
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}
