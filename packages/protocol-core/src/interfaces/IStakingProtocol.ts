/**
 * Standard interface for staking protocols
 */

import type { ProtocolSecurityInfo, HealthStatus } from './ISwapProtocol';

export interface StakeParams {
  /**
   * Amount to stake
   */
  amount: string;
  /**
   * Chain identifier
   */
  chainId: string;
  /**
   * User's wallet address
   */
  userAddress: string;
  /**
   * Lock period in seconds (if applicable)
   */
  duration?: number;
  /**
   * Validator address for delegated staking
   */
  validatorAddress?: string;
}

export interface StakeResult {
  /**
   * On-chain transaction hash
   */
  transactionHash: string;
  /**
   * Transaction status
   */
  status: 'pending' | 'confirmed' | 'failed';
  /**
   * Amount successfully staked
   */
  stakedAmount: string;
  /**
   * Liquid staking tokens received (if applicable)
   */
  lstTokensReceived?: string;
  /**
   * Estimated annual percentage yield
   */
  estimatedRewardsAPY: number;
}

export interface UnstakeParams {
  /**
   * Amount to unstake
   */
  amount: string;
  /**
   * User's wallet address
   */
  userAddress: string;
  /**
   * Position ID if protocol requires it
   */
  positionId?: string;
}

export interface StakingPosition {
  /**
   * Unique position identifier
   */
  id: string;
  /**
   * Current staked amount
   */
  stakedAmount: string;
  /**
   * Accumulated rewards
   */
  rewardsEarned: string;
  /**
   * Current annual percentage yield
   */
  apy: number;
  /**
   * When position was created
   */
  stakedAt: Date;
  /**
   * When tokens will be unlocked (if locked)
   */
  unlockAt?: Date;
  /**
   * Position status
   */
  status: 'active' | 'unstaking' | 'withdrawn';
}

/**
 * IStakingProtocol - Standard interface all staking protocol adapters must implement
 * 
 * @example
 * ```typescript
 * class SpringSUIStakingAdapter implements IStakingProtocol {
 *   readonly name = "Spring SUI Staking";
 *   readonly chainId = "sui";
 *   // ... implementation
 * }
 * ```
 */
export interface IStakingProtocol {
  /**
   * Protocol display name
   */
  readonly name: string;
  /**
   * Chain this protocol operates on
   */
  readonly chainId: string;
  /**
   * URL to protocol logo
   */
  readonly logoUrl: string;
  /**
   * Protocol adapter version
   */
  readonly version: string;

  /**
   * Stake tokens with protocol
   */
  stake(params: StakeParams): Promise<StakeResult>;

  /**
   * Initiate unstaking process
   */
  unstake(params: UnstakeParams): Promise<StakeResult>;

  /**
   * Claim accumulated rewards
   */
  claimRewards(userAddress: string): Promise<StakeResult>;

  /**
   * Get all staking positions for a user
   */
  getStakingPositions(userAddress: string): Promise<StakingPosition[]>;

  /**
   * Get total amount staked by user across all positions
   */
  getTotalStaked(userAddress: string): Promise<string>;

  /**
   * Get pending rewards for user
   */
  getPendingRewards(userAddress: string): Promise<string>;

  /**
   * Get current annual percentage yield
   */
  getCurrentAPY(): Promise<number>;

  /**
   * Get minimum stake amount for protocol
   */
  getMinStakeAmount(): Promise<string>;

  /**
   * Get unstaking period in seconds
   */
  getUnstakingPeriod(): Promise<number>;

  /**
   * Get total value locked across all users
   */
  getTotalValueLocked(): Promise<string>;

  /**
   * Whether this is a liquid staking protocol
   */
  isLiquidStaking(): boolean;

  /**
   * Get address of liquid staking token (if applicable)
   */
  getLSTTokenAddress?(): string;

  /**
   * Get current exchange rate from LST to native token
   */
  getLSTExchangeRate?(): Promise<number>;

  /**
   * Get security information about this protocol
   */
  getSecurityInfo(): ProtocolSecurityInfo;

  /**
   * Check if protocol is currently available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get current health status of protocol endpoints
   */
  getHealthStatus(): Promise<HealthStatus>;
}
