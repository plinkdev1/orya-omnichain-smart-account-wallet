'use client';

import { PrivyProvider as PrivyReactProvider } from '@privy-io/react-auth';
import type React from 'react';

interface PrivyProviderProps {
  children: React.ReactNode;
}

export function PrivyProvider({ children }: PrivyProviderProps) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

  if (!privyAppId) {
    console.warn('NEXT_PUBLIC_PRIVY_APP_ID is not set. Privy provider will not work.');
    return <>{children}</>;
  }

  return (
    <PrivyReactProvider
      appId={privyAppId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#a78bfa',
          logo: 'https://orya.io/logo.png',
          landingHeaderLogo: 'https://orya.io/logo.png',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        loginMethods: ['email', 'google', 'apple', 'twitter'],
        externalWallets: {
          solana: {
            chainIds: ['mainnet-beta'],
          },
        },
        defaultChain: 'ethereum',
      }}
    >
      {children}
    </PrivyReactProvider>
  );
}
