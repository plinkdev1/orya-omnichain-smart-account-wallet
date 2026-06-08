/**
 * Web App Portfolio Page
 * 
 * PROMPT D2: Generate Web Navigation (Next.js)
 * Detailed portfolio analytics
 */

'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';

export default function PortfolioPage() {
  const { portfolio, loading, error, fetchBalances } = useWallet();

  useEffect(() => {
    // Fetch balances when component mounts
    if (portfolio.wallets.length > 0) {
      portfolio.wallets.forEach((wallet) => {
        fetchBalances(wallet.address);
      });
    }
  }, [portfolio.wallets]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
          <p className="text-muted-foreground">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 pt-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
        <p className="text-muted-foreground">Your assets across all chains</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {portfolio.wallets.length === 0 ? (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          <p>No wallets connected. Connect a wallet to see your portfolio.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Summary Card */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-600 dark:text-blue-300 mb-2">Total Portfolio Value</p>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">$0.00</p>
            <p className="text-sm text-blue-600 dark:text-blue-300 mt-2">24h Change: +0.00%</p>
          </div>

          {/* Wallets Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {portfolio.wallets.map((wallet) => (
              <div key={wallet.address} className="p-4 bg-white dark:bg-orya-ocean/80 rounded-2xl border border-orya-sea-blue/30 dark:border-orya-sea-blue/50">
                <h4 className="font-bold text-orya-charcoal dark:text-white mb-2">{wallet.name || 'Wallet'}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all mb-4">{wallet.address}</p>
                {wallet.balance && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Balance</p>
                    <p className="text-lg font-bold text-orya-charcoal dark:text-white">
                      {wallet.balance.formatted} {wallet.balance.symbol}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


