/**
 * Biometric Capabilities Hook
 * Detects and manages biometric authentication on web
 *
 * Web uses WebAuthn API for:
 * - Platform authenticators (Face ID, Touch ID, Windows Hello)
 * - Security keys (FIDO2)
 *
 * Mobile app uses:
 * - React Native LocalAuthentication
 * - Expo LocalAuthentication (for Expo projects)
 */

import { useCallback, useEffect, useState } from 'react';

export type BiometricType = 'faceId' | 'touchId' | 'fingerprint' | 'windowsHello' | 'securityKey' | 'none';

export interface BiometricCapabilities {
  available: boolean;
  types: BiometricType[];
  canRegister: boolean;
  isSupported: boolean;
}

export const useBiometricCapabilities = () => {
  const [capabilities, setCapabilities] = useState<BiometricCapabilities>({
    available: false,
    types: [],
    canRegister: false,
    isSupported: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if WebAuthn is supported in browser
   */
  const isWebAuthnSupported = useCallback((): boolean => {
    return (
      typeof window !== 'undefined' &&
      !!(
        window.PublicKeyCredential ||
        window.webkitPublicKeyCredential ||
        (window as any).mozPublicKeyCredential
      )
    );
  }, []);

  /**
   * Check if platform authenticator is available
   */
  const checkPlatformAuthenticator = useCallback(async (): Promise<boolean> => {
    if (!isWebAuthnSupported()) {
      return false;
    }

    try {
      if (
        PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable
      ) {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
      return false;
    } catch (err) {
      console.error('[BiometricCapabilities] Error checking platform authenticator:', err);
      return false;
    }
  }, [isWebAuthnSupported]);

  /**
   * Detect available biometric types
   */
  const detectBiometricTypes = useCallback(async (): Promise<BiometricType[]> => {
    const types: BiometricType[] = [];

    if (!isWebAuthnSupported()) {
      return types;
    }

    try {
      const isPlatformAvailable = await checkPlatformAuthenticator();

      if (isPlatformAvailable) {
        // Detect based on user agent and OS
        const userAgent = navigator.userAgent;
        const platform = navigator.platform || navigator.userAgent;

        if (userAgent.includes('Win')) {
          types.push('windowsHello');
        } else if (userAgent.includes('Mac')) {
          types.push('touchId');
          types.push('faceId');
        } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
          types.push('faceId');
          types.push('touchId');
        } else if (userAgent.includes('Android')) {
          types.push('fingerprint');
        }
      }

      // Security keys are always an option if WebAuthn is supported
      types.push('securityKey');

      return types;
    } catch (err) {
      console.error('[BiometricCapabilities] Error detecting types:', err);
      return types;
    }
  }, [isWebAuthnSupported, checkPlatformAuthenticator]);

  /**
   * Initialize biometric detection
   */
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const supported = isWebAuthnSupported();
        const types = await detectBiometricTypes();
        const canRegister = supported && types.length > 0;

        setCapabilities({
          available: canRegister,
          types,
          canRegister,
          isSupported: supported,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setCapabilities({
          available: false,
          types: [],
          canRegister: false,
          isSupported: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [isWebAuthnSupported, detectBiometricTypes]);

  /**
   * Register a new biometric credential
   * This is a placeholder - actual implementation would call WebAuthn API
   */
  const registerBiometric = useCallback(
    async (
      biometricType: BiometricType
    ): Promise<{ success: boolean; error?: string }> => {
      if (!isWebAuthnSupported()) {
        return {
          success: false,
          error: 'WebAuthn is not supported in this browser',
        };
      }

      if (!capabilities.types.includes(biometricType)) {
        return {
          success: false,
          error: `${biometricType} is not available on this device`,
        };
      }

      try {
        // Placeholder for actual WebAuthn registration
        // In production, this would:
        // 1. Call navigator.credentials.create()
        // 2. Send public key to backend
        // 3. Store credential ID for authentication

        console.log(
          `[BiometricCapabilities] Registering ${biometricType} (mock)`
        );

        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return { success: true };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Registration failed';
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [isWebAuthnSupported, capabilities.types]
  );

  /**
   * Authenticate with biometric
   * This is a placeholder - actual implementation would call WebAuthn API
   */
  const authenticateWithBiometric = useCallback(
    async (
      biometricType: BiometricType
    ): Promise<{ success: boolean; error?: string }> => {
      if (!isWebAuthnSupported()) {
        return {
          success: false,
          error: 'WebAuthn is not supported in this browser',
        };
      }

      try {
        // Placeholder for actual WebAuthn authentication
        // In production, this would:
        // 1. Call navigator.credentials.get()
        // 2. Send response to backend for verification
        // 3. Return authentication result

        console.log(
          `[BiometricCapabilities] Authenticating with ${biometricType} (mock)`
        );

        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return { success: true };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Authentication failed';
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [isWebAuthnSupported]
  );

  return {
    capabilities,
    isLoading,
    error,
    registerBiometric,
    authenticateWithBiometric,
    isWebAuthnSupported: isWebAuthnSupported(),
  };
};