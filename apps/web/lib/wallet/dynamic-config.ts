import type { DynamicContextProps } from '@dynamic-labs/sdk-react-core';

export const dynamicConfig: Partial<DynamicContextProps> = {
  settings: {
    environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || '767c2cc9-58f9-4983-8fb7-f316fb103540',
    
    // Theme configuration
    theme: 'dark',
    
    // Network configuration
    networkMap: [
      {
        blockchainId: 'EVM',
        chainName: 'ethereum',
        chainId: 1,
        iconUrl: 'https://app.dynamic.xyz/assets/networks/ethereum.svg',
        nativeTokenSymbol: 'ETH',
      },
      {
        blockchainId: 'EVM',
        chainName: 'polygon',
        chainId: 137,
        iconUrl: 'https://app.dynamic.xyz/assets/networks/polygon.svg',
        nativeTokenSymbol: 'MATIC',
      },
      {
        blockchainId: 'EVM',
        chainName: 'arbitrum',
        chainId: 42161,
        iconUrl: 'https://app.dynamic.xyz/assets/networks/arbitrum.svg',
        nativeTokenSymbol: 'ETH',
      },
      {
        blockchainId: 'EVM',
        chainName: 'optimism',
        chainId: 10,
        iconUrl: 'https://app.dynamic.xyz/assets/networks/optimism.svg',
        nativeTokenSymbol: 'ETH',
      },
      {
        blockchainId: 'SOLANA',
        chainName: 'solana',
        chainId: 'mainnet-beta',
        iconUrl: 'https://app.dynamic.xyz/assets/networks/solana.svg',
        nativeTokenSymbol: 'SOL',
      },
      {
        blockchainId: 'SUI',
        chainName: 'sui',
        chainId: 'sui:mainnet',
        iconUrl: 'https://app.dynamic.xyz/assets/networks/sui.svg',
        nativeTokenSymbol: 'SUI',
      },
    ],

    // Wallet connectors configuration
    walletConnectors: [
      'EthereumWallet',
      'SolanaWallet',
      'SuiWallet',
      'CosmosWallet',
      'BitcoinWallet',
      'AlgorandWallet',
    ],

    // Features
    mergeWallets: true,
    multipleWallets: true,
    
    // Event handlers
    customAuthMethods: [],
    
    // UI
    eventsCallbacks: {
      onAuthSuccess: () => {
        console.log('User authenticated successfully');
      },
      onAuthFailure: (error) => {
        console.error('Authentication failed:', error);
      },
    },
  },
};
