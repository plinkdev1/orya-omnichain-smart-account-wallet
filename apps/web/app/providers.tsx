'use client';

import { AuthGate } from "@/components/AuthGate";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { ThemeProvider } from "@/contexts/theme-context";
import { SUIWalletProvider } from "@/providers/SUIWalletProvider";
import { ReOwnProvider } from '@orya/wallet-core/connectivity';
import { store } from '@orya/wallet-core/store';
import { apolloClient } from '@orya/wallet-core/services';
import { ApolloProvider } from '@apollo/client';
import { PrivyProvider } from '@privy-io/react-auth';
import type React from "react";
import { Provider } from "react-redux";

export function Providers({ children }: { children: React.ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
  const isValidPrivyId = privyAppId && privyAppId.length > 0;

  return (
    <ApolloProvider client={apolloClient}>
      <Provider store={store}>
        {isValidPrivyId ? (
          <PrivyProvider appId={privyAppId}>
            <ReOwnProvider>
              <SUIWalletProvider>
                <ThemeProvider>
                  <BrandingProvider>
                    <AuthGate>
                      {children}
                    </AuthGate>
                  </BrandingProvider>
                </ThemeProvider>
              </SUIWalletProvider>
            </ReOwnProvider>
          </PrivyProvider>
        ) : (
          <ReOwnProvider>
            <SUIWalletProvider>
              <ThemeProvider>
                <BrandingProvider>
                  <AuthGate>
                    {children}
                  </AuthGate>
                </BrandingProvider>
              </ThemeProvider>
            </SUIWalletProvider>
          </ReOwnProvider>
        )}
      </Provider>
    </ApolloProvider>
  )
}
