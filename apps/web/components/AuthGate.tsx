'use client';

/**
 * AuthGate Component - Web Platform
 * Root-level authentication guard for PROTOTYPE MODE
 *
 * Responsibilities:
 * 1. Check for mock auth token in storage (prototype mode)
 * 2. Update Zustand state with auth status
 * 3. Show loading screen until auth is determined (quick)
 * 4. Render children when ready
 * 5. Support development-only mock authentication
 */

import { useWebStore } from '@/lib/webStore';
import { getStorageItem } from '@orya/shared-utils';
import React, { useEffect, useState } from 'react';

interface AuthGateProps {
  children: React.ReactNode;
}

/**
 * LoadingScreen Component
 * Shown while authentication status is being determined
 */
function LoadingScreen() {
  return (
    <div className="flex-1 bg-bone-white dark:bg-slate-950 justify-center items-center min-h-screen flex flex-col">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
      <p className="text-deep-charcoal dark:text-gray-300 text-center px-6">
        Initializing ORŸA Wallet...
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Please wait
      </p>
    </div>
  );
}

/**
 * AuthGate Component
 * Main authentication guard that wraps entire app
 * PROTOTYPE MODE: Uses localStorage for mock auth
 */
export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const {
    userId,
    setUserId,
    setAuthReady,
    setOnboardingComplete,
  } = useWebStore();

  const [isInitializing, setIsInitializing] = useState(true);

  /**
   * Initialize auth on mount
   * In prototype mode: check storage for auth token
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[AuthGate] Starting initialization (PROTOTYPE MODE)...');
        
        // Check if we have a stored auth token
        const storedUserId = await getStorageItem('@orya/userId');
        const onboardingCompleteStr = await getStorageItem('@orya/onboarding_complete');
        const onboardingComplete = onboardingCompleteStr === 'true';

        if (storedUserId) {
          console.log('[AuthGate] ✅ Found stored user:', storedUserId);
          setUserId(storedUserId);
          setOnboardingComplete(onboardingComplete);
        } else {
          console.log('[AuthGate] No stored auth token found');
          setUserId(null);
        }

        // Mark auth as ready
        setAuthReady(true);
        setIsInitializing(false);
        
        console.log('[AuthGate] ✅ Initialization complete');
      } catch (error) {
        console.error('[AuthGate] ❌ Initialization error:', error);
        setAuthReady(true);
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [setUserId, setAuthReady, setOnboardingComplete]);

  /**
   * Show loading screen only briefly
   */
  if (isInitializing) {
    console.log('[AuthGate] Rendering: LoadingScreen');
    return <LoadingScreen />;
  }

  /**
   * Auth is ready, render children
   */
  console.log('[AuthGate] Rendering: App content');
  return <>{children}</>;
};

export default AuthGate;