import { useCallback, useState, useEffect } from 'react'

export interface Token {
  symbol: string
  name: string
  balance: string
  decimals: number
  contractAddress: string
  logo?: string
  priceUSD?: number
}

export interface BalanceData {
  balance: {
    symbol: string
    balance: string
  }
  tokens: Token[]
}

export interface UseChainbaseBalanceProps {
  address: string
  chainId: string
}

export interface UseChainbaseBalanceReturn {
  data: BalanceData | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useChainbaseBalance({
  address,
  chainId,
}: UseChainbaseBalanceProps): UseChainbaseBalanceReturn {
  const [data, setData] = useState<BalanceData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchBalance = useCallback(async () => {
    if (!address || !chainId) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/chainbase/balance?address=${address}&chainId=${chainId}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch balance')
      }

      const balanceData = await response.json()
      setData(balanceData)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }, [address, chainId])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  return {
    data,
    isLoading,
    error,
    refetch: fetchBalance,
  }
}
