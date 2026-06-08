/**
 * DeFi operation types
 */

import { ChainType } from './chain.types';
import { UUID } from './common.types';

export enum DeFiProtocol {
  UNISWAP = 'uniswap',
  AAVE = 'aave',
  CURVE = 'curve',
  LIDO = 'lido',
  DEEPBOOK = 'deepbook',
  CETUS = 'cetus',
  RAYDIUM = 'raydium',
  COMPOUND = 'compound',
  YEARN = 'yearn',
  BALANCER = 'balancer',
  CONVEX = 'convex',
}

export interface Protocol {
  id: UUID;
  name: string;
  chainId: ChainType;
  tvl: string;
  apy: number;
  logo?: string;
  website?: string;
  description?: string;
  safetyScore?: number;
}

export interface Position {
  protocol: DeFiProtocol;
  amount: string;
  value: number;
  rewards?: string;
  rewardsValue?: number;
  apy?: number;
}

export interface DeFiPosition {
  id: UUID;
  walletId: UUID;
  chainType: ChainType;
  protocol: DeFiProtocol;
  type: 'lending' | 'liquidity' | 'staking' | 'farming';
  tokenSymbol: string;
  amount: string;
  valueUSD: number;
  apy?: number;
  claimableRewards?: string;
}

export interface YieldOpportunity {
  id: UUID;
  chainType: ChainType;
  protocol: DeFiProtocol;
  tokenSymbol: string;
  apy: number;
  risk: 'low' | 'medium' | 'high';
  tvl: string;
  minDeposit?: string;
}

export interface DeFiTransaction {
  id: UUID;
  walletId: UUID;
  chainType: ChainType;
  protocol: DeFiProtocol;
  action: 'deposit' | 'withdraw' | 'claim';
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut?: string;
  status: 'pending' | 'completed' | 'failed';
  gasUsed?: string;
  timestamp: string;
}

export interface SwapQuote {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  route: string[];
  slippageTolerance: number;
}