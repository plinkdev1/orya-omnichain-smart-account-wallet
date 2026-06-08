/**
 * Development-Only Onboarding Bypass Utilities
 * 
 * Allows skipping the onboarding flow in development/localhost mode
 * for faster testing and iteration.
 * 
 * Enable with: SKIP_ONBOARDING=true (or NEXT_PUBLIC_SKIP_ONBOARDING for web)
 * 
 * ⚠️ DEVELOPMENT ONLY - Never runs in production
 */

/**
 * Check if onboarding bypass is enabled
 * Enable with:
 * - Web: NEXT_PUBLIC_SKIP_ONBOARDING=true or SKIP_ONBOARDING=true
 * - Mobile: EXPO_PUBLIC_SKIP_ONBOARDING=true or SKIP_ONBOARDING=true
 */
export function shouldSkipOnboarding(): boolean {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  // Check various env var formats for cross-platform support
  return (
    process.env.SKIP_ONBOARDING === 'true' ||
    process.env.NEXT_PUBLIC_SKIP_ONBOARDING === 'true' ||
    process.env.EXPO_PUBLIC_SKIP_ONBOARDING === 'true' ||
    (typeof window !== 'undefined' && localStorage.getItem('@orya/skip-onboarding') === 'true') ||
    false
  );
}

/**
 * Check if we're running in development/localhost
 */
export function isDevEnvironment(): boolean {
  // Client-side
  if (typeof window !== 'undefined') {
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname === 'exp://10.0.0.1' || // Expo local
      process.env.NODE_ENV === 'development'
    );
  }
  
  // Server-side
  return process.env.NODE_ENV === 'development';
}

/**
 * Enable or disable onboarding bypass at runtime
 * Useful for testing UI components
 */
export function setOnboardingBypass(skip: boolean): void {
  if (typeof window === 'undefined') return;
  
  if (skip) {
    localStorage.setItem('@orya/skip-onboarding', 'true');
    console.log('[OnboardingBypass] ✅ Onboarding bypass ENABLED');
  } else {
    localStorage.removeItem('@orya/skip-onboarding');
    console.log('[OnboardingBypass] ✅ Onboarding bypass DISABLED');
  }
}

/**
 * Get current onboarding bypass status
 */
export function getOnboardingBypassStatus(): {
  isEnabled: boolean;
  reason: string;
  env: Record<string, string | boolean>;
} {
  const isEnabled = shouldSkipOnboarding();
  
  let reason = '';
  if (!isDevEnvironment()) {
    reason = 'Not in development environment';
  } else if (process.env.SKIP_ONBOARDING === 'true') {
    reason = 'SKIP_ONBOARDING=true (root .env)';
  } else if (process.env.NEXT_PUBLIC_SKIP_ONBOARDING === 'true') {
    reason = 'NEXT_PUBLIC_SKIP_ONBOARDING=true (web .env)';
  } else if (process.env.EXPO_PUBLIC_SKIP_ONBOARDING === 'true') {
    reason = 'EXPO_PUBLIC_SKIP_ONBOARDING=true (mobile .env)';
  } else if (typeof window !== 'undefined' && localStorage.getItem('@orya/skip-onboarding') === 'true') {
    reason = '@orya/skip-onboarding=true (localStorage)';
  } else {
    reason = 'Disabled - onboarding will run normally';
  }
  
  return {
    isEnabled,
    reason,
    env: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      SKIP_ONBOARDING: process.env.SKIP_ONBOARDING || 'not set',
      NEXT_PUBLIC_SKIP_ONBOARDING: process.env.NEXT_PUBLIC_SKIP_ONBOARDING || 'not set',
      EXPO_PUBLIC_SKIP_ONBOARDING: process.env.EXPO_PUBLIC_SKIP_ONBOARDING || 'not set',
      isDev: isDevEnvironment(),
    },
  };
}

/**
 * Mark onboarding as complete in state
 * This should be called in your store/reducer
 */
export function markOnboardingComplete(
  setOnboardingComplete: (complete: boolean) => void
): void {
  if (shouldSkipOnboarding()) {
    console.log('[OnboardingBypass] 🚀 Skipping onboarding - marking as complete');
    setOnboardingComplete(true);
  }
}

/**
 * Log current development settings
 * Useful for debugging
 */
export function logDevSettings(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  const onboardingStatus = getOnboardingBypassStatus();
  
  console.group('[DEV SETTINGS] ORŸA Wallet Development Configuration');
  console.log('🏠 Environment:', {
    isDev: isDevEnvironment(),
    NODE_ENV: process.env.NODE_ENV,
    location: typeof window !== 'undefined' ? window.location.hostname : 'server-side',
  });
  console.log('🚀 Onboarding Bypass:', onboardingStatus);
  console.groupEnd();
}