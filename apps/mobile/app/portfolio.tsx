/**
 * Mobile App Portfolio Screen
 * 
 * PROMPT D3: Generate Mobile Navigation (React Native)
 * Detailed portfolio analytics
 */

import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { FlatList, SafeAreaView, Text, View } from 'react-native';
import { useWallet } from '../hooks/useWallet';

export default function PortfolioScreen() {
  const { portfolio, loading, error, fetchBalances } = useWallet();

  useFocusEffect(
    useCallback(() => {
      if (portfolio.wallets.length > 0) {
        portfolio.wallets.forEach((wallet) => {
          fetchBalances(wallet.address);
        });
      }
    }, [portfolio.wallets])
  );

  return (
    <SafeAreaView className="flex-1 bg-orya-cream dark:bg-orya-ocean">
      <View className="px-6 py-6">
        <Text className="text-3xl font-bold text-orya-charcoal dark:text-white mb-1">Portfolio</Text>
        <Text className="text-gray-600 dark:text-gray-400">Your assets across all chains</Text>
      </View>

      {error && (
        <View className="mx-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl mb-4">
          <Text className="text-red-700 dark:text-red-300 text-sm">{error}</Text>
        </View>
      )}

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600 dark:text-gray-300">Loading...</Text>
        </View>
      ) : portfolio.wallets.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-gray-600 dark:text-gray-400 text-center">
            No wallets connected. Connect a wallet to see your portfolio.
          </Text>
        </View>
      ) : (
        <FlatList
          data={portfolio.wallets}
          keyExtractor={(item) => item.address}
          ListHeaderComponent={
            <View className="px-6 mb-6">
              <View className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6">
                <Text className="text-sm text-blue-600 dark:text-blue-300 mb-2">Total Portfolio Value</Text>
                <Text className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">$0.00</Text>
                <Text className="text-sm text-blue-600 dark:text-blue-300">24h Change: +0.00%</Text>
              </View>
            </View>
          }
          renderItem={({ item: wallet }) => (
            <View className="px-6 mb-3">
              <View className="bg-white dark:bg-orya-ocean/80 border border-orya-sea-blue/30 dark:border-orya-sea-blue/50 p-4 rounded-2xl">
                <Text className="font-bold text-orya-charcoal dark:text-white mb-2">{wallet.name || 'Wallet'}</Text>
                <Text className="text-xs text-gray-600 dark:text-gray-400 font-mono mb-3">
                  {wallet.address.slice(0, 10)}...
                </Text>

                {wallet.balance ? (
                  <View>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-sm text-gray-600 dark:text-gray-400">Balance</Text>
                      <Text className="font-bold text-orya-charcoal dark:text-white">
                        {wallet.balance.formatted} {wallet.balance.symbol}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-sm text-gray-600 dark:text-gray-400">USD Value</Text>
                      <Text className="font-bold text-orya-charcoal dark:text-white">$0.00</Text>
                    </View>
                  </View>
                ) : (
                  <Text className="text-sm text-gray-500 dark:text-gray-400">Loading balance...</Text>
                )}
              </View>
            </View>
          )}
          scrollEnabled={true}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

