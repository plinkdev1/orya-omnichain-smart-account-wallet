import { ReOwnWalletManager, ReOwnManagerConfig } from './ReOwnWalletManager';
import { mainnet, polygonMainnet, arbitrumMainnet, optimismMainnet } from '@reown/appkit-networks/evm';
import { solanaMainnet } from '@reown/appkit-networks/solana';

export const PROJECT_ID = process.env.REACT_APP_REOWN_PROJECT_ID || 'fd2291f21ccf9b6aef6b4f5c91e1af2f';

export const reownConfig: ReOwnManagerConfig = {
  reown: {
    projectId: PROJECT_ID,
    name: 'ORYA Wallet',
    description: 'Multi-chain wallet supporting SUI, Solana, and EVM networks',
    url: process.env.REACT_APP_WALLET_URL || 'https://oryawallet.com',
    icons: [process.env.REACT_APP_WALLET_ICON || 'https://oryawallet.com/icon.png']
  },
  session: {
    ttl: 86400000,
    maxSessions: 10,
    autoCleanup: true,
    cleanupInterval: 3600000
  },
  signingQueue: {
    maxQueueSize: 50,
    requestTimeout: 300000,
    batchSize: 10
  }
};

export function initializeReOwnManager(): ReOwnWalletManager {
  const manager = ReOwnWalletManager.initialize(reownConfig);

  if (!manager.validateConfiguration()) {
    console.warn('ReOwn configuration validation failed - limited functionality');
    return manager;
  }

  manager.registerChains([
    mainnet,
    polygonMainnet,
    arbitrumMainnet,
    optimismMainnet,
    solanaMainnet
  ]);

  console.log('✅ ReOwn Wallet Manager initialized successfully');
  console.log(`Project ID: ${reownConfig.reown.projectId}`);
  console.log('Chains registered:', ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Solana']);

  return manager;
}

export function getReOwnManagerInstance(): ReOwnWalletManager {
  try {
    return ReOwnWalletManager.getInstance();
  } catch {
    return initializeReOwnManager();
  }
}
