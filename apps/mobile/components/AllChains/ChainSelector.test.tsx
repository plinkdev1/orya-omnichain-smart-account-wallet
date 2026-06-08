import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { ChainSelector } from './ChainSelector'
import * as walletCore from '@orya/wallet-core'

jest.mock('@orya/wallet-core', () => ({
  useChainbaseSupportedChains: jest.fn(),
}))

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
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    icon: 'https://example.com/sol.svg',
    isTestnet: true,
  },
]

describe('ChainSelector (Mobile)', () => {
  const mockOnClose = jest.fn()
  const mockOnSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(walletCore.useChainbaseSupportedChains as jest.Mock).mockReturnValue({
      data: mockChains,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })
  })

  it('should render the chain selector modal when visible', () => {
    render(
      <ChainSelector
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    expect(screen.getByText('Select Chain')).toBeDefined()
  })

  it('should display all available chains', async () => {
    render(
      <ChainSelector
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Sui')).toBeDefined()
      expect(screen.getByText('Ethereum')).toBeDefined()
      expect(screen.getByText('Solana')).toBeDefined()
    })
  })

  it('should highlight the currently selected chain', async () => {
    const { getByText } = render(
      <ChainSelector
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        currentChainId="ethereum"
      />
    )

    await waitFor(() => {
      const ethereumButton = getByText('Ethereum')
      expect(ethereumButton).toBeDefined()
    })
  })

  it('should filter chains by search query', async () => {
    const { getByPlaceholderText } = render(
      <ChainSelector
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    const searchInput = getByPlaceholderText('Search chains...')
    fireEvent.changeText(searchInput, 'Eth')

    await waitFor(() => {
      expect(screen.getByText('Ethereum')).toBeDefined()
      expect(screen.queryByText('Solana')).toBeNull()
    })
  })

  it('should call onSelect when a chain is selected', async () => {
    const { getByText } = render(
      <ChainSelector
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    const ethereumButton = getByText('Ethereum')
    fireEvent.press(ethereumButton)

    expect(mockOnSelect).toHaveBeenCalledWith('ethereum')
  })

  it('should close modal after selecting a chain', async () => {
    const { getByText } = render(
      <ChainSelector
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    const ethereumButton = getByText('Ethereum')
    fireEvent.press(ethereumButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should show loading state', () => {
    ;(walletCore.useChainbaseSupportedChains as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    })

    render(
      <ChainSelector
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    expect(screen.getByTestId('loading-spinner')).toBeDefined()
  })

  it('should display chain count footer', async () => {
    const { getByText } = render(
      <ChainSelector
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    await waitFor(() => {
      expect(getByText('3 chains available')).toBeDefined()
    })
  })

  it('should display testnet tag for testnet chains', async () => {
    const { getByText } = render(
      <ChainSelector
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    await waitFor(() => {
      expect(getByText(/Testnet/)).toBeDefined()
    })
  })

  it('should close modal when X button is pressed', () => {
    const { getByLabelText } = render(
      <ChainSelector
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    const closeButton = getByLabelText('Close chain selector')
    fireEvent.press(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })
})
