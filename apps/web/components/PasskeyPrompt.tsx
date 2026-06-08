'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Fingerprint, Loader2, X } from 'lucide-react';

interface PasskeyPromptProps {
  userId: string;
  walletAddress: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

interface PasskeyRegistrationResponse {
  success: boolean;
  message?: string;
}

export function PasskeyPrompt({
  userId,
  walletAddress,
  onComplete,
  onSkip,
}: PasskeyPromptProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipCount, setSkipCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('passkey_skip_count');
    if (stored) {
      const count = parseInt(stored, 10);
      setSkipCount(count);
      if (count >= 10) {
        setIsOpen(false);
      }
    }
  }, []);

  const bufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  };

  const registerPasskey = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Request challenge from backend
      const challengeResponse = await fetch('/api/passkey/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, walletAddress }),
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to get challenge from server');
      }

      const { challenge: challengeBase64 } = await challengeResponse.json();
      const challenge = Uint8Array.from(atob(challengeBase64), (c) =>
        c.charCodeAt(0)
      );

      // Step 2: Create WebAuthn credential
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'Orÿa Wallet',
            id: window.location.hostname,
          },
          user: {
            id: Uint8Array.from(userId, (c) => c.charCodeAt(0)),
            name: userId,
            displayName: `User ${userId}`,
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
          attestation: 'direct',
        },
      })) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('Failed to create WebAuthn credential');
      }

      const attestationResponse = credential.response as AuthenticatorAttestationResponse;

      // Step 3: Send credential to backend
      const registerResponse = await fetch('/api/passkey/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          walletAddress,
          credential: {
            id: credential.id,
            rawId: bufferToBase64(credential.rawId),
            response: {
              clientDataJSON: bufferToBase64(attestationResponse.clientDataJSON),
              attestationObject: bufferToBase64(attestationResponse.attestationObject),
            },
          },
        }),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(
          errorData.message || 'Failed to register passkey on server'
        );
      }

      const result: PasskeyRegistrationResponse = await registerResponse.json();

      if (result.success) {
        localStorage.removeItem('passkey_skip_count');
        setIsOpen(false);
        onComplete?.();
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to register passkey';
      setError(message);
      console.error('[PasskeyPrompt] Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    const newCount = skipCount + 1;
    setSkipCount(newCount);
    localStorage.setItem('passkey_skip_count', newCount.toString());

    if (newCount >= 3) {
      setError(
        'We strongly recommend setting up a Passkey for enhanced security. You can enable it anytime in Settings.'
      );
    }

    if (newCount >= 10) {
      setIsOpen(false);
    } else {
      setIsOpen(false);
    }

    onSkip?.();
  };

  const handleDismiss = () => {
    setIsOpen(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pale-gold/10 dark:bg-neon-gold/10 rounded-lg">
              <Fingerprint className="w-5 h-5 text-pale-gold dark:text-neon-gold" />
            </div>
            <h2 className="text-lg font-semibold text-deep-charcoal dark:text-bone-white">
              🔐 Add Extra Security
            </h2>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Use your fingerprint or face to approve transactions. This adds an
            extra security layer (4th factor) beyond your 3 MPC shards.
          </p>

          {error && skipCount >= 3 && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {error}
              </p>
            </div>
          )}

          {error && skipCount < 3 && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Benefits */}
          <div className="space-y-2 mt-6">
            <div className="flex items-start gap-2">
              <span className="text-pale-gold dark:text-neon-gold mt-1">✓</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Biometric authentication
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-pale-gold dark:text-neon-gold mt-1">✓</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Never leaves your device
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-pale-gold dark:text-neon-gold mt-1">✓</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Industry-standard WebAuthn
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl space-y-3">
          <button
            onClick={registerPasskey}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-pale-gold dark:bg-neon-gold text-deep-charcoal dark:text-gray-900 rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting Up...
              </>
            ) : (
              <>
                <Fingerprint className="w-4 h-4" />
                Set Up Passkey
              </>
            )}
          </button>
          <button
            onClick={handleSkip}
            disabled={isLoading}
            className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 text-deep-charcoal dark:text-bone-white rounded-lg font-medium hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Skip for Now
          </button>
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            You can enable this anytime in Settings
          </p>
        </div>
      </div>
    </div>
  );
}
