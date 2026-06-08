'use client';

import { useState } from 'react';
import { PassportEmbed } from '@orya/human-network-sdk';
import type { PassportStamp } from '@orya/human-network-sdk';

interface HumanNetworkWalletFlowProps {
  onComplete?: (walletAddress: string) => void;
  onSkip?: () => void;
}

export function HumanNetworkWalletFlow({
  onComplete,
  onSkip,
}: HumanNetworkWalletFlowProps) {
  const [step, setStep] = useState<'register' | 'passport' | 'complete'>('register');
  const [email, setEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          walletType: 'HUMAN_NETWORK',
        }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const user = await response.json();
      setUserId(user.id);
      setStep('passport');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePassportComplete = async (stamps: PassportStamp[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/wallets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type: 'ethereum',
          provider: 'HUMAN_NETWORK',
          stamps,
        }),
      });

      if (!response.ok) {
        throw new Error('Wallet creation failed');
      }

      const wallet = await response.json();
      setWalletAddress(wallet.address);
      setStep('complete');
      onComplete?.(wallet.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePassportError = (err: Error) => {
    setError(err.message);
  };

  const handleSkip = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/wallets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type: 'ethereum',
          provider: 'HUMAN_NETWORK',
          stamps: [],
        }),
      });

      if (!response.ok) {
        throw new Error('Wallet creation failed');
      }

      const wallet = await response.json();
      setWalletAddress(wallet.address);
      setStep('complete');
      onComplete?.(wallet.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      {step === 'register' && (
        <div>
          <h2>Create Account</h2>
          <p>Get started with your Human Network wallet</p>

          {error && (
            <div
              style={{
                backgroundColor: '#ffebee',
                color: '#c62828',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                }}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Creating Account...' : 'Continue'}
            </button>
          </form>
        </div>
      )}

      {step === 'passport' && (
        <div>
          <h2>Prove You're Human (Optional)</h2>
          <p>Complete stamps to unlock exclusive features and community access</p>

          {error && (
            <div
              style={{
                backgroundColor: '#ffebee',
                color: '#c62828',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <PassportEmbed
              userId={userId}
              onComplete={handlePassportComplete}
              onError={handlePassportError}
              height="500px"
            />
          </div>

          <button
            onClick={handleSkip}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#f5f5f5',
              color: '#1976d2',
              border: '1px solid #1976d2',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Creating Wallet...' : 'Skip for Now'}
          </button>
        </div>
      )}

      {step === 'complete' && (
        <div style={{ textAlign: 'center' }}>
          <h2>✅ Wallet Created!</h2>
          <p>Your Human Network wallet is ready to use.</p>

          <div
            style={{
              backgroundColor: '#f5f5f5',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}
          >
            {walletAddress}
          </div>

          <button
            onClick={() => {
              onSkip?.();
              window.location.href = '/vault';
            }}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
