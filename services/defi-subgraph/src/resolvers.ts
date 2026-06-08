import type { GraphQLContext } from './types';
import { StakingService } from './services/staking-service';
import { LendingService } from './services/lending-service';
import { YieldFarmingService } from './services/yield-farming-service';
import { RewardsService } from './services/rewards-service';
import { logger } from './utils/logger';

export const resolvers = {
  Query: {
    async stakingOpportunities(
      _: any,
      { chainId, protocol }: { chainId: string; protocol?: string },
      context: GraphQLContext
    ) {
      try {
        const stakingService = new StakingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        return stakingService.getStakingOpportunities(chainId, protocol);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch staking opportunities');
        throw error;
      }
    },

    async stakingOpportunity(
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) {
      try {
        const stakingService = new StakingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        const opportunities = await stakingService.getStakingOpportunities('all');
        return opportunities.find((opp) => opp.id === id) || null;
      } catch (error) {
        logger.error({ error }, 'Failed to fetch staking opportunity');
        throw error;
      }
    },

    async stakingPositions(
      _: any,
      { userId, chainId }: { userId: string; chainId?: string },
      context: GraphQLContext
    ) {
      try {
        const stakingService = new StakingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        return stakingService.getStakingPositions(userId, chainId);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch staking positions');
        throw error;
      }
    },

    async stakingPosition(
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) {
      try {
        const stakingService = new StakingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        return stakingService.getStakingPosition(id);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch staking position');
        throw error;
      }
    },

    async lendingMarkets(
      _: any,
      { chainId, protocol }: { chainId: string; protocol?: string },
      context: GraphQLContext
    ) {
      try {
        const lendingService = new LendingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        return lendingService.getLendingMarkets(chainId, protocol);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch lending markets');
        throw error;
      }
    },

    async lendingMarket(
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) {
      try {
        const lendingService = new LendingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        return lendingService.getLendingMarket(id);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch lending market');
        throw error;
      }
    },

    async lendingPositions(
      _: any,
      { userId, chainId }: { userId: string; chainId?: string },
      context: GraphQLContext
    ) {
      try {
        const lendingService = new LendingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        return lendingService.getLendingPositions(userId, chainId);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch lending positions');
        throw error;
      }
    },

    async lendingPosition(
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) {
      try {
        const lendingService = new LendingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        return lendingService.getLendingPosition(id);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch lending position');
        throw error;
      }
    },

    async yieldFarmingOpportunities(
      _: any,
      { chainId, protocol }: { chainId: string; protocol?: string },
      context: GraphQLContext
    ) {
      try {
        const yieldService = new YieldFarmingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        return yieldService.getYieldFarmingOpportunities(chainId, protocol);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch yield farming opportunities');
        throw error;
      }
    },

    async yieldFarmingOpportunity(
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) {
      try {
        const yieldService = new YieldFarmingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        return yieldService.getYieldFarmingOpportunity(id);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch yield farming opportunity');
        throw error;
      }
    },

    async yieldFarmingPositions(
      _: any,
      { userId, chainId }: { userId: string; chainId?: string },
      context: GraphQLContext
    ) {
      try {
        const yieldService = new YieldFarmingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        return yieldService.getYieldFarmingPositions(userId, chainId);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch yield farming positions');
        throw error;
      }
    },

    async yieldFarmingPosition(
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) {
      try {
        const yieldService = new YieldFarmingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        return yieldService.getYieldFarmingPosition(id);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch yield farming position');
        throw error;
      }
    },

    async positionSummary(
      _: any,
      { userId, chainId }: { userId: string; chainId: string },
      context: GraphQLContext
    ) {
      try {
        const rewardsService = new RewardsService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        return rewardsService.getPositionSummary(userId, chainId);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch position summary');
        throw error;
      }
    },

    async calculateRewards(
      _: any,
      { positionId }: { positionId: string },
      context: GraphQLContext
    ) {
      try {
        const rewardsService = new RewardsService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        const rewards = await rewardsService.calculateRewards(positionId);
        if (!rewards) {
          throw new Error('Could not calculate rewards');
        }
        return rewards;
      } catch (error) {
        logger.error({ error }, 'Failed to calculate rewards');
        throw error;
      }
    },

    async protocolHealth(
      _: any,
      { protocol, chainId }: { protocol: string; chainId: string },
      context: GraphQLContext
    ) {
      try {
        return context.protocolAdapters.checkProtocolHealth(chainId, protocol);
      } catch (error) {
        logger.error({ error }, 'Failed to check protocol health');
        throw error;
      }
    },
  },

  Mutation: {
    async stakeTokens(
      _: any,
      {
        chainId,
        protocol,
        amount,
        validator,
      }: { chainId: string; protocol: string; amount: string; validator?: string },
      context: GraphQLContext
    ) {
      try {
        const stakingService = new StakingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        const txHash = await stakingService.stakeTokens({
          chainId,
          protocol,
          amount,
          validator,
        });
        return { id: txHash };
      } catch (error) {
        logger.error({ error }, 'Failed to stake tokens');
        throw error;
      }
    },

    async unstakeTokens(
      _: any,
      {
        chainId,
        protocol,
        positionId,
        amount,
      }: { chainId: string; protocol: string; positionId: string; amount: string },
      context: GraphQLContext
    ) {
      try {
        const stakingService = new StakingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        const txHash = await stakingService.unstakeTokens({
          chainId,
          protocol,
          positionId,
          amount,
        });
        return { id: txHash };
      } catch (error) {
        logger.error({ error }, 'Failed to unstake tokens');
        throw error;
      }
    },

    async claimRewards(
      _: any,
      {
        chainId,
        protocol,
        positionId,
      }: { chainId: string; protocol: string; positionId: string },
      context: GraphQLContext
    ) {
      try {
        const stakingService = new StakingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        const txHash = await stakingService.claimRewards({
          chainId,
          protocol,
          positionId,
        });
        return { id: txHash };
      } catch (error) {
        logger.error({ error }, 'Failed to claim rewards');
        throw error;
      }
    },

    async depositLending(
      _: any,
      {
        chainId,
        protocol,
        assetAddress,
        amount,
      }: { chainId: string; protocol: string; assetAddress: string; amount: string },
      context: GraphQLContext
    ) {
      try {
        const lendingService = new LendingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        const txHash = await lendingService.depositLending({
          chainId,
          protocol,
          assetAddress,
          amount,
        });
        return { id: txHash };
      } catch (error) {
        logger.error({ error }, 'Failed to deposit in lending');
        throw error;
      }
    },

    async borrowLending(
      _: any,
      {
        chainId,
        protocol,
        assetAddress,
        amount,
      }: { chainId: string; protocol: string; assetAddress: string; amount: string },
      context: GraphQLContext
    ) {
      try {
        const lendingService = new LendingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        const txHash = await lendingService.borrowLending({
          chainId,
          protocol,
          assetAddress,
          amount,
        });
        return { id: txHash };
      } catch (error) {
        logger.error({ error }, 'Failed to borrow from lending');
        throw error;
      }
    },

    async repayLending(
      _: any,
      {
        chainId,
        protocol,
        assetAddress,
        amount,
      }: { chainId: string; protocol: string; assetAddress: string; amount: string },
      context: GraphQLContext
    ) {
      try {
        const lendingService = new LendingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        const txHash = await lendingService.repayLending({
          chainId,
          protocol,
          assetAddress,
          amount,
        });
        return { id: txHash };
      } catch (error) {
        logger.error({ error }, 'Failed to repay lending');
        throw error;
      }
    },

    async depositYieldFarming(
      _: any,
      {
        chainId,
        protocol,
        farmAddress,
        lpTokenAmount,
      }: { chainId: string; protocol: string; farmAddress: string; lpTokenAmount: string },
      context: GraphQLContext
    ) {
      try {
        const yieldService = new YieldFarmingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        const txHash = await yieldService.depositYieldFarming({
          chainId,
          protocol,
          farmAddress,
          lpTokenAmount,
        });
        return { id: txHash };
      } catch (error) {
        logger.error({ error }, 'Failed to deposit in yield farming');
        throw error;
      }
    },

    async withdrawYieldFarming(
      _: any,
      {
        chainId,
        protocol,
        positionId,
        amount,
      }: { chainId: string; protocol: string; positionId: string; amount: string },
      context: GraphQLContext
    ) {
      try {
        const yieldService = new YieldFarmingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        const txHash = await yieldService.withdrawYieldFarming({
          chainId,
          protocol,
          positionId,
          amount,
        });
        return { id: txHash };
      } catch (error) {
        logger.error({ error }, 'Failed to withdraw from yield farming');
        throw error;
      }
    },

    async harvestRewards(
      _: any,
      {
        chainId,
        protocol,
        positionId,
      }: { chainId: string; protocol: string; positionId: string },
      context: GraphQLContext
    ) {
      try {
        const yieldService = new YieldFarmingService(
          context.prisma,
          context.redis,
          context.protocolAdapters
        );
        const txHash = await yieldService.harvestRewards({
          chainId,
          protocol,
          positionId,
        });
        return { id: txHash };
      } catch (error) {
        logger.error({ error }, 'Failed to harvest rewards');
        throw error;
      }
    },
  },
};
