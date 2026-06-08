'use client';

/**
 * Root Onboarding Page
 * Redirects to the splash screen
 */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/onboarding/splash');
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-bone-white dark:bg-deep-charcoal">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full border-4 border-pale-gold dark:border-neon-gold border-t-transparent animate-spin mx-auto mb-4"></div>
        <p className="text-deep-charcoal dark:text-bone-white">Loading...</p>
      </div>
    </div>
  );
}
