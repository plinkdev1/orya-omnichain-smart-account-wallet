'use client';

import { useSuiZkLogin } from '@orya/wallet-core/hooks';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface SuiZkLoginButtonProps {
  clientId: string;
  redirectUrl: string;
  onSuccess?: (credential: any) => void;
  onError?: (error: Error) => void;
  provider: 'google' | 'apple' | 'twitch';
  className?: string;
}

const providerConfig = {
  google: {
    label: 'Google',
    icon: '🔵',
    description: 'Sign up with your Google account',
  },
  apple: {
    label: 'Apple',
    icon: '🍎',
    description: 'Sign up with your Apple ID',
  },
  twitch: {
    label: 'Twitch',
    icon: '📺',
    description: 'Sign up with your Twitch account',
  },
};

export function SuiZkLoginButton({
  clientId,
  redirectUrl,
  onSuccess,
  onError,
  provider,
  className = '',
}: SuiZkLoginButtonProps) {
  const { isLoading, error, startZkLogin } = useSuiZkLogin({
    clientId,
    redirectUrl,
  });

  const [localError, setLocalError] = useState<Error | null>(error);

  const handleClick = async () => {
    try {
      setLocalError(null);
      await startZkLogin(provider);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setLocalError(error);
      onError?.(error);
    }
  };

  const config = providerConfig[provider];

  return (
    <div className={className}>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          w-full p-4 rounded-2xl border-2 transition-all duration-200
          flex items-center gap-4 mb-3 text-left
          ${
            isLoading
              ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'
              : 'border-gray-200 dark:border-gray-700 hover:border-pale-gold/40 dark:hover:border-neon-gold/40 cursor-pointer'
          }
          ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <div className="flex-shrink-0 text-2xl w-10 h-10 flex items-center justify-center">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : config.icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-deep-charcoal dark:text-bone-white mb-1 truncate">
            {config.label}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {config.description}
          </p>
        </div>

        {!isLoading && (
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </button>

      {localError && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-700 dark:text-red-300">
          {localError.message}
        </div>
      )}
    </div>
  );
}
