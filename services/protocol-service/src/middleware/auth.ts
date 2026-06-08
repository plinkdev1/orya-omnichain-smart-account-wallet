import { Request } from 'express';
import * as admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import { GraphQLContext, JWTPayload } from '../types';

export async function createContext(
  req: Request,
  prisma: any,
  redis: any,
  logger: any
): Promise<Partial<GraphQLContext>> {
  const context: Partial<GraphQLContext> = {
    req,
    prisma,
    redis,
    logger,
  };

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.debug('No authorization header');
      return context;
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const decodedFirebase = await admin.auth().verifyIdToken(token);

      const user = await prisma.user.findUnique({
        where: { firebaseUid: decodedFirebase.uid },
        include: { preferences: true },
      });

      if (user) {
        context.user = user;
        context.userId = user.id;
        logger.debug('Firebase auth successful', { userId: user.id });
      }
    } catch (firebaseError) {
      try {
        const decodedJWT = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload;

        const user = await prisma.user.findUnique({
          where: { id: decodedJWT.userId },
          include: { preferences: true },
        });

        if (user) {
          context.user = user;
          context.userId = user.id;
          logger.debug('JWT auth successful', { userId: user.id });
        }
      } catch (jwtError) {
        logger.warn('Token verification failed', { error: (jwtError as Error).message });
      }
    }
  } catch (error) {
    logger.error('Context creation error', { error: (error as Error).message });
  }

  return context;
}
