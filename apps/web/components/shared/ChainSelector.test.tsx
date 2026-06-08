import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChainSelector } from './ChainSelector'
import * as walletCore from '@orya/wallet-core'

jest.mock('@orya/wallet-core')

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
    id: 'solana-devnet',
    name: 'Solana Devnet',
    symbol: 'SOL',
    icon: 'https://example.com/sol.svg',
    isTestnet: true,
  },
]

describe('ChainSelector (Web)', () => {
  const mockOnOpenChange = jest.fn()
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

  it('should render the dialog when open', () => {
    render(
      <ChainSelector
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    expect(screen.getByText('Select Chain')).toBeInTheDocument()
  })

  it('should display all available chains', async () => {
    render(
      <ChainSelector
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Sui')).toBeInTheDocument()
      expect(screen.getByText('Ethereum')).toBeInTheDocument()
      expect(screen.getByText('Solana Devnet')).toBeInTheDocument()
    })
  })

  it('should display symbol for each chain', async () => {
    render(
      <ChainSelector
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/SUI/)).toBeInTheDocument()
      expect(screen.getByText(/ETH/)).toBeInTheDocument()
      expect(screen.getByText(/SOL/)).toBeInTheDocument()
    })
  })

  it('should highlight the currently selected chain', async () => {
    render(
      <ChainSelector
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
        currentChainId="ethereum"
      />
    )

    await waitFor(() => {
      const ethereumButton = screen.getByRole('button', { name: /Ethereum/ })
      expect(ethereumButton).toHaveClass('bg-primary/10')
    })
  })

  it('should display checkmark for selected chain', async () => {
    render(
      <ChainSelector
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
        currentChainId="ethereum"
      />
    )

    await waitFor(() => {
      const ethereumButton = screen.getByRole('button', { name: /Ethereum/ })
      expect(ethereumButton.querySelector('svg')).toBeInTheDocument()
    })
  })

  it('should filter chains by search query', async () => {
    const { container } = render(
      <ChainSelector
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    const searchInput = screen.getByPlaceholderText('Search chains...')
    fireEvent.change(searchInput, { target: { value: 'eth' } })

    await waitFor(() => {
      expect(screen.getByText('Ethereum')).toBeInTheDocument()
      expect(screen.queryByText('Solana Devnet')).not.toBeInTheDocument()
    })
  })

  it('should filter chains by symbol', async () => {
    render(
      <ChainSelector
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    const searchInput = screen.getByPlaceholderText('Search chains...')
    fireEvent.change(searchInput, { target: { value: 'SOL' } })

    await waitFor(() => {
      expect(screen.getByText('Solana Devnet')).toBeInTheDocument()
      expect(screen.queryByText('Ethereum')).not.toBeInTheDocument()
    })
  })

  it('should display "No chains found" message when search has no results', async () => {
    render(
      <ChainSelector
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    const searchInput = screen.getByPlaceholderText('Search chains...')
    fireEvent.change(searchInput, { target: { value: 'xyz' } })

    await waitFor(() => {
      expect(screen.getByText('No chains found')).toBeInTheDocument()
    })
  })

  it('should call onSelect when a chain is selected', async () => {
    render(
      <ChainSelector
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    const ethereumButton = screen.getByRole('button', { name: /Ethereum/ })
    fireEvent.click(ethereumButton)

    expect(mockOnSelect).toHaveBeenCalledWith('ethereum')
  })

  it('should close dialog after selecting a chain', async () => {
    render(
      <ChainSelector
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    const ethereumButton = screen.getByRole('button', { name: /Ethereum/ })
    fireEvent.click(ethereumButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
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
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument()
  })

  it('should display chain count footer', async () => {
    render(
      <ChainSelector
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('3 chains available')).toBeInTheDocument()
    })
  })

  it('should display testnet tag for testnet chains', async () => {
    render(
      <ChainSelector
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/Testnet/)).toBeInTheDocument()
    })
  })

  it('should not render when closed', () => {
    render(
      <ChainSelector
        open={false}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    expect(screen.queryByText('Select Chain')).not.toBeInTheDocument()
  })

  it('should support clearing search query', async () => {
    render(
      <ChainSelector
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
        currentChainId="sui"
      />
    )

    const searchInput = screen.getByPlaceholderText(
      'Search chains...'
    ) as HTMLInputElement
    fireEvent.change(searchInput, { target: { value: 'eth' } })

    await waitFor(() => {
      expect(searchInput.value).toBe('eth')
    })

    fireEvent.change(searchInput, { target: { value: '' } })

    await waitFor(() => {
      expect(screen.getByText('Sui')).toBeInTheDocument()
      expect(screen.getByText('Ethereum')).toBeInTheDocument()
      expect(screen.getByText('Solana Devnet')).toBeInTheDocument()
    })
  })
})
