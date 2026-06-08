import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';
import type { PubSub } from 'graphql-subscriptions';
import type { Logger } from 'pino';
import type { RpcManager } from './utils/rpc-manager';
import type { CacheManager } from './utils/cache';
import type { ProtocolRouter } from './services/protocol-router';
import type { TransactionService } from './services/transaction-service';

export interface DataLoaders {
  userLoader: any;
  walletLoader: any;
  transactionLoader: any;
}

export interface GraphQLContext {
  user: {
    id: string;
    walletId: string;
    email: string;
  } | null;
  prisma: PrismaClient;
  redis: Redis;
  dataloaders: DataLoaders;
  pubSub: PubSub;
  logger: Logger;
  rpcManager: RpcManager;
  cacheManager: CacheManager;
  protocolRouter: ProtocolRouter;
  transactionService: TransactionService;
  session: {
    lastAuthTime: Date;
  } | null;
}

export interface SwapIntentInput {
  chainId: string;
  inputToken: string;
  outputToken: string;
  amount: string;
  minOutputAmount: string;
  maxSlippage: number;
  deadline: Date;
  routingPreference?: 'BEST_PRICE' | 'FASTEST' | 'MOST_SECURE' | 'USER_PREFERRED';
  description?: string;
}

export interface BridgeIntentInput {
  sourceChainId: string;
  destinationChainId: string;
  token: string;
  amount: string;
  minReceiveAmount: string;
  deadline: Date;
  routingPreference?: 'BEST_PRICE' | 'FASTEST' | 'MOST_SECURE' | 'USER_PREFERRED';
}

export interface ProtocolRoute {
  protocolId: string;
  metadata: {
    name: string;
    id: string;
    chainId: string;
    type: string;
    contractAddress?: string;
  };
  isPreferred: boolean;
  isFallback: boolean;
  protocol: any;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  walletId: string;
  chainId: string;
  type: string;
  status: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  tokenSymbol: string;
  tokenAddress: string;
  protocol: string;
  fee: string;
  feeUSD: number;
  hash?: string;
  blockNumber?: number;
  intent?: TransactionIntentRecord;
  metadata?: any;
  createdAt: Date;
  confirmedAt?: Date;
}

export interface TransactionIntentRecord {
  type: string;
  description: string;
  inputToken: string;
  outputToken: string;
  minOutputAmount: string;
  maxSlippage: number;
  deadline: Date;
  routingPreference: string;
}

export interface ProtocolQuote {
  fromToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
  toToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
  fromAmount: string;
  toAmount: string;
  minAmountOut: string;
  priceImpact: number;
  estimatedGas: string;
  estimatedGasUSD: number;
  route: Array<{
    protocol: string;
    percentage: number;
    path: string[];
  }>;
  validUntil: Date;
  metadata: Record<string, unknown>;
}

export interface ExecutionResult {
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  fromAmount: string;
  toAmount: string;
  actualPriceImpact: number;
  gasUsed?: string;
}
