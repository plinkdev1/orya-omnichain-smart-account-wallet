import { useQuery } from '@apollo/client';
import { GET_SUI_BALANCE } from '../graphql/queries';

interface SUIBalanceData {
  suiWallet: {
    address: string;
    balance: {
      total: string;
      coinType: string;
      lockedBalance: string;
    };
    coins: Array<{
      coinType: string;
      balance: string;
      coinObjectCount: number;
    }>;
  };
}

export interface UseSUIBalanceReturn {
  balance: string;
  balanceFormatted: string;
  coins: Array<{
    coinType: string;
    balance: string;
    coinObjectCount: number;
  }>;
  loading: boolean;
  error: any;
  refetch: () => Promise<any>;
}

function formatSUIBalance(balance: string): string {
  const balanceNumber = parseFloat(balance) / 1e9;
  return balanceNumber.toFixed(2);
}

export function useSUIBalance(userId?: string, address?: string): UseSUIBalanceReturn {
  const { data, loading, error, refetch } = useQuery<SUIBalanceData>(
    GET_SUI_BALANCE,
    {
      variables: {
        userId: userId || 'user_123',
        address: address || '',
      },
      skip: !address,
      pollInterval: 30000,
    }
  );

  const suiBalance = data?.suiWallet?.balance?.total || '0';
  const coins = data?.suiWallet?.coins || [];

  return {
    balance: suiBalance,
    balanceFormatted: formatSUIBalance(suiBalance),
    coins,
    loading,
    error,
    refetch,
  };
}
