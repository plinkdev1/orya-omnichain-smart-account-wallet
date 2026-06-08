import { renderHook, waitFor } from '@testing-library/react'
import { useChainbaseBalance } from '../../hooks/useChainbaseBalance'

describe('useChainbaseBalance', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch balance data successfully', async () => {
    const mockData = {
      balance: { symbol: 'ETH', balance: '1.5' },
      tokens: [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          balance: '1.5',
          decimals: 18,
          contractAddress: '0x',
          priceUSD: 2000,
        },
      ],
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const { result } = renderHook(() =>
      useChainbaseBalance({
        address: '0x123',
        chainId: '1',
      })
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('should handle fetch errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Fetch failed')
    )

    const { result } = renderHook(() =>
      useChainbaseBalance({
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

  it('should not fetch when address or chainId is missing', () => {
    renderHook(() =>
      useChainbaseBalance({
        address: '',
        chainId: '',
      })
    )

    expect(global.fetch).not.toHaveBeenCalled()
  })
})
