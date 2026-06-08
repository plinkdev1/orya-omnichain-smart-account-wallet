import { Request } from 'express';
import { PubSub } from 'graphql-subscriptions';

export enum WalletType {
  CUSTODIAL = 'CUSTODIAL',
  SELF_CUSTODY = 'SELF_CUSTODY',
  EXTERNAL = 'EXTERNAL',
  MPC = 'MPC',
}

export interface Wallet {
  id: string;
  userId: string;
  type: WalletType;
  chainType: string;
  address: string;
  publicKey?: string;
  balances?: Balance[];
  nfts?: NFT[];
  createdAt: Date;
  lastSyncedAt: Date;
}

export interface Balance {
  walletId: string;
  tokenAddress: string;
  symbol: string;
  decimals: number;
  amount: string;
  amountUSD: number;
  lastUpdated: Date;
}

export interface NFT {
  id: string;
  walletId: string;
  chainId: string;
  contractAddress: string;
  tokenId: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

export interface GasEstimate {
  chainId: string;
  gasPrice: string;
  gasLimit: string;
  estimatedFee: string;
  estimatedFeeUSD: number;
}

export interface CreateWalletInput {
  chainId: string;
  type: WalletType;
}

export interface ImportWalletInput {
  chainId: string;
  privateKey: string;
}

export interface ConnectExternalWalletInput {
  provider: string;
  address: string;
  signature: string;
}

export interface EstimateGasInput {
  chainId: string;
  from: string;
  to: string;
  amount: string;
  tokenAddress: string;
}

export interface GraphQLContext {
  user?: any;
  userId?: string;
  req: Request;
  prisma: any;
  redis: any;
  logger: any;
  dataloaders: DataLoaders;
  rpcManager?: any;
  privy?: any;
  alchemyClient?: any;
  pubSub?: PubSub | null;
}

export interface DataLoaders {
  walletById: any;
  walletsByUserId: any;
  balancesByWalletId: any;
  nftsByWalletId: any;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface RpcRequest {
  method: string;
  params: any[];
}

export interface RpcResponse {
  result: any;
  error?: string;
}

export interface BalanceSyncJob {
  walletId: string;
  userId: string;
  chainType: string;
  address: string;
}
