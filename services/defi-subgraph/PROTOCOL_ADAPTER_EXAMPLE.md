# Protocol Adapter Implementation Guide

This guide shows how to create a protocol adapter for a new DeFi protocol.

## Overview

Protocol adapters implement the `ProtocolAdapter` interface and provide protocol-specific implementations for:
- Fetching opportunities and markets
- Reading user positions
- Executing operations (stake, borrow, deposit, etc.)
- Calculating rewards
- Checking protocol health

## Step 1: Create Adapter Class

```typescript
import type {
  ProtocolAdapter,
  StakingOpportunity,
  StakingPosition,
  LendingMarket,
  LendingPosition,
  YieldFarmingOpportunity,
  YieldFarmingPosition,
  RewardCalculation,
  ProtocolHealth,
  StakeTokensInput,
  UnstakeTokensInput,
  ClaimRewardsInput,
  DepositLendingInput,
  BorrowLendingInput,
  RepayLendingInput,
  DepositYieldFarmingInput,
  WithdrawYieldFarmingInput,
  HarvestRewardsInput,
} from '../types';
import axios from 'axios';
import { ethers } from 'ethers';

export class LidoStakingAdapter implements ProtocolAdapter {
  name = 'lido';
  chainId = 'ethereum';
  
  private provider: ethers.Provider;
  private apiUrl = 'https://mainnet.lido.fi/api/v1';

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
  }

  async getStakingOpportunities(): Promise<StakingOpportunity[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/staking-rates`);
      
      return [{
        id: 'lido-eth-staking',
        chainId: this.chainId,
        protocol: this.name,
        tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        apy: response.data.apy,
        tvl: response.data.tvl,
        minStake: '0.01',
        rewardToken: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', // stETH
        isActive: true,
        createdAt: new Date(),
      }];
    } catch (error) {
      console.error('Failed to fetch Lido staking opportunities', error);
      throw error;
    }
  }

  async getStakingPositions(userId: string): Promise<StakingPosition[]> {
    try {
      // Fetch user's stETH balance
      const stETHAddress = '0xae7ab96520de3a18e5e111b5eaab095312d7fe84';
      const contract = new ethers.Contract(
        stETHAddress,
        ['function balanceOf(address) returns (uint256)'],
        this.provider
      );

      const balance = await contract.balanceOf(userId);
      
      if (balance === 0n) {
        return [];
      }

      const stakedAmount = ethers.formatEther(balance);

      // Fetch APY from API
      const apy = await this.getStakingAPY();

      return [{
        id: `lido-${userId}-position`,
        userId,
        chainId: this.chainId,
        protocol: this.name,
        tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        stakedAmount,
        rewardsEarned: '0', // Calculate from rebasing mechanism
        rewardToken: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
        apy,
        stakedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      }];
    } catch (error) {
      console.error('Failed to fetch staking positions', error);
      throw error;
    }
  }

  async getLendingMarkets(): Promise<LendingMarket[]> {
    return []; // Not applicable for Lido
  }

  async getLendingPositions(userId: string): Promise<LendingPosition[]> {
    return []; // Not applicable for Lido
  }

  async getYieldFarmingOpportunities(): Promise<YieldFarmingOpportunity[]> {
    return []; // Not applicable for Lido
  }

  async getYieldFarmingPositions(userId: string): Promise<YieldFarmingPosition[]> {
    return []; // Not applicable for Lido
  }

  async calculateRewards(positionId: string): Promise<RewardCalculation> {
    // For Lido, rewards are auto-compounding via rebasing
    // Calculate based on stETH rebasing mechanism
    const dailyRewardRate = 0.03 / 365; // 3% APY

    return {
      positionId,
      rewardToken: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
      estimatedReward: '0.001', // Example
      estimatedRewardUSD: 1.5,
      frequency: 'daily',
      nextClaimAt: undefined, // Auto-compounding
    };
  }

  async stakeTokens(input: StakeTokensInput): Promise<string> {
    try {
      const ethAmount = ethers.parseEther(input.amount);
      
      // Create transaction to stake via Lido
      const lidoContract = new ethers.Contract(
        '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
        ['function submit(address) payable returns (uint256)'],
        this.provider.getSigner()
      );

      const tx = await lidoContract.submit(input.validator || ethers.ZeroAddress, {
        value: ethAmount,
      });

      return tx.hash;
    } catch (error) {
      console.error('Failed to stake tokens', error);
      throw error;
    }
  }

  async unstakeTokens(input: UnstakeTokensInput): Promise<string> {
    try {
      // Initiate unstaking request with Lido's withdrawal queue
      const amount = ethers.parseEther(input.amount);
      
      const withdrawalQueue = new ethers.Contract(
        '0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1',
        ['function requestWithdrawals(uint256[] memory amounts, address recipient)'],
        this.provider.getSigner()
      );

      const tx = await withdrawalQueue.requestWithdrawals([amount], input.positionId);
      return tx.hash;
    } catch (error) {
      console.error('Failed to unstake tokens', error);
      throw error;
    }
  }

  async claimRewards(input: ClaimRewardsInput): Promise<string> {
    // Lido has auto-compounding, no manual claim needed
    // Return a dummy transaction hash
    return '0x' + '0'.repeat(64);
  }

  async depositLending(input: DepositLendingInput): Promise<string> {
    throw new Error('Not applicable for Lido');
  }

  async borrowLending(input: BorrowLendingInput): Promise<string> {
    throw new Error('Not applicable for Lido');
  }

  async repayLending(input: RepayLendingInput): Promise<string> {
    throw new Error('Not applicable for Lido');
  }

  async depositYieldFarming(input: DepositYieldFarmingInput): Promise<string> {
    throw new Error('Not applicable for Lido');
  }

  async withdrawYieldFarming(input: WithdrawYieldFarmingInput): Promise<string> {
    throw new Error('Not applicable for Lido');
  }

  async harvestRewards(input: HarvestRewardsInput): Promise<string> {
    throw new Error('Not applicable for Lido');
  }

  async checkHealth(): Promise<ProtocolHealth> {
    try {
      // Check if Lido contracts are responding
      const response = await axios.get(`${this.apiUrl}/health`);

      return {
        protocol: this.name,
        chainId: this.chainId,
        isOperational: response.status === 200,
        lastCheckedAt: new Date(),
      };
    } catch (error) {
      return {
        protocol: this.name,
        chainId: this.chainId,
        isOperational: false,
        statusMessage: 'Unable to connect to Lido',
        lastCheckedAt: new Date(),
      };
    }
  }

  private async getStakingAPY(): Promise<number> {
    try {
      const response = await axios.get(`${this.apiUrl}/staking-rates`);
      return response.data.apy;
    } catch {
      return 3.0; // Default APY
    }
  }
}
```

## Step 2: Register Adapter

```typescript
import { protocolAdapterRegistry } from './utils/protocol-adapter-registry';
import { LidoStakingAdapter } from './adapters/lido-adapter';

