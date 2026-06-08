export const reownConfig = {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'fd2291f21ccf9b6aef6b4f5c91e1af2f',
  
  metadata: {
    name: 'ORŸA Wallet',
    description: 'Multi-chain wallet with MPC security and smart accounts',
    url: 'https://orya.io',
    icons: ['https://orya.io/logo.png'],
  },

  // Web3Wallet configuration
  web3WalletConfig: {
    core: {
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'fd2291f21ccf9b6aef6b4f5c91e1af2f',
    },
    metadata: {
      name: 'ORŸA Wallet',
      description: 'Multi-chain wallet with MPC security and smart accounts',
      url: 'https://orya.io',
      icons: ['https://orya.io/logo.png'],
    },
  },

  // WalletConnect Pay configuration
  payConfig: {
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'fd2291f21ccf9b6aef6b4f5c91e1af2f',
    enablePayments: true,
    supportedPaymentMethods: ['apple_pay', 'google_pay', 'card', 'crypto', 'exchange'],
  },

  // Analytics configuration
  analyticsConfig: {
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'fd2291f21ccf9b6aef6b4f5c91e1af2f',
    enableAnalytics: true,
  },

  // AppKit configuration (fallback)
  appKitConfig: {
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'fd2291f21ccf9b6aef6b4f5c91e1af2f',
    networks: [
      {
        chainId: 1,
        name: 'Ethereum',
        currency: 'ETH',
        explorerUrl: 'https://etherscan.io',
        rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC || 'https://eth-mainnet.g.alchemy.com/v2/',
      },
      {
        chainId: 137,
        name: 'Polygon',
        currency: 'MATIC',
        explorerUrl: 'https://polygonscan.com',
        rpcUrl: 'https://polygon-rpc.com',
      },
    ],
    metadata: {
      name: 'ORŸA Wallet',
      description: 'Multi-chain wallet',
      url: 'https://orya.io',
      icons: ['https://orya.io/logo.png'],
    },
    features: {
      analytics: true,
      email: false,
      socials: false,
    },
  },
};
