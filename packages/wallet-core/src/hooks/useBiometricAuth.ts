/**
 * React Hook: Biometric Authentication
 * Manages WebAuthn/FIDO2 fingerprint and face recognition
 */

import { useCallback, useEffect, useState } from 'react';
import {
    BiometricAuthService,
    BiometricCredential,
    getBiometricAuthService,
} from '../auth/BiometricAuthService';

export interface UseBiometricAuthReturn {
  isAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  credentials: BiometricCredential[];
  register: (
    userName: string,
    userEmail: string,
    userId: string
  ) => Promise<boolean>;
  authenticate: (userId: string) => Promise<boolean>;
  removeCredential: (credentialId: string) => void;
  enableAutoLogin: (credentialId: string) => void;
  disableAutoLogin: (credentialId: string) => void;
  isAutoLoginEnabled: (credentialId: string) => boolean;
}

export function useBiometricAuth(): UseBiometricAuthReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<BiometricCredential[]>([]);
  const [authService, setAuthService] = useState<BiometricAuthService | null>(
    null
  );

  // Check availability on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const service = getBiometricAuthService();
        setAuthService(service);

        const available = await service.isAvailable();
        setIsAvailable(available);

        // Load stored credentials
        setCredentials(service.listCredentials());

        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize biometric service');
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const register = useCallback(
    async (userName: string, userEmail: string, userId: string) => {
      if (!authService || !isAvailable) {
        setError('Biometric authentication not available');
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await authService.registerBiometric(
          userName,
          userEmail,
          userId
        );

        if (result.success && result.credential) {
          setCredentials((prev) => [...prev, result.credential!]);
          return true;
        } else {
          setError(result.error || 'Registration failed');
          return false;
        }
      } catch (err: any) {
        setError(err.message || 'Registration failed');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [authService, isAvailable]
  );

  const authenticate = useCallback(
    async (userId: string) => {
      if (!authService || !isAvailable) {
        setError('Biometric authentication not available');
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await authService.authenticateWithBiometric(userId);

        if (result.success) {
          return true;
        } else {
          setError(result.error || 'Authentication failed');
          return false;
        }
      } catch (err: any) {
        setError(err.message || 'Authentication failed');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [authService, isAvailable]
  );

  const removeCredential = useCallback(
    (credentialId: string) => {
      if (!authService) return;

      authService.removeBiometric(credentialId);
      setCredentials((prev) =>
        prev.filter((cred) => cred.id !== credentialId)
      );
    },
    [authService]
  );

  const enableAutoLogin = useCallback(
    (credentialId: string) => {
      if (!authService) return;
      authService.enableAutoLogin(credentialId);
    },
    [authService]
  );

  const disableAutoLogin = useCallback(
    (credentialId: string) => {
      if (!authService) return;
      authService.disableAutoLogin(credentialId);
    },
    [authService]
  );

  const isAutoLoginEnabled = useCallback(
    (credentialId: string) => {
      if (!authService) return false;
      return authService.isAutoLoginEnabled(credentialId);
    },
    [authService]
  );

  return {
    isAvailable,
    isLoading,
    error,
    credentials,
    register,
    authenticate,
    removeCredential,
    enableAutoLogin,
    disableAutoLogin,
    isAutoLoginEnabled,
  };
}