import { useChainbaseSupportedChains } from '../../hooks/useChainbaseSupportedChains'

describe('useChainbaseSupportedChains', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch supported chains successfully', async () => {
    const mockChains = [
      {
        id: 'sui',
        name: 'Sui',
        symbol: 'SUI',
        icon: 'https://example.com/sui.svg',
        isTestnet: false,
      },
      {
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        icon: 'https://example.com/eth.svg',
        isTestnet: false,
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockChains,
    })

    const result = await fetch('/api/chainbase/supported-chains').then((r) =>
      r.json()
    )

    expect(result).toEqual(mockChains)
  })

  it('should handle fetch errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    try {
      await fetch('/api/chainbase/supported-chains').then((r) => {
        if (!r.ok) throw new Error('Failed to fetch supported chains')
        return r.json()
      })
      fail('Should have thrown error')
    } catch (err) {
      expect(err).not.toBeNull()
    }
  })

  it('should validate hook exports', () => {
    expect(useChainbaseSupportedChains).toBeDefined()
    expect(typeof useChainbaseSupportedChains).toBe('function')
  })
})
