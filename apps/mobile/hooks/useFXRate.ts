import { useState, useEffect } from 'react';

const FX_RATES: Record<string, number> = {
  'SUI/USD': 3.50,
  'SOL/USD': 210.00,
  'ETH/USD': 2500.00,
  'BTC/USD': 45000.00,
};

interface UseFXRateReturn {
  rate: number;
  loading: boolean;
  error: any;
  refetch: () => Promise<void>;
}

export function useFXRate(pair: string): UseFXRateReturn {
  const [rate, setRate] = useState<number>(FX_RATES[pair] || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const mockRate = FX_RATES[pair] || 0;
      setRate(mockRate);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [pair]);

  return { rate, loading, error, refetch };
}
