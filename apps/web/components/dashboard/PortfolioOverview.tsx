'use client'
import React from 'react'
import { useChainbaseBalance, useChainbaseAnalytics } from '@orya/wallet-core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, Activity, DollarSign } from 'lucide-react'

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const totalValueUSD = balanceData?.tokens.reduce(
    (acc, token) => acc + (token.priceUSD || 0) * parseFloat(token.balance),
    0
  ) || 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {balanceData?.balance.symbol} • {chainId}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.totalTransactions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all contracts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.totalValue}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analyticsData?.uniqueContracts} unique contracts
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Token Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {balanceData?.tokens.map((token, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {token.logo && (
                    <img
                      src={token.logo}
                      alt={token.symbol}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{token.symbol}</p>
                    <p className="text-sm text-muted-foreground">{token.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {parseFloat(token.balance).toFixed(4)}
                  </p>
                  {token.priceUSD && (
                    <p className="text-sm text-muted-foreground">
                      ${(parseFloat(token.balance) * token.priceUSD).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
