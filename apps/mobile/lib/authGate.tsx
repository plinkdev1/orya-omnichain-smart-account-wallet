/**
 * AuthGate Component - Mobile Platform
 * Root-level authentication guard
 *
 * Responsibilities:
 * 1. Listen to Firebase auth state changes (or mock auth in dev)
 * 2. Update Redux/Zustand state with auth status
 * 3. Show loading screen until auth is determined
 * 4. Route to Onboarding or Home based on onboarding_complete flag
 * 5. Handle auth errors gracefully
 * 6. Support development-only mock authentication & onboarding bypass
 */

import {
    createMockAuthUser,
    isMockAuthEnabled,
    markOnboardingComplete,
    shouldSkipOnboarding
} from '@orya/wallet-core/dev';
import type { RootState } from '@orya/wallet-core/store';
import { clearUser, setError, setLoading, setUser } from '@orya/wallet-core/store';
import type { User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useAppStore } from './appStore';
import { firebaseService } from './firebase';

interface AuthGateProps {
  children: React.ReactNode;
}

/**
 * LoadingScreen Component
 * Shown while authentication status is being determined
 */
function LoadingScreen() {
  return (
    <View className="flex-1 bg-orya-cream dark:bg-orya-ocean justify-center items-center">
      <ActivityIndicator size="large" color="#4DA2FF" />
      <Text className="text-gray-600 dark:text-gray-300 mt-4 text-center px-6">
        Initializing ORŸA Wallet...
      </Text>
      <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Please wait
      </Text>
    </View>
  );
}

/**
 * AuthGate Component
 * Main authentication guard that wraps entire app
 */
export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const dispatch = useDispatch();
  const reduxAuth = useSelector((state: RootState) => state.auth);

  const {
    userId,
    setUserId,
    setAuthReady,
    setOnboardingComplete,
    setAuthError,
    setWalletAddress,
  } = useAppStore();

  const [isInitializing, setIsInitializing] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);

  /**
   * Initialize Firebase (or mock auth in dev) and listen to auth state
   */
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        console.log('[AuthGate] Starting initialization...');
        setIsInitializing(true);

        // ============================================================================
        // DEV MODE: Mock Authentication
        // ============================================================================
        if (isMockAuthEnabled()) {
          console.log('[AuthGate] 🧪 MOCK AUTH MODE ENABLED - Development only');
          
          const mockUser = createMockAuthUser();
          console.log('[AuthGate] ✅ Created mock user:', mockUser.email);

          // Update Zustand store
          setUserId(mockUser.id);

          // Update Redux store
          dispatch(
            setUser({
              id: mockUser.id,
              email: mockUser.email,
              displayName: mockUser.displayName,
              photoURL: mockUser.photoURL || '',
              emailVerified: mockUser.emailVerified,
              isAnonymous: false,
            })
          );

          // Mark onboarding as complete if bypass is enabled
          if (shouldSkipOnboarding()) {
            console.log('[AuthGate] ⏭️ ONBOARDING BYPASS ENABLED - Skipping onboarding flow');
            setOnboardingComplete(true);
            markOnboardingComplete(setOnboardingComplete);
          }

          dispatch(setLoading(false));
          dispatch(setError(null));
          setAuthReady(true);
          setIsInitializing(false);
          return;
        }

        // ============================================================================
        // PRODUCTION: Real Firebase Authentication
        // ============================================================================

        // Initialize Firebase
        if (!firebaseService.isInitialized()) {
          console.log('[AuthGate] Firebase not initialized, initializing...');
          await firebaseService.initialize();
        }

        // Try to restore auth token from persistent storage
        const savedToken = await firebaseService.restoreAuthToken();
        console.log('[AuthGate] Restored auth token:', savedToken ? 'yes' : 'no');

        // If we have a saved token, try to sign in with it
        if (savedToken && !userId) {
          try {
            console.log('[AuthGate] Attempting to sign in with saved token...');
            const firebaseUser = await firebaseService.signInWithToken(savedToken);
            if (firebaseUser) {
              console.log('[AuthGate] ✅ Successfully signed in with saved token');
            }
          } catch (tokenError) {
            console.warn('[AuthGate] ⚠️ Saved token sign-in failed:', tokenError);
            setHasError('Session expired, please login again');
          }
        }

        // Listen to Firebase auth state changes
        console.log('[AuthGate] Setting up auth listener...');
        unsubscribe = firebaseService.onAuthStateChanged(
          (firebaseUser: User | null) => {
            console.log('[AuthGate] Auth state changed:', firebaseUser?.uid || 'null');

            if (firebaseUser) {
              // User is authenticated
              console.log('[AuthGate] ✅ User authenticated:', firebaseUser.uid);

              // Update Zustand store
              setUserId(firebaseUser.uid);

              // Update Redux store
              dispatch(
                setUser({
                  id: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  displayName: firebaseUser.displayName || '',
                  photoURL: firebaseUser.photoURL || '',
                  emailVerified: firebaseUser.emailVerified,
                  isAnonymous: firebaseUser.isAnonymous,
                })
              );

              dispatch(setLoading(false));
              dispatch(setError(null));
            } else {
              // User is not authenticated
              console.log('[AuthGate] User not authenticated');

              // Update stores
              setUserId(null);
              dispatch(clearUser());
              dispatch(setLoading(false));
              setHasError(null);
            }

            // Mark auth as ready
            setAuthReady(true);
            setIsInitializing(false);
          }
        );

        console.log('[AuthGate] ✅ Initialization complete');
      } catch (error) {
        console.error('[AuthGate] ❌ Initialization error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Authentication initialization failed';
        setHasError(errorMessage);
        setAuthError(errorMessage);
        dispatch(setError(errorMessage));
        dispatch(setLoading(false));
        setAuthReady(true);
        setIsInitializing(false);
      }
    };

    initializeAuth();

    // Cleanup: unsubscribe from auth listener
    return () => {
      if (unsubscribe) {
        unsubscribe();
        console.log('[AuthGate] Auth listener unsubscribed');
      }
    };
  }, [dispatch, userId, setUserId, setAuthReady, setAuthError, setOnboardingComplete]);

  /**
   * Show loading screen while initializing
   */
  if (isInitializing) {
    console.log('[AuthGate] Rendering: LoadingScreen');
    return <LoadingScreen />;
  }

  /**
   * Show error screen if initialization failed
   */
  if (hasError) {
    console.log('[AuthGate] Rendering: ErrorScreen - ' + hasError);
    return (
      <View className="flex-1 bg-orya-cream dark:bg-orya-ocean justify-center items-center px-6">
        <Text className="text-2xl font-bold text-red-600 mb-4">⚠️ Error</Text>
        <Text className="text-gray-600 dark:text-gray-300 text-center mb-6">
          {hasError}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Please restart the app
        </Text>
      </View>
    );
  }

  /**
   * Auth is ready, render children
   */
  console.log('[AuthGate] Rendering: App content');
  return <>{children}</>;
};

export default AuthGate;