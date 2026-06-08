import { useCallback, useState, useEffect } from 'react'

export interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  status: 'pending' | 'confirmed' | 'failed'
  timestamp: string
  gasUsed?: string
  gasPrice?: string
  token?: {
    symbol: string
    decimals: number
  }
}

export interface TransactionsData {
  transactions: Transaction[]
  hasMore: boolean
  total: number
}

export interface UseChainbaseTransactionsProps {
  address: string
  chainId: string
  limit?: number
  offset?: number
}

export interface UseChainbaseTransactionsReturn {
  data: TransactionsData | null
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useChainbaseTransactions({
  address,
  chainId,
  limit = 20,
  offset = 0,
}: UseChainbaseTransactionsProps): UseChainbaseTransactionsReturn {
  const [data, setData] = useState<TransactionsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!address || !chainId) {
      return
    }

    const isInitial = offset === 0
    if (isInitial) {
      setIsLoading(true)
    } else {
      setIsFetching(true)
    }
    setError(null)

    try {
      const params = new URLSearchParams({
        address,
        chainId,
        limit: String(limit),
        offset: String(offset),
      })

      const response = await fetch(
        `/api/chainbase/transactions?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const transactionsData = await response.json()
      
      if (offset === 0) {
        setData(transactionsData)
      } else {
        setData((prev) => {
          if (!prev) return transactionsData
          return {
            ...transactionsData,
            transactions: [...prev.transactions, ...transactionsData.transactions],
          }
        })
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
    } finally {
      setIsLoading(false)
      setIsFetching(false)
    }
  }, [address, chainId, limit, offset])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return {
    data,
    isLoading,
    isFetching,
    error,
    refetch: fetchTransactions,
  }
}
