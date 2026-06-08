import { renderHook, waitFor } from '@testing-library/react'
import { useChainbaseTransactions } from '../../hooks/useChainbaseTransactions'

describe('useChainbaseTransactions', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch transactions successfully', async () => {
    const mockData = {
      transactions: [
        {
          hash: '0xabc123',
          from: '0x123',
          to: '0x456',
          value: '1.0',
          status: 'confirmed' as const,
          timestamp: new Date().toISOString(),
        },
      ],
      hasMore: false,
      total: 1,
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const { result } = renderHook(() =>
      useChainbaseTransactions({
        address: '0x123',
        chainId: '1',
        limit: 20,
        offset: 0,
      })
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('should handle pagination', async () => {
    const mockData = {
      transactions: [
        {
          hash: '0xdef456',
          from: '0x123',
          to: '0x789',
          value: '2.0',
          status: 'confirmed' as const,
          timestamp: new Date().toISOString(),
        },
      ],
      hasMore: true,
      total: 2,
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const { result } = renderHook(() =>
      useChainbaseTransactions({
        address: '0x123',
        chainId: '1',
        limit: 20,
        offset: 20,
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data?.hasMore).toBe(true)
  })

  it('should handle fetch errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Fetch failed')
    )

    const { result } = renderHook(() =>
      useChainbaseTransactions({
        address: '0x123',
        chainId: '1',
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).not.toBeNull()
    expect(result.current.data).toBeNull()
  })
})
