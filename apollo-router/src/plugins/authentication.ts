import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface AuthContext {
  userId?: string;
  email?: string;
  roles: string[];
  isAuthenticated: boolean;
}

export class AuthenticationPlugin {
  private jwtSecret: string;
  private firebaseApp: admin.app.App;
  private publicKeys: Map<string, string> = new Map();

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    if (process.env.FIREBASE_PROJECT_ID) {
      this.firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }

    this.loadPublicKeys();
  }

  private async loadPublicKeys(): Promise<void> {
    try {
      const response = await fetch('https://firebaseauth.googleapis.com/v1/jwks');
      const data = await response.json();
      
      if (data.keys) {
        data.keys.forEach((key: any) => {
          this.publicKeys.set(key.kid, key);
        });
      }
    } catch (error) {
      console.error('Failed to load Firebase public keys:', error);
    }
  }

  async authenticate(req: Request): Promise<AuthContext> {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return {
        roles: [],
        isAuthenticated: false,
      };
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return {
        roles: [],
        isAuthenticated: false,
      };
    }

    try {
      return await this.validateToken(token);
    } catch (error) {
      console.error('Token validation failed:', error);
      return {
        roles: [],
        isAuthenticated: false,
      };
    }
  }

  private async validateToken(token: string): Promise<AuthContext> {
    try {
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded) {
        throw new Error('Invalid token format');
      }

      const header = decoded.header;
      const payload = decoded.payload as JwtPayload;

      if (header.alg === 'RS256') {
        return await this.validateFirebaseToken(token, payload);
      } else if (header.alg === 'HS256') {
        return this.validateJWTToken(token, payload);
      }

      throw new Error('Unsupported algorithm');
    } catch (error) {
      throw new Error(`Token validation failed: ${error}`);
    }
  }

  private async validateFirebaseToken(
    token: string,
    payload: JwtPayload
  ): Promise<AuthContext> {
    try {
      if (!this.firebaseApp) {
        throw new Error('Firebase not initialized');
      }

      const decodedToken = await admin.auth(this.firebaseApp).verifyIdToken(token);

      return {
        userId: decodedToken.uid,
        email: decodedToken.email,
        roles: decodedToken.roles || [],
        isAuthenticated: true,
      };
    } catch (error) {
      throw new Error(`Firebase token validation failed: ${error}`);
    }
  }

  private validateJWTToken(token: string, payload: JwtPayload): AuthContext {
    try {
      const verified = jwt.verify(token, this.jwtSecret) as JwtPayload;

      return {
        userId: verified.sub as string,
        email: verified.email as string,
        roles: verified.roles || [],
        isAuthenticated: true,
      };
    } catch (error) {
      throw new Error(`JWT validation failed: ${error}`);
    }
  }

  isAuthorized(context: AuthContext, requiredRoles?: string[]): boolean {
    if (!context.isAuthenticated) {
      return false;
    }

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    return requiredRoles.some((role) => context.roles.includes(role));
  }

  requireAuth(context: AuthContext): void {
    if (!context.isAuthenticated) {
      throw new Error('Authentication required');
    }
  }

  requireRole(context: AuthContext, role: string): void {
    if (!context.isAuthenticated) {
      throw new Error('Authentication required');
    }

    if (!context.roles.includes(role)) {
      throw new Error(`Role '${role}' required`);
    }
  }
}

export const authPlugin = new AuthenticationPlugin();
