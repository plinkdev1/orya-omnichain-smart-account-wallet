/**
 * EigenLayer restaking integration types
 * Type definitions for EigenLayer strategies, operators, and restaking positions
 */

import { Address, UUID } from './common.types';
import { ChainType } from './chain.types';

/**
 * Restaking position status
 */
export enum RestakingPositionStatus {
  ACTIVE = 'active',
  QUEUED_WITHDRAWAL = 'queued_withdrawal',
  WITHDRAWN = 'withdrawn',
  SLASHED = 'slashed',
}

/**
 * Slashing event severity
 */
export enum SlashingSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * EigenLayer strategy contract
 */
export interface EigenLayerStrategy {
  /** Strategy contract address */
  address: Address;
  /** Underlying token address */
  tokenAddress: Address;
  /** Underlying token symbol */
  tokenSymbol: string;
  /** Total shares in strategy */
  totalShares: string;
  /** Underlying token contract */
  underlyingToken: Address;
  /** Strategy name */
  name?: string;
  /** Pause status */
  isPaused: boolean;
  /** Creation timestamp */
  createdAt: string;
}

/**
 * EigenLayer operator information
 */
export interface EigenLayerOperator {
  /** Operator address */
  address: Address;
  /** Metadata URI */
  metadataURI: string;
  /** Delegation approver address */
  delegationApprover: Address;
  /** Staker opt-out window in blocks */
  stakerOptOutWindowBlocks: number;
  /** Whether operator is active */
  isActive: boolean;
  /** Total delegated amount in wei */
  totalDelegated: string;
  /** Number of stakers delegated to this operator */
  stakerCount: number;
  /** Operator commission (in basis points) */
  commission?: number;
  /** Last update timestamp */
  lastUpdated: string;
}

/**
 * Restaking position for a user
 */
export interface EigenLayerRestakingPosition {
  /** Unique position ID */
  id: UUID;
  /** User ID */
  userId: UUID;
  /** Strategy contract address */
  strategyAddress: Address;
  /** Token address being staked */
  tokenAddress: Address;
  /** Amount staked in wei */
  amount: string;
  /** Shares received in strategy */
  shares: string;
  /** Operator address (if delegated) */
  operatorAddress?: Address;
  /** When the position was created */
  stakedAt: string;
  /** Current status of position */
  status: RestakingPositionStatus;
  /** Estimated APY (annual percentage yield) */
  estimatedAPY?: number;
  /** Whether position is delegated */
  isDelegated: boolean;
  /** Withdrawal queue ID (if queued) */
  withdrawalQueueId?: string;
  /** Withdrawal completion timestamp (if queued) */
  withdrawalCompletionTime?: string;
}

/**
 * Slashing event on EigenLayer
 */
export interface EigenLayerSlashingEvent {
  /** Event ID */
  id: UUID;
  /** Operator that was slashed */
  operatorAddress: Address;
  /** Strategy affected by slashing */
  strategyAddress: Address;
  /** Amount slashed in wei */
  slashedAmount: string;
  /** Block number of slash event */
  eventBlock: number;
  /** Timestamp of slash event */
  eventTimestamp: string;
  /** Transaction hash */
  txHash: string;
  /** Severity of slash */
  severity: SlashingSeverity;
  /** Reason for slash */
  reason?: string;
  /** Affected stakers count */
  affectedStakersCount?: number;
}

/**
 * Reward earned from restaking
 */
export interface EigenLayerReward {
  /** Reward ID */
  id: UUID;
  /** User who earned the reward */
  userId: UUID;
  /** Strategy that generated the reward */
  strategyAddress: Address;
  /** Amount of reward in wei */
  rewardAmount: string;
  /** Token in which reward is paid */
  rewardToken: Address;
  /** Symbol of reward token */
  rewardTokenSymbol: string;
  /** When the reward was earned */
  earnedAt: string;
  /** Whether reward has been claimed */
  claimed: boolean;
  /** When the reward was claimed (if claimed) */
  claimedAt?: string;
  /** Claim transaction hash (if claimed) */
  claimTxHash?: string;
  /** Estimated reward in USD */
  estimatedUSD?: number;
}

/**
 * Request to initiate restaking
 */
export interface RestakeTokensRequest {
  /** Strategy to stake in */
  strategyAddress: Address;
  /** Amount to stake in wei */
  amount: string;
  /** Optional operator to delegate to */
  operatorAddress?: Address;
  /** Whether to auto-compound rewards */
  autoCompound?: boolean;
}

/**
 * Response from restaking transaction
 */
export interface RestakeTokensResponse {
  /** New position ID */
  positionId: UUID;
  /** Deposit transaction hash */
  txHash: string;
  /** Shares received */
  shares: string;
  /** Estimated APY */
  estimatedAPY: number;
  /** Transaction timestamp */
  timestamp: string;
}

/**
 * Request to get user's restaking positions
 */
export interface GetRestakingPositionsRequest {
  /** User ID to query */
  userId: UUID;
  /** Optional chain filter */
  chainType?: ChainType;
  /** Optional status filter */
  status?: RestakingPositionStatus;
}

