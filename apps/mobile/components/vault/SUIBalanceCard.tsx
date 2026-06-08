import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSUIBalance } from '@orya/wallet-core';
import { useFXRate } from '../../hooks/useFXRate';
import { RefreshCw } from 'lucide-react-native';

export function SUIBalanceCard() {
  const { balance, balanceFormatted, loading, refetch } = useSUIBalance();
  const { rate: suiUsdRate } = useFXRate('SUI/USD');

  const balanceUSD = parseFloat(balanceFormatted) * suiUsdRate;

  return (
    <View className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 mx-4 mt-4">
      <View className="flex-row justify-between items-start mb-4">
        <View>
          <Text className="text-sm text-white/70">SUI Balance</Text>
          <Text className="text-3xl font-bold text-white">
            {loading ? '—' : `${balanceFormatted} SUI`}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => refetch()}
          disabled={loading}
          className="p-2 bg-white/10 rounded-lg"
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <RefreshCw size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
      <View className="flex-row justify-between items-end">
        <View>
          <Text className="text-sm text-white/70">USD Value</Text>
          <Text className="text-xl font-semibold text-white">
            ${balanceUSD.toFixed(2)}
          </Text>
        </View>
        <View>
          <Text className="text-xs text-white/70 text-right">SUI/USD</Text>
          <Text className="text-sm text-white">${suiUsdRate.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
}
