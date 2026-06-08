/**
 * Biometric Authentication Service
 * Uses WebAuthn (FIDO2) for fingerprint/face recognition
 * Supported on 99%+ of modern devices
 */

import {
    startAuthentication,
    startRegistration
} from '@simplewebauthn/browser';

type AuthenticatorTransport = 'usb' | 'nfc' | 'ble' | 'internal' | 'hybrid' | 'smart-card' | 'hybrid-transport';

export interface BiometricCredential {
  id: string;
  publicKey: ArrayBuffer;
  counter: number;
  transports?: AuthenticatorTransport[];
  deviceName?: string;
  createdAt: number;
}

export interface BiometricAuthResult {
  success: boolean;
  credential?: BiometricCredential;
  error?: string;
}

export class BiometricAuthService {
  private credentials: Map<string, BiometricCredential> = new Map();
  private rpName = 'ORŸA Wallet';
  private rpId = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  private origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';

  /**
   * Check if biometric authentication is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      
      const available = await window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable?.();
      return available ?? false;
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      return false;
    }
  }

  /**
   * Register biometric credential
   * Called during onboarding or settings
   */
  async registerBiometric(
    userName: string,
    userEmail: string,
    userId: string
  ): Promise<BiometricAuthResult> {
    try {
      // Helper to convert Uint8Array to base64
      const toBase64 = (buffer: Uint8Array): string => {
        return btoa(String.fromCharCode.apply(null, Array.from(buffer)));
      };

      // Generate random challenge for WebAuthn
      const challenge = new Uint8Array(32);
      if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(challenge);
      }

      // Step 1: Request credential creation options from server (mock here)
      const credentialCreationOptions = {
        rp: {
          name: this.rpName,
          id: this.rpId,
        },
        user: {
          id: toBase64(new TextEncoder().encode(userId)),
          name: userEmail,
          displayName: userName,
        },
        challenge: toBase64(challenge),
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' as const },
          { alg: -257, type: 'public-key' as const },
        ],
        timeout: 60000,
        attestation: 'direct' as const,
        authenticatorSelection: {
          authenticatorAttachment: 'platform' as const,
          requireResidentKey: false,
          userVerification: 'required' as const,
        },
      };

      // Step 2: Trigger WebAuthn registration
      const credential = await startRegistration(credentialCreationOptions);

      // Store credential locally
      const bioCredential: BiometricCredential = {
        id: credential.id,
        publicKey: new ArrayBuffer(0), // Would be populated from server
        counter: 0,
        deviceName: this.getDeviceName(),
        createdAt: Date.now(),
      };

      this.credentials.set(credential.id, bioCredential);

      return {
        success: true,
        credential: bioCredential,
      };
    } catch (error: any) {
      console.error('Biometric registration failed:', error);
      return {
        success: false,
        error: error.message || 'Biometric registration failed',
      };
    }
  }

  /**
   * Authenticate with biometric
   * Called during login
   */
  async authenticateWithBiometric(userId: string): Promise<BiometricAuthResult> {
    try {
      const storedCredentials = Array.from(this.credentials.values());

      if (storedCredentials.length === 0) {
        throw new Error('No biometric credentials registered');
      }

      // Helper to convert Uint8Array to base64
      const toBase64 = (buffer: Uint8Array): string => {
        return btoa(String.fromCharCode.apply(null, Array.from(buffer)));
      };

      // Generate random challenge for WebAuthn
      const challenge = new Uint8Array(32);
      if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(challenge);
      }

      // Step 1: Request authentication options from server (mock here)
      const authenticationOptions = {
        challenge: toBase64(challenge),
        timeout: 60000,
        userVerification: 'required' as const,
        allowCredentials: storedCredentials.map((cred) => ({
          id: cred.id,
          type: 'public-key' as const,
          transports: (cred.transports as any) || ['internal'],
        })),
      };

      // Step 2: Trigger WebAuthn authentication
      const assertion = await startAuthentication(authenticationOptions);

      return {
        success: true,
        credential: storedCredentials[0], // Would verify against challenge
      };
    } catch (error: any) {
      console.error('Biometric authentication failed:', error);
      return {
        success: false,
        error: error.message || 'Biometric authentication failed',
      };
    }
  }

  /**
   * Remove biometric credential
   */
  removeBiometric(credentialId: string): boolean {
    return this.credentials.delete(credentialId);
  }

  /**
   * List all registered biometric credentials
   */
  listCredentials(): BiometricCredential[] {
    return Array.from(this.credentials.values());
  }

  /**
   * Get device info for credential naming
   */
  private getDeviceName(): string {
    if (typeof window === 'undefined') return 'Unknown Device';

    const ua = window.navigator.userAgent;
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('iPad')) return 'iPad';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'Mac';
    return 'Unknown Device';
  }

  /**
   * Check if specific credential is available
   */
  hasCredential(credentialId: string): boolean {
    return this.credentials.has(credentialId);
  }

  /**
   * Enable biometric for automatic login
   */
  enableAutoLogin(credentialId: string): void {
    const credential = this.credentials.get(credentialId);
    if (credential) {
      // Store flag in local storage (with encryption in production)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          `orya_biometric_auto_${credentialId}`,
          'true'
        );
      }
    }
  }

  /**
   * Disable biometric for automatic login
   */
  disableAutoLogin(credentialId: string): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(`orya_biometric_auto_${credentialId}`);
    }
  }

  /**
   * Check if auto-login is enabled
   */
  isAutoLoginEnabled(credentialId: string): boolean {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(`orya_biometric_auto_${credentialId}`) === 'true';
  }
}

// Singleton instance
let biometricAuthService: BiometricAuthService | null = null;

/**
 * Get or create Biometric Auth Service instance
 */
export function getBiometricAuthService(): BiometricAuthService {
  if (!biometricAuthService) {
    biometricAuthService = new BiometricAuthService();
  }
  return biometricAuthService;
}