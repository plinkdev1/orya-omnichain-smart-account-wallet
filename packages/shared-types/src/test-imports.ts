import {
  ChainbaseDataType,
  ChainbaseBalance,
  ChainbaseTransaction,
  GetChainbaseBalanceResponse,
} from './chainbase.types';

import {
  RestakingPositionStatus,
  EigenLayerOperator,
  EigenLayerRestakingPosition,
  RestakingSummary,
} from './eigenlayer.types';

export const testChainbaseTypes = (): ChainbaseBalance => ({
  chainType: 'ethereum' as any,
  address: 'test' as any,
  balance: '1000',
  decimals: 18,
  symbol: 'ETH',
  lastUpdated: new Date().toISOString(),
});

export const testEigenLayerTypes = (): RestakingSummary => ({
  userId: 'test' as any,
  totalValueStaked: '1000000',
  totalRewardsEarned: '500',
  totalRewardsClaimed: '250',
  unclaimedRewards: '250',
  activePositions: 2,
  queuedWithdrawals: 0,
  combinedAPY: 5.5,
  lastUpdate: new Date().toISOString(),
});
