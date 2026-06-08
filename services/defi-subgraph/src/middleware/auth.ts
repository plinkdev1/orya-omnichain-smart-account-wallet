import type { GraphQLContext } from '../types';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

export async function authMiddleware(context: GraphQLContext): Promise<void> {
  const authHeader = context.headers?.authorization;

  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    throw new Error('Missing authorization token');
  }

  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const payload = jwt.verify(token, secret) as AuthPayload;

    context.user = {
      id: payload.sub,
    };

    logger.debug({ userId: payload.sub }, 'User authenticated');
  } catch (error) {
    logger.error({ error }, 'Authentication failed');
    throw new Error('Invalid authorization token');
  }
}

export function createAuthContext(
  userId: string,
  context: Partial<GraphQLContext>
): GraphQLContext {
  return {
    user: { id: userId },
    ...context,
  } as GraphQLContext;
}
