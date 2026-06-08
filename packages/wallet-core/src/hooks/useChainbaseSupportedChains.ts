import { useCallback, useState, useEffect } from 'react'

export interface ChainInfo {
  id: string
  name: string
  symbol: string
  icon: string
  isTestnet: boolean
  rpcUrl?: string
  explorerUrl?: string
  nativeDecimals?: number
}

export interface UseChainbaseSupportedChainsReturn {
  data: ChainInfo[] | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

const CHAINBASE_API_CACHE_KEY = 'orya-chainbase-supported-chains'
const CACHE_DURATION = 24 * 60 * 60 * 1000

function getCachedChains(): ChainInfo[] | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const cached = localStorage.getItem(CHAINBASE_API_CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data
      }
    }
  } catch {
    // Ignore cache errors
  }

  return null
}

function setCachedChains(chains: ChainInfo[]): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(
      CHAINBASE_API_CACHE_KEY,
      JSON.stringify({
        data: chains,
        timestamp: Date.now(),
      })
    )
  } catch {
    // Ignore cache errors
  }
}

function getApiUrl(): string {
  if (typeof window === 'undefined' && typeof process !== 'undefined') {
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
  }

  if (typeof window !== 'undefined') {
    const windowEnv = (window as any).__ENV__ || {}
    return windowEnv.REACT_APP_API_URL || ''
  }

  return ''
}

export function useChainbaseSupportedChains(): UseChainbaseSupportedChainsReturn {
  const [data, setData] = useState<ChainInfo[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchChains = useCallback(async () => {
    const cachedChains = getCachedChains()
    if (cachedChains) {
      setData(cachedChains)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const apiUrl = getApiUrl()
      const url = apiUrl
        ? `${apiUrl}/api/chainbase/supported-chains`
        : '/api/chainbase/supported-chains'

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch supported chains')
      }

      const chainsData: ChainInfo[] = await response.json()
      setData(chainsData)
      setCachedChains(chainsData)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      console.error('Error fetching supported chains:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChains()
  }, [fetchChains])

  return {
    data,
    isLoading,
    error,
    refetch: fetchChains,
  }
}
