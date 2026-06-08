/**
 * Enhanced Providers Component
 * Redux + Firebase + Apollo + Theme + SUI Wallet + ReOwn AppKit providers
 * Single point of provider setup for entire app
 */

import { createStore } from '@orya/wallet-core/store';
import { apolloClient } from '@orya/wallet-core/services';
import { ReOwnProvider } from '@orya/wallet-core/connectivity';
import { ApolloProvider } from '@apollo/client';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import AuthGate from '../lib/authGate';
import { configLog } from '../lib/environment';
import { SUIWalletProvider } from '../providers/SUIWalletProvider';

// Create Redux store once at module load
const store = createStore();

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Enhanced Providers
 * Wraps app with all necessary providers in correct order
 *
 * Provider Stack (outer to inner):
 * 1. ApolloProvider - GraphQL client
 * 2. GestureHandlerRootView - React Native gesture handling
 * 3. SafeAreaProvider - Safe area insets
 * 4. ReduxProvider - Redux state management
 * 5. ReOwnProvider - ReOwn AppKit wallet connectivity
 * 6. SUIWalletProvider - SUI blockchain wallet context
 * 7. AuthGate - Authentication guard & Firebase initialization
 */
export function ProvidersEnhanced({ children }: ProvidersProps) {
  React.useEffect(() => {
    // Log environment configuration on mount
    configLog();
  }, []);

  return (
    <ApolloProvider client={apolloClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ReduxProvider store={store}>
            <ReOwnProvider>
              <SUIWalletProvider>
                <AuthGate>{children}</AuthGate>
              </SUIWalletProvider>
            </ReOwnProvider>
          </ReduxProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ApolloProvider>
  );
}

export default ProvidersEnhanced;