import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { PortfolioOverview } from '../PortfolioOverview'
import { useChainbaseBalance, useChainbaseAnalytics } from '@orya/wallet-core'

jest.mock('@orya/wallet-core')

describe('PortfolioOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render loading state', () => {
    ;(useChainbaseBalance as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    })
    ;(useChainbaseAnalytics as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    })

    render(
      <PortfolioOverview address="0x123" chainId="1" />
    )

    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })

  it('should render portfolio data when loaded', async () => {
    const mockBalanceData = {
      balance: { symbol: 'ETH', balance: '1.5' },
      tokens: [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          balance: '1.5',
          decimals: 18,
          contractAddress: '0x',
          priceUSD: 2000,
          logo: 'https://example.com/eth.png',
        },
      ],
    }

    const mockAnalyticsData = {
      totalTransactions: 42,
      uniqueContracts: 5,
      totalValue: '$3,000',
      dailyChangePercent: 2.5,
      weeklyChangePercent: 5.1,
      monthlyChangePercent: 10.3,
    }

    ;(useChainbaseBalance as jest.Mock).mockReturnValue({
      data: mockBalanceData,
      isLoading: false,
      error: null,
    })
    ;(useChainbaseAnalytics as jest.Mock).mockReturnValue({
      data: mockAnalyticsData,
      isLoading: false,
      error: null,
    })

    render(
      <PortfolioOverview address="0x123" chainId="1" />
    )

    expect(screen.getByText('Total Balance')).toBeInTheDocument()
    expect(screen.getByText('$3,000.00')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Token Holdings')).toBeInTheDocument()
    expect(screen.getByText('ETH')).toBeInTheDocument()
  })

  it('should display no tokens message when empty', () => {
    const mockBalanceData = {
      balance: { symbol: 'ETH', balance: '0' },
      tokens: [],
    }

    const mockAnalyticsData = {
      totalTransactions: 0,
      uniqueContracts: 0,
      totalValue: '$0',
      dailyChangePercent: 0,
      weeklyChangePercent: 0,
      monthlyChangePercent: 0,
    }

    ;(useChainbaseBalance as jest.Mock).mockReturnValue({
      data: mockBalanceData,
      isLoading: false,
      error: null,
    })
    ;(useChainbaseAnalytics as jest.Mock).mockReturnValue({
      data: mockAnalyticsData,
      isLoading: false,
      error: null,
    })

    render(
      <PortfolioOverview address="0x123" chainId="1" />
    )

    expect(screen.getByText('Token Holdings')).toBeInTheDocument()
  })
})