// Register in your setup code
const lidoAdapter = new LidoStakingAdapter();
protocolAdapterRegistry.register('ethereum:lido', lidoAdapter);
```

## Step 3: Testing

```typescript
import { describe, it, expect } from 'vitest';
import { LidoStakingAdapter } from './lido-adapter';

describe('LidoStakingAdapter', () => {
  let adapter: LidoStakingAdapter;

  beforeEach(() => {
    adapter = new LidoStakingAdapter();
  });

  it('should fetch staking opportunities', async () => {
    const opportunities = await adapter.getStakingOpportunities();
    
    expect(opportunities).toHaveLength(1);
    expect(opportunities[0]).toMatchObject({
      protocol: 'lido',
      chainId: 'ethereum',
      apy: expect.any(Number),
    });
  });

  it('should fetch user staking positions', async () => {
    const positions = await adapter.getStakingPositions('0x1234...');
    
    expect(Array.isArray(positions)).toBe(true);
  });

  it('should calculate rewards', async () => {
    const rewards = await adapter.calculateRewards('position-123');
    
    expect(rewards).toMatchObject({
      rewardToken: expect.any(String),
      estimatedReward: expect.any(String),
    });
  });
});
```

## Best Practices

### 1. Error Handling
```typescript
async getStakingOpportunities(): Promise<StakingOpportunity[]> {
  try {
    // Implementation
  } catch (error) {
    logger.error({ error }, 'Failed to fetch opportunities');
    throw new Error(`Lido adapter error: ${error.message}`);
  }
}
```

### 2. Caching
```typescript
private opportunitiesCache: StakingOpportunity[] | null = null;
private cacheTimestamp = 0;

async getStakingOpportunities(): Promise<StakingOpportunity[]> {
  if (this.opportunitiesCache && Date.now() - this.cacheTimestamp < 600000) {
    return this.opportunitiesCache;
  }
  
  // Fetch and cache
  this.opportunitiesCache = await this.fetchOpportunities();
  this.cacheTimestamp = Date.now();
  return this.opportunitiesCache;
}
```

### 3. Type Safety
```typescript
// Use strict types from types.ts
async stakeTokens(input: StakeTokensInput): Promise<string> {
  // Validate input types
  if (!input.amount || isNaN(parseFloat(input.amount))) {
    throw new Error('Invalid amount');
  }
  
  // Return transaction hash
  return txHash;
}
```

### 4. Logging
```typescript
import { logger } from '../utils/logger';

async stakeTokens(input: StakeTokensInput): Promise<string> {
  logger.info({ input }, 'Staking tokens on Lido');
  
  try {
    const txHash = await this.executeStaking(input);
    logger.info({ txHash }, 'Staking transaction sent');
    return txHash;
  } catch (error) {
    logger.error({ error, input }, 'Staking failed');
    throw error;
  }
}
```

## Common Protocol Types

### Staking Protocols
- Lido (Liquid Staking)
- Stripe (Solo Staking)
- Rocket Pool (Decentralized Staking)
- Consensus Layer protocols

### Lending Protocols
- Aave
- Compound
- Maker (CDP)
- Lending Pool protocols

### Yield Farming Protocols
- Uniswap V3
- Curve Finance
- Balancer
- Other AMM protocols

## Testing Adapters

Always test:
1. ✅ Fetching opportunities/markets
2. ✅ Fetching user positions
3. ✅ Calculating rewards correctly
4. ✅ Executing operations (stake/borrow/deposit)
5. ✅ Error handling for network issues
6. ✅ Protocol health checks

## Documentation

Document your adapter with:
- Protocol name and type
- Supported chains
- Supported operations
- APY/Interest rate sources
- Health check mechanism
- Known limitations

Example:
```typescript
/**
 * Lido Staking Adapter
 * 
 * Supports liquid staking on Ethereum via Lido
 * 
 * Supported Operations:
 * - Stake ETH → stETH
 * - Unstake via withdrawal queue
 * - Auto-compounding rewards
 * 
 * APY Source: Lido analytics API
 * Health Check: Lido API endpoint
 */
export class LidoStakingAdapter implements ProtocolAdapter {
  // ...
}
```

## Example: Aave Lending Adapter

See other adapter implementations in the `services/defi-subgraph/adapters/` directory for complete examples of:
- Aave (lending/borrowing)
- Uniswap (yield farming)
- Compound (lending)
- Curve (yield farming)

These can serve as templates for your protocol implementations.
