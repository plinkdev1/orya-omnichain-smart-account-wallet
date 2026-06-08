'use client';

import { removeStorageItem } from '@orya/shared-utils';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useWebStore } from '../lib/webStore';

/**
 * Web App Home Page
 * PROTOTYPE MODE - Router that directs to login or onboarding based on auth state
 */

export default function HomePage() {
  const router = useRouter();
  const { userId, onboardingComplete, isAuthReady } = useWebStore();

  useEffect(() => {
    if (!isAuthReady) {
      return; // Still initializing
    }

    // Not authenticated - go to login
    if (!userId) {
      console.log('[HomePage] No user, redirecting to /login');
      router.replace('/login');
      return;
    }

    // Authenticated but not onboarded - go to onboarding
    if (!onboardingComplete) {
      console.log('[HomePage] User authenticated but not onboarded, redirecting to /onboarding');
      router.replace('/onboarding');
      return;
    }

    // Authenticated and onboarded - show dashboard
    console.log('[HomePage] User authenticated and onboarded, showing dashboard');
  }, [userId, onboardingComplete, isAuthReady, router]);

  // While redirecting, show loading
  if (!isAuthReady || !userId || !onboardingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bone-white dark:bg-slate-950">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
          </div>
          <p className="text-deep-charcoal dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-bone-white dark:bg-slate-950 px-6 pt-8 pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-2">
            Welcome back to ORŸA
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your premium multi-chain digital wallet
          </p>
        </div>

        {/* 13 Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: 'Vault', icon: '🏦', desc: 'Portfolio overview & wallet management' },
            { name: 'Link', icon: '🔗', desc: 'Connect and manage wallets' },
            { name: 'Flow', icon: '💱', desc: 'Transaction history & transfers' },
            { name: 'Insights', icon: '📊', desc: 'Analytics & market data' },
            { name: 'Curio', icon: '📚', desc: 'Research & education' },
            { name: 'Grove', icon: '👥', desc: 'Community & social' },
            { name: 'Care', icon: '🆘', desc: 'Support & help' },
            { name: 'Nexus', icon: '⚙️', desc: 'Network & settings' },
            { name: 'Atrium', icon: '💼', desc: 'Wealth management' },
            { name: 'Chains', icon: '⛓️', desc: 'Multi-chain management' },
            { name: 'Suite', icon: '🏢', desc: 'Institutional features' },
            { name: 'Settings', icon: '⚡', desc: 'Preferences & security' },
            { name: 'Help', icon: '❓', desc: 'FAQ & troubleshooting' },
          ].map((item) => (
            <a
              key={item.name}
              href={`/${item.name.toLowerCase()}`}
              className="group p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-pale-gold/20 dark:border-neon-gold/20 hover:border-pale-gold dark:hover:border-neon-gold transition-all hover:shadow-lg"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-lg text-deep-charcoal dark:text-bone-white mb-2 group-hover:text-pale-gold dark:group-hover:text-neon-gold transition-colors">
                {item.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.desc}
              </p>
            </a>
          ))}
        </div>

        {/* Mock Data Demo Section */}
        <div className="mt-12 p-8 bg-gradient-to-br from-pale-gold/10 to-transparent dark:from-neon-gold/10 rounded-2xl border border-pale-gold/30 dark:border-neon-gold/30">
          <h2 className="text-2xl font-bold text-deep-charcoal dark:text-bone-white mb-4">
            Prototype Mode
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You're viewing the ORŸA Wallet web prototype with mock data. Full functionality including blockchain integration and transaction features coming soon.
          </p>
          <button
            onClick={async () => {
              await removeStorageItem('@orya/userId');
              await removeStorageItem('@orya/onboarding_complete');
              window.location.href = '/login';
            }}
            className="px-6 py-2 bg-pale-gold dark:bg-neon-gold text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}


