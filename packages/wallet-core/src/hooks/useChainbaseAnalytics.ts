import { useCallback, useState, useEffect } from 'react'

export interface AnalyticsData {
  totalTransactions: number
  uniqueContracts: number
  totalValue: string
  dailyChangePercent: number
  weeklyChangePercent: number
  monthlyChangePercent: number
}

export interface UseChainbaseAnalyticsReturn {
  data: AnalyticsData | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useChainbaseAnalytics(
  address: string,
  chainId: string
): UseChainbaseAnalyticsReturn {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchAnalytics = useCallback(async () => {
    if (!address || !chainId) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/chainbase/analytics?address=${address}&chainId=${chainId}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }, [address, chainId])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    data,
    isLoading,
    error,
    refetch: fetchAnalytics,
  }
}