/**
 * Response for restaking positions query
 */
export interface GetRestakingPositionsResponse {
  /** Array of restaking positions */
  positions: EigenLayerRestakingPosition[];
  /** Total value staked in wei */
  totalValueStaked: string;
  /** Total rewards earned in wei */
  totalRewardsEarned: string;
  /** Combined estimated APY */
  combinedAPY: number;
  /** Query timestamp */
  timestamp: string;
}

/**
 * Request to queue withdrawal
 */
export interface QueueWithdrawalRequest {
  /** Position ID to withdraw from */
  positionId: UUID;
  /** Optional amount to withdraw (if not specified, withdraws all) */
  amount?: string;
}

/**
 * Response from queue withdrawal transaction
 */
export interface QueueWithdrawalResponse {
  /** Withdrawal root hash */
  withdrawalRoot: string;
  /** When withdrawal can be completed */
  completionTimestamp: string;
  /** Queue transaction hash */
  txHash: string;
  /** Delay in seconds until withdrawal is available */
  delaySeconds: number;
}

/**
 * Request to complete withdrawal
 */
export interface CompleteWithdrawalRequest {
  /** Position ID being withdrawn from */
  positionId: UUID;
  /** Withdrawal root hash */
  withdrawalRoot: string;
  /** Merkle proof for withdrawal */
  merkleProof: string[];
}

/**
 * Response from complete withdrawal transaction
 */
export interface CompleteWithdrawalResponse {
  /** Position ID that was withdrawn */
  positionId: UUID;
  /** Amount withdrawn in wei */
  amount: string;
  /** Withdrawal transaction hash */
  txHash: string;
  /** Withdrawal timestamp */
  timestamp: string;
}

/**
 * Request to get active operators
 */
export interface GetOperatorsRequest {
  /** Filter by active status */
  isActive?: boolean;
  /** Optional minimum delegated amount */
  minDelegated?: string;
  /** Optional maximum commission */
  maxCommission?: number;
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
}

/**
 * Response for operators query
 */
export interface GetOperatorsResponse {
  /** Array of operators */
  operators: EigenLayerOperator[];
  /** Total number of operators */
  total: number;
  /** Query timestamp */
  timestamp: string;
}

/**
 * Request to get rewards
 */
export interface GetRewardsRequest {
  /** User ID to query */
  userId: UUID;
  /** Filter by claimed status */
  claimed?: boolean;
  /** Optional strategy filter */
  strategyAddress?: Address;
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
}

/**
 * Response for rewards query
 */
export interface GetRewardsResponse {
  /** Array of rewards */
  rewards: EigenLayerReward[];
  /** Total unclaimed rewards in wei */
  totalUnclaimed: string;
  /** Total claimed rewards in wei */
  totalClaimed: string;
  /** Query timestamp */
  timestamp: string;
}

/**
 * Request to claim rewards
 */
export interface ClaimRewardsRequest {
  /** Array of reward IDs to claim */
  rewardIds: UUID[];
  /** Whether to auto-stake claimed rewards */
  autoRestake?: boolean;
}

/**
 * Response from claim rewards transaction
 */
export interface ClaimRewardsResponse {
  /** Claim transaction hash */
  txHash: string;
  /** Total amount claimed in wei */
  totalClaimed: string;
  /** Claim timestamp */
  timestamp: string;
}

/**
 * Request to delegate to operator
 */
export interface DelegateToOperatorRequest {
  /** Position ID to delegate */
  positionId: UUID;
  /** Operator address to delegate to */
  operatorAddress: Address;
}

/**
 * Response from delegation transaction
 */
export interface DelegateToOperatorResponse {
  /** Position ID */
  positionId: UUID;
  /** Operator address delegated to */
  operatorAddress: Address;
  /** Delegation transaction hash */
  txHash: string;
  /** Delegation timestamp */
  timestamp: string;
}

/**
 * Request to undelegate from operator
 */
export interface UndelegateFromOperatorRequest {
  /** Position ID to undelegate */
  positionId: UUID;
}

/**
 * Response from undelegation transaction
 */
export interface UndelegateFromOperatorResponse {
  /** Position ID */
  positionId: UUID;
  /** Undelegation transaction hash */
  txHash: string;
  /** Undelegation timestamp */
  timestamp: string;
}

/**
 * Restaking summary for a user
 */
export interface RestakingSummary {
  /** User ID */
  userId: UUID;
  /** Total value staked across all positions */
  totalValueStaked: string;
  /** Total rewards earned */
  totalRewardsEarned: string;
  /** Total rewards claimed */
  totalRewardsClaimed: string;
  /** Unclaimed rewards */
  unclaimedRewards: string;
  /** Number of active positions */
  activePositions: number;
  /** Number of queued withdrawals */
  queuedWithdrawals: number;
  /** Combined estimated APY */
  combinedAPY: number;
  /** Last position update */
  lastUpdate: string;
}
