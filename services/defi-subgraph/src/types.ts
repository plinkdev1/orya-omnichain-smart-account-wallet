export interface StakingOpportunity {
  id: string;
  chainId: string;
  protocol: string;
  tokenAddress: string;
  apy: number;
  tvl: number;
  lockPeriod?: number;
  minStake: string;
  maxStake?: string;
  rewardToken: string;
  isActive: boolean;
  validatorAddress?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface StakingPosition {
  id: string;
  userId: string;
  chainId: string;
  protocol: string;
  tokenAddress: string;
  stakedAmount: string;
  rewardsEarned: string;
  rewardToken: string;
  apy: number;
  stakedAt: Date;
  unlockAt?: Date;
  status: StakingStatus;
  validatorAddress?: string;
  metadata?: Record<string, any>;
  updatedAt: Date;
}

export enum StakingStatus {
  ACTIVE = 'ACTIVE',
  UNSTAKING = 'UNSTAKING',
  WITHDRAWN = 'WITHDRAWN',
  PENDING = 'PENDING',
}

export interface LendingMarket {
  id: string;
  chainId: string;
  protocol: string;
  assetAddress: string;
  assetName: string;
  assetSymbol: string;
  supplyApy: number;
  borrowApy: number;
  totalSupply: string;
  totalBorrow: string;
  utilizationRate: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface LendingPosition {
  id: string;
  userId: string;
  chainId: string;
  protocol: string;
  collateralToken: string;
  collateralAmount: string;
  collateralAmountUSD: number;
  borrowToken: string;
  borrowAmount: string;
  borrowAmountUSD: number;
  healthFactor: number;
  supplyApy: number;
  borrowApy: number;
  status: LendingStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum LendingStatus {
  ACTIVE = 'ACTIVE',
  LIQUIDATED = 'LIQUIDATED',
  CLOSED = 'CLOSED',
  AT_RISK = 'AT_RISK',
}

export interface YieldFarmingOpportunity {
  id: string;
  chainId: string;
  protocol: string;
  farmAddress: string;
  lpToken: string;
  rewardTokens: string[];
  apys: number[];
  tvl: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface YieldFarmingPosition {
  id: string;
  userId: string;
  chainId: string;
  protocol: string;
  farmAddress: string;
  lpTokenAmount: string;
  lpTokenAmountUSD: number;
  rewardsEarned: string[];
  rewardAmounts: string[];
  apys: number[];
  status: YieldFarmingStatus;
  depositedAt: Date;
  metadata?: Record<string, any>;
  updatedAt: Date;
}

export enum YieldFarmingStatus {
  ACTIVE = 'ACTIVE',
  HARVESTED = 'HARVESTED',
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING',
}

export interface PositionSummary {
  userId: string;
  chainId: string;
  totalStakedUSD: number;
  totalBorrowedUSD: number;
  totalCollateralUSD: number;
  totalFarmingUSD: number;
  totalRewardsUSD: number;
  totalValueLockedUSD: number;
  healthFactor: number;
  riskLevel: string;
}

export interface RewardCalculation {
  positionId: string;
  rewardToken: string;
  estimatedReward: string;
  estimatedRewardUSD: number;
  frequency: string;
  nextClaimAt?: Date;
}

export interface ProtocolHealth {
  protocol: string;
  chainId: string;
  isOperational: boolean;
  statusMessage?: string;
  lastCheckedAt: Date;
}

export interface StakeTokensInput {
  chainId: string;
  protocol: string;
  amount: string;
  validator?: string;
}

export interface UnstakeTokensInput {
  chainId: string;
  protocol: string;
  positionId: string;
  amount: string;
}

export interface ClaimRewardsInput {
  chainId: string;
  protocol: string;
  positionId: string;
}

export interface DepositLendingInput {
  chainId: string;
  protocol: string;
  assetAddress: string;
  amount: string;
}

export interface BorrowLendingInput {
  chainId: string;
  protocol: string;
  assetAddress: string;
  amount: string;
}

export interface RepayLendingInput {
  chainId: string;
  protocol: string;
  assetAddress: string;
  amount: string;
}

export interface DepositYieldFarmingInput {
  chainId: string;
  protocol: string;
  farmAddress: string;
  lpTokenAmount: string;
}

export interface WithdrawYieldFarmingInput {
  chainId: string;
  protocol: string;
  positionId: string;
  amount: string;
}

export interface HarvestRewardsInput {
  chainId: string;
  protocol: string;
  positionId: string;
}

export interface ProtocolAdapter {
  name: string;
  chainId: string;
  getStakingOpportunities(): Promise<StakingOpportunity[]>;
  getStakingPositions(userId: string): Promise<StakingPosition[]>;
  getLendingMarkets(): Promise<LendingMarket[]>;
  getLendingPositions(userId: string): Promise<LendingPosition[]>;
  getYieldFarmingOpportunities(): Promise<YieldFarmingOpportunity[]>;
  getYieldFarmingPositions(userId: string): Promise<YieldFarmingPosition[]>;
  calculateRewards(positionId: string): Promise<RewardCalculation>;
  stakeTokens(input: StakeTokensInput): Promise<string>;
  unstakeTokens(input: UnstakeTokensInput): Promise<string>;
  claimRewards(input: ClaimRewardsInput): Promise<string>;
  depositLending(input: DepositLendingInput): Promise<string>;
  borrowLending(input: BorrowLendingInput): Promise<string>;
  repayLending(input: RepayLendingInput): Promise<string>;
  depositYieldFarming(input: DepositYieldFarmingInput): Promise<string>;
  withdrawYieldFarming(input: WithdrawYieldFarmingInput): Promise<string>;
  harvestRewards(input: HarvestRewardsInput): Promise<string>;
  checkHealth(): Promise<ProtocolHealth>;
}

export interface PrismaContext {
  user: { id: string };
}

export interface GraphQLContext extends PrismaContext {
  redis: any;
  prisma: any;
  logger: any;
  protocolAdapters: Map<string, ProtocolAdapter>;
}
