/**
 * Mobile App Transactions Screen
 * 
 * PROMPT D3: Generate Mobile Navigation (React Native)
 * Transaction history and details
 */

import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { FlatList, SafeAreaView, Text, View } from 'react-native';
import { useTransaction } from '../hooks/useTransaction';

export default function TransactionsScreen() {
  const { transactions, loading, error, getTransactions } = useTransaction();

  useFocusEffect(
    useCallback(() => {
      getTransactions();
    }, [])
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30';
      default:
        return 'bg-red-100 dark:bg-red-900/30';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-800 dark:text-green-300';
      case 'pending':
        return 'text-yellow-800 dark:text-yellow-300';
      default:
        return 'text-red-800 dark:text-red-300';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-orya-cream dark:bg-orya-ocean">
      <View className="px-6 py-6">
        <Text className="text-3xl font-bold text-orya-charcoal dark:text-white mb-1">Transactions</Text>
        <Text className="text-gray-600 dark:text-gray-400">Your transaction history</Text>
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
      ) : transactions.items.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-gray-600 dark:text-gray-400 text-center">No transactions yet</Text>
        </View>
      ) : (
        <FlatList
          data={transactions.items}
          keyExtractor={(item) => item.hash}
          renderItem={({ item: tx }) => (
            <View className="px-6 mb-2">
              <View className="bg-white dark:bg-orya-ocean/80 border border-orya-sea-blue/30 dark:border-orya-sea-blue/50 p-4 rounded-2xl">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="font-bold text-orya-charcoal dark:text-white mb-1">{tx.type}</Text>
                    <Text className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                      {tx.hash.slice(0, 16)}...
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="font-bold text-orya-charcoal dark:text-white mb-1">
                      {tx.type === 'send' ? '-' : '+'} {tx.value}
                    </Text>
                    <View className={`${getStatusColor(tx.status)} px-2 py-1 rounded`}>
                      <Text className={`text-xs font-medium ${getStatusTextColor(tx.status)}`}>
                        {tx.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex-row justify-between">
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(tx.timestamp * 1000).toLocaleString()}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">{tx.chain}</Text>
                </View>
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

