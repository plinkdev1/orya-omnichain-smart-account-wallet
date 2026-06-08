/**
 * Portfolio types
 */

import { ChainType } from './chain.types';
import { UUID } from './common.types';

export interface Asset {
  id: UUID;
  symbol: string;
  name: string;
  chainType: ChainType;
  tokenAddress: string;
  balance: string;
  decimals: number;
  priceUSD: number;
  valueUSD: number;
  percentChange24h: number;
  icon?: string;
}

export interface Portfolio {
  userId: UUID;
  totalValueUSD: number;
  totalValueChangeUSD: number;
  totalValueChangePercent: number;
  assets: Asset[];
  allocation: PortfolioAllocation[];
  performance: PerformanceMetrics;
  lastUpdated: string;
}

export interface PortfolioAllocation {
  chainType: ChainType;
  valueUSD: number;
  percentage: number;
}

export interface PerformanceMetrics {
  timeframe: '1d' | '7d' | '30d' | '90d' | '1y' | 'all';
  startValue: number;
  endValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  maxGain: number;
  maxLoss: number;
  averageReturn: number;
  volatility: number;
  sharpeRatio?: number;
}

export interface PortfolioPerformance {
  userId: UUID;
  timeframe: '1d' | '7d' | '30d' | '90d' | '1y' | 'all';
  startValue: number;
  endValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  maxGain: number;
  maxLoss: number;
}

export interface AssetAllocation {
  symbol: string;
  percentage: number;
  valueUSD: number;
}

export interface RiskProfile {
  volatilityScore: number; // 0-100
  concentrationScore: number; // 0-100
  overallRiskLevel: 'low' | 'medium' | 'high';
}

/**
 * Portfolio metrics summary
 */
export interface PortfolioMetrics {
  userId: UUID;
  totalValueUSD: number;
  dailyChangeUSD: number;
  dailyChangePercent: number;
  allocation: PortfolioAllocation[];
  performance: PortfolioPerformance;
  riskProfile: RiskProfile;
  lastUpdated: string;
}