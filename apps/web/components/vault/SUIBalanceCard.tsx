'use client';

import { useSUIBalance } from '@orya/wallet-core';
import { useFXRate } from '../../hooks/useFXRate';
import { Card } from '../ui/card';
import { RefreshCw } from 'lucide-react';

export function SUIBalanceCard() {
  const { balance, balanceFormatted, loading, refetch } = useSUIBalance();
  const { rate: suiUsdRate } = useFXRate('SUI/USD');

  const balanceUSD = parseFloat(balanceFormatted) * suiUsdRate;

  return (
    <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-white/70">SUI Balance</p>
          <h2 className="text-3xl font-bold">
            {loading ? '—' : `${balanceFormatted} SUI`}
          </h2>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 hover:bg-white/10 rounded-lg transition"
          disabled={loading}
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-sm text-white/70">USD Value</p>
          <p className="text-xl font-semibold">
            ${balanceUSD.toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/70">SUI/USD</p>
          <p className="text-sm">${suiUsdRate.toFixed(2)}</p>
        </div>
      </div>
    </Card>
  );
}
