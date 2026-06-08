/**
 * EigenLayer Service - Restaking and delegation management
 * Provides methods to manage restaking positions, operators, and rewards
 */

import { ApiClient } from './api-client';
import type {
  EigenLayerRestakingPosition,
  EigenLayerOperator,
  EigenLayerReward,
  RestakeTokensRequest,
  QueueWithdrawalRequest,
  ClaimRewardsRequest,
} from '@orya/shared-types';

export class EigenLayerService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Restake tokens into EigenLayer strategy
   */
  async restakeTokens(request: RestakeTokensRequest): Promise<{
    positionId: string;
    txHash: string;
    shares: string;
    estimatedAPY: number;
  }> {
    const mutation = `
      mutation RestakeTokens(
        $strategyAddress: String!
        $amount: String!
        $operatorAddress: String
        $autoCompound: Boolean
      ) {
        restakeTokens(
          strategyAddress: $strategyAddress
          amount: $amount
          operatorAddress: $operatorAddress
          autoCompound: $autoCompound
        ) {
          positionId
          txHash
          shares
          estimatedAPY
        }
      }
    `;
    const result = await this.apiClient.mutation<{
      restakeTokens: {
        positionId: string;
        txHash: string;
        shares: string;
        estimatedAPY: number;
      };
    }>(mutation, request);

    if (result.error) {
      throw new Error(`Failed to restake tokens: ${result.error}`);
    }

    if (!result.data) {
      throw new Error('No data returned from restake tokens mutation');
    }

    return result.data.restakeTokens;
  }

  /**
   * Get restaking positions for a user
   */
  async getRestakingPositions(userId: string): Promise<{
    positions: EigenLayerRestakingPosition[];
    totalValueStaked: string;
    totalRewardsEarned: string;
  }> {
    const query = `
      query GetRestakingPositions($userId: String!) {
        restakingPositions(userId: $userId) {
          positions {
            id
            userId
            strategyAddress
            tokenAddress
            amount
            shares
            operatorAddress
            stakedAt
            status
            estimatedAPY
            isDelegated
            withdrawalQueueId
            withdrawalCompletionTime
          }
          totalValueStaked
          totalRewardsEarned
        }
      }
    `;
    const result = await this.apiClient.query<{
      restakingPositions: {
        positions: EigenLayerRestakingPosition[];
        totalValueStaked: string;
        totalRewardsEarned: string;
      };
    }>(query, { userId });

    if (result.error) {
      throw new Error(`Failed to get restaking positions: ${result.error}`);
    }

    if (!result.data) {
      throw new Error('No data returned from restaking positions query');
    }

    return result.data.restakingPositions;
  }

  /**
   * Queue withdrawal from restaking position
   */
  async queueWithdrawal(request: QueueWithdrawalRequest): Promise<{
    withdrawalRoot: string;
    completionTimestamp: Date;
    txHash: string;
  }> {
    const mutation = `
      mutation QueueWithdrawal($positionId: String!, $amount: String) {
        queueWithdrawal(positionId: $positionId, amount: $amount) {
          withdrawalRoot
          completionTimestamp
          txHash
          delaySeconds
        }
      }
    `;
    const result = await this.apiClient.mutation<{
      queueWithdrawal: {
        withdrawalRoot: string;
        completionTimestamp: string;
        txHash: string;
        delaySeconds: number;
      };
    }>(mutation, request);

    if (result.error) {
      throw new Error(`Failed to queue withdrawal: ${result.error}`);
    }

    if (!result.data) {
      throw new Error('No data returned from queue withdrawal mutation');
    }

    return {
      ...result.data.queueWithdrawal,
      completionTimestamp: new Date(result.data.queueWithdrawal.completionTimestamp),
    };
  }

  /**
   * Complete a queued withdrawal
   */
  async completeWithdrawal(positionId: string): Promise<{ txHash: string }> {
    const mutation = `
      mutation CompleteWithdrawal($positionId: String!) {
        completeWithdrawal(positionId: $positionId) {
          txHash
        }
      }
    `;
    const result = await this.apiClient.mutation<{
      completeWithdrawal: { txHash: string };
    }>(mutation, { positionId });

    if (result.error) {
      throw new Error(`Failed to complete withdrawal: ${result.error}`);
    }

    if (!result.data) {
      throw new Error('No data returned from complete withdrawal mutation');
    }

    return result.data.completeWithdrawal;
  }

  /**
   * Get available operators
   */
  async getOperators(params?: {
    isActive?: boolean;
    minDelegated?: string;
    maxCommission?: number;
    limit?: number;
    offset?: number;
  }): Promise<EigenLayerOperator[]> {
    const query = `
      query GetOperators(
        $isActive: Boolean
        $minDelegated: String
        $maxCommission: Int
        $limit: Int
        $offset: Int
      ) {
        eigenLayerOperators(
          isActive: $isActive
          minDelegated: $minDelegated
          maxCommission: $maxCommission
          limit: $limit
          offset: $offset
        ) {
          address
          metadataURI
          delegationApprover
          stakerOptOutWindowBlocks
          isActive
          totalDelegated
          stakerCount
          commission
          lastUpdated
        }
      }
    `;
    const result = await this.apiClient.query<{
      eigenLayerOperators: EigenLayerOperator[];
    }>(query, params || {});

    if (result.error) {
      throw new Error(`Failed to get operators: ${result.error}`);
    }

    if (!result.data) {
      throw new Error('No data returned from operators query');
    }

    return result.data.eigenLayerOperators;
  }

  /**
   * Get rewards for a user
   */
  async getRewards(userId: string, claimed?: boolean): Promise<{
    rewards: EigenLayerReward[];
    totalUnclaimed: string;
  }> {
    const query = `
      query GetRewards($userId: String!, $claimed: Boolean) {
        eigenLayerRewards(userId: $userId, claimed: $claimed) {
          rewards {
            id
            userId
            strategyAddress
            rewardAmount
            rewardToken
            rewardTokenSymbol
            earnedAt
            claimed
            claimedAt
            claimTxHash
            estimatedUSD
          }
          totalUnclaimed
        }
      }
    `;
    const result = await this.apiClient.query<{
      eigenLayerRewards: {
        rewards: EigenLayerReward[];
        totalUnclaimed: string;
      };
    }>(query, { userId, claimed });

    if (result.error) {
      throw new Error(`Failed to get rewards: ${result.error}`);
    }

    if (!result.data) {
      throw new Error('No data returned from rewards query');
    }

    return result.data.eigenLayerRewards;
  }

  /**
   * Claim rewards
   */
  async claimRewards(request: ClaimRewardsRequest): Promise<{
    txHash: string;
    totalClaimed: string;
  }> {
    const mutation = `
      mutation ClaimRewards($rewardIds: [String!]!, $autoRestake: Boolean) {
        claimRewards(rewardIds: $rewardIds, autoRestake: $autoRestake) {
          txHash
          totalClaimed
          timestamp
        }
      }
    `;
    const result = await this.apiClient.mutation<{
      claimRewards: { txHash: string; totalClaimed: string; timestamp: string };
    }>(mutation, request);

    if (result.error) {
      throw new Error(`Failed to claim rewards: ${result.error}`);
    }

    if (!result.data) {
      throw new Error('No data returned from claim rewards mutation');
    }

    return {
      txHash: result.data.claimRewards.txHash,
      totalClaimed: result.data.claimRewards.totalClaimed,
    };
  }

  /**
   * Get APY for a strategy
   */
  async getStrategyAPY(strategyAddress: string): Promise<number> {
    const query = `
      query GetStrategyAPY($strategyAddress: String!) {
        eigenLayerStrategyAPY(strategyAddress: $strategyAddress) {
          apy
        }
      }
    `;
    const result = await this.apiClient.query<{
      eigenLayerStrategyAPY: { apy: number };
    }>(query, { strategyAddress });

    if (result.error) {
      throw new Error(`Failed to get strategy APY: ${result.error}`);
    }

    if (!result.data) {
      throw new Error('No data returned from strategy APY query');
    }

    return result.data.eigenLayerStrategyAPY.apy;
  }

  /**
   * Delegate to operator
   */
  async delegateToOperator(positionId: string, operatorAddress: string): Promise<{ txHash: string }> {
    const mutation = `
      mutation DelegateToOperator($positionId: String!, $operatorAddress: String!) {
        delegateToOperator(positionId: $positionId, operatorAddress: $operatorAddress) {
          txHash
          timestamp
        }
      }
    `;
    const result = await this.apiClient.mutation<{
      delegateToOperator: { txHash: string; timestamp: string };
    }>(mutation, { positionId, operatorAddress });

    if (result.error) {
      throw new Error(`Failed to delegate to operator: ${result.error}`);
    }

    if (!result.data) {
      throw new Error('No data returned from delegate to operator mutation');
    }

    return { txHash: result.data.delegateToOperator.txHash };
  }

  /**
   * Undelegate from operator
   */
  async undelegateFromOperator(positionId: string): Promise<{ txHash: string }> {
    const mutation = `
      mutation UndelegateFromOperator($positionId: String!) {
        undelegateFromOperator(positionId: $positionId) {
          txHash
          timestamp
        }
      }
    `;
    const result = await this.apiClient.mutation<{
      undelegateFromOperator: { txHash: string; timestamp: string };
    }>(mutation, { positionId });

    if (result.error) {
      throw new Error(`Failed to undelegate from operator: ${result.error}`);
    }

    if (!result.data) {
      throw new Error('No data returned from undelegate from operator mutation');
    }

    return { txHash: result.data.undelegateFromOperator.txHash };
  }
}
