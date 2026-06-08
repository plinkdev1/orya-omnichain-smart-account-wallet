import React from 'react'
import { View, Text, ScrollView, ActivityIndicator, Image } from 'react-native'
import { useChainbaseBalance, useChainbaseAnalytics } from '@orya/wallet-core'
import { tw } from 'nativewind'

interface PortfolioOverviewProps {
  address: string
  chainId: string
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  address,
  chainId,
}) => {
  const { data: balanceData, isLoading: balanceLoading } = useChainbaseBalance({
    address,
    chainId,
  })
  const { data: analyticsData, isLoading: analyticsLoading } = useChainbaseAnalytics(
    address,
    chainId
  )

  if (balanceLoading || analyticsLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  const totalValueUSD = balanceData?.tokens.reduce(
    (acc, token) => acc + (token.priceUSD || 0) * parseFloat(token.balance),
    0
  ) || 0

  return (
    <ScrollView style={tw`flex-1 bg-gray-50`}>
      <View style={tw`bg-white rounded-xl m-4 p-6 shadow-sm`}>
        <Text style={tw`text-gray-600 text-sm mb-1`}>Total Balance</Text>
        <Text style={tw`text-3xl font-bold text-gray-900`}>
          ${totalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
        <Text style={tw`text-gray-500 text-sm mt-2`}>
          {balanceData?.balance.symbol} • {chainId}
        </Text>
      </View>

      {analyticsData && (
        <View style={tw`bg-white rounded-xl m-4 p-6 shadow-sm`}>
          <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>Analytics</Text>
          <View style={tw`flex-row justify-between mb-3`}>
            <Text style={tw`text-gray-600`}>Total Transactions</Text>
            <Text style={tw`font-semibold`}>{analyticsData.totalTransactions}</Text>
          </View>
          <View style={tw`flex-row justify-between mb-3`}>
            <Text style={tw`text-gray-600`}>Unique Contracts</Text>
            <Text style={tw`font-semibold`}>{analyticsData.uniqueContracts}</Text>
          </View>
          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-gray-600`}>Total Value</Text>
            <Text style={tw`font-semibold`}>{analyticsData.totalValue}</Text>
          </View>
        </View>
      )}

      <View style={tw`bg-white rounded-xl m-4 p-6 shadow-sm`}>
        <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>Token Holdings</Text>
        {balanceData?.tokens.map((token, index) => (
          <View
            key={index}
            style={tw`flex-row items-center justify-between py-3 border-b border-gray-100`}
          >
            <View style={tw`flex-row items-center flex-1`}>
              {token.logo && (
                <Image
                  source={{ uri: token.logo }}
                  style={tw`w-10 h-10 rounded-full mr-3`}
                />
              )}
              <View>
                <Text style={tw`font-semibold text-gray-900`}>{token.symbol}</Text>
                <Text style={tw`text-sm text-gray-500`}>{token.name}</Text>
              </View>
            </View>
            <View style={tw`items-end`}>
              <Text style={tw`font-semibold text-gray-900`}>
                {parseFloat(token.balance).toFixed(4)}
              </Text>
              {token.priceUSD && (
                <Text style={tw`text-sm text-gray-500`}>
                  ${(parseFloat(token.balance) * token.priceUSD).toFixed(2)}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}
