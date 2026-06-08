import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useChainbaseTransactions } from '@orya/wallet-core'
import { tw } from 'nativewind'
import { format } from 'date-fns'

interface TransactionHistoryProps {
  address: string
  chainId: string
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  address,
  chainId,
}) => {
  const [page, setPage] = useState(0)
  const limit = 20
  const { data, isLoading, isFetching } = useChainbaseTransactions({
    address,
    chainId,
    limit,
    offset: page * limit,
  })

  const renderTransaction = ({ item }: { item: any }) => {
    const isOutgoing = item.from.toLowerCase() === address.toLowerCase()
    return (
      <TouchableOpacity
        style={tw`bg-white p-4 mb-2 rounded-lg border border-gray-100`}
        onPress={() => {
          // Navigate to transaction details
        }}
      >
        <View style={tw`flex-row justify-between items-start mb-2`}>
          <View style={tw`flex-1`}>
            <Text style={tw`font-semibold text-gray-900 mb-1`}>
              {isOutgoing ? 'Sent' : 'Received'}
            </Text>
            <Text style={tw`text-sm text-gray-500`}>
              {isOutgoing ? `To: ${item.to.slice(0, 10)}...` : `From: ${item.from.slice(0, 10)}...`}
            </Text>
          </View>
          <View style={tw`items-end`}>
            <Text
              style={tw`font-bold ${isOutgoing ? 'text-red-600' : 'text-green-600'}`}
            >
              {isOutgoing ? '-' : '+'}{item.value}
            </Text>
            <View
              style={tw`px-2 py-1 rounded mt-1 ${
                item.status === 'confirmed'
                  ? 'bg-green-100'
                  : item.status === 'failed'
                  ? 'bg-red-100'
                  : 'bg-yellow-100'
              }`}
            >
              <Text
                style={tw`text-xs ${
                  item.status === 'confirmed'
                    ? 'text-green-700'
                    : item.status === 'failed'
                    ? 'text-red-700'
                    : 'text-yellow-700'
                }`}
              >
                {item.status}
              </Text>
            </View>
          </View>
        </View>
        <Text style={tw`text-xs text-gray-400`}>
          {format(new Date(item.timestamp), 'MMM dd, yyyy HH:mm')}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={tw`flex-1 bg-gray-50 p-4`}>
      <Text style={tw`text-xl font-bold text-gray-900 mb-4`}>
        Transaction History
      </Text>
      {isLoading ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={data?.transactions || []}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.hash}
          ListFooterComponent={
            data?.hasMore ? (
              <TouchableOpacity
                style={tw`bg-blue-500 p-4 rounded-lg mt-4`}
                onPress={() => setPage(page + 1)}
                disabled={isFetching}
              >
                <Text style={tw`text-white text-center font-semibold`}>
                  {isFetching ? 'Loading...' : 'Load More'}
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  )
}
