/**
 * Web App Transactions Page
 * 
 * PROMPT D2: Generate Web Navigation (Next.js)
 * Transaction history and details
 */

'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useTransaction } from '../../hooks/useTransaction';

export default function TransactionsPage() {
  const { transactions, loading, error, getTransactions } = useTransaction();

  useEffect(() => {
    getTransactions();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 pt-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Transactions</h1>
        <p className="text-muted-foreground">Your transaction history</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {transactions.items.length === 0 ? (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          <p>No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.items.map((tx) => (
            <div key={tx.hash} className="p-4 bg-white dark:bg-orya-ocean/80 rounded-2xl border border-orya-sea-blue/30 dark:border-orya-sea-blue/50 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-bold text-orya-charcoal dark:text-white mb-1">{tx.type}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">{tx.hash.slice(0, 16)}...</p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-orya-charcoal dark:text-white">
                    {tx.type === 'send' ? '-' : '+'} {tx.value}
                  </p>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      tx.status === 'confirmed'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : tx.status === 'pending'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


