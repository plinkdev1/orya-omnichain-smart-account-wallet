'use client';

import { useWebStore } from '@/lib/webStore';
import { isValidEmail, setStorageItem } from '@orya/shared-utils';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { userId, setUserId, setOnboardingComplete, isAuthReady } = useWebStore();
  const [email, setEmail] = useState('demo@orya.app');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthReady && userId) {
      console.log('[LoginPage] User already authenticated, redirecting to /');
      router.replace('/');
    }
  }, [isAuthReady, userId, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Simulate login delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock authentication
      if (!isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Generate a simple user ID
      const userId = `user_${Math.random().toString(36).slice(2, 11)}`;
      
      // Save to storage using abstraction
      await setStorageItem('@orya/userId', userId);
      await setStorageItem('@orya/onboarding_complete', 'true');

      // Update store
      setUserId(userId);
      setOnboardingComplete(true);

      console.log('[LoginPage] ✅ Login successful:', userId);
      
      // Redirect to home
      router.replace('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      console.error('[LoginPage] ❌ Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('demo@orya.app');
    // Trigger login immediately
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    }, 0);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bone-white dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bone-white to-pale-gold/20 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-3">
            ORŸA Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Premium Multi-Chain Digital Wallet
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-pale-gold/30 dark:border-neon-gold/30 p-8 shadow-lg">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-deep-charcoal dark:text-bone-white mb-3">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl border-2 border-pale-gold/30 dark:border-neon-gold/30 bg-white dark:bg-slate-700 text-deep-charcoal dark:text-bone-white placeholder:text-gray-400 focus:outline-none focus:border-pale-gold dark:focus:border-neon-gold transition-colors disabled:opacity-50"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-pale-gold dark:bg-neon-gold text-black font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Login Info */}
          <div className="mt-6 pt-6 border-t border-pale-gold/20 dark:border-neon-gold/20">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 text-center">
              PROTOTYPE MODE - Click below to try demo login
            </p>
            <button
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full px-4 py-2 border-2 border-pale-gold/30 dark:border-neon-gold/30 text-deep-charcoal dark:text-bone-white rounded-xl hover:bg-pale-gold/10 dark:hover:bg-neon-gold/10 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              Try Demo Account
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur rounded-xl text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <strong>Demo Mode:</strong> This is a prototype. Use any email to sign in.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Try demo@orya.app for quick access
          </p>
        </div>
      </div>
    </div>
  );
}
