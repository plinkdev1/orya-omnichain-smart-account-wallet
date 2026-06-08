/**
 * React Hook: Google Authentication
 * Manages Google Sign-In and session state
 */

import { useCallback, useEffect, useState } from 'react';
import {
    getGoogleAuthService,
    GoogleAuthService,
    GoogleAuthUser,
} from '../auth/GoogleAuthService';

export interface UseGoogleAuthReturn {
  user: GoogleAuthUser | null;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: (idToken: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  isAuthenticated: boolean;
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const [user, setUser] = useState<GoogleAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authService, setAuthService] = useState<GoogleAuthService | null>(null);

  // Initialize auth service on mount
  useEffect(() => {
    try {
      const service = getGoogleAuthService();
      setAuthService(service);

      // Get current user
      const currentUser = service.getCurrentUser();
      setUser(currentUser);

      // Subscribe to changes
      const unsubscribe = service.onAuthStateChanged((newUser) => {
        setUser(newUser);
      });

      setIsLoading(false);

      return unsubscribe;
    } catch (err: any) {
      setError(err.message || 'Failed to initialize auth service');
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(
    async (idToken: string) => {
      if (!authService) {
        setError('Auth service not initialized');
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await authService.signInWithGoogle(idToken);

        if (result.success) {
          setUser(result.user || null);
          return true;
        } else {
          setError(result.error || 'Sign in failed');
          return false;
        }
      } catch (err: any) {
        setError(err.message || 'Sign in failed');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [authService]
  );

  const signOut = useCallback(async () => {
    if (!authService) {
      setError('Auth service not initialized');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await authService.signOut();
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Sign out failed');
    } finally {
      setIsLoading(false);
    }
  }, [authService]);

  const getIdToken = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!authService) return null;

      try {
        return await authService.getIdToken(forceRefresh);
      } catch (err) {
        console.error('Failed to get ID token:', err);
        return null;
      }
    },
    [authService]
  );

  return {
    user,
    isLoading,
    error,
    signInWithGoogle,
    signOut,
    getIdToken,
    isAuthenticated: user !== null,
  };
}