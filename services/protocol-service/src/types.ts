import { Request } from 'express';

export enum ProtocolTier {
  CORE = 'CORE',
  VERIFIED = 'VERIFIED',
  COMMUNITY = 'COMMUNITY',
}

export enum FeatureType {
  SWAP = 'SWAP',
  STAKE = 'STAKE',
  LEND = 'LEND',
  BRIDGE = 'BRIDGE',
  AGGREGATOR = 'AGGREGATOR',
}

export interface Protocol {
  id: string;
  name: string;
  chainId: string;
  type: FeatureType;
  version: string;
  logoUrl: string;
  isActive: boolean;
  isAudited: boolean;
  auditors: string[];
  tier: ProtocolTier;
  metadata: ProtocolMetadata;
  health?: ProtocolHealth;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProtocolMetadata {
  website: string;
  docs: string;
  tvl: number;
  volume24h: number;
  fees: FeeStructure;
  securityRating: number;
  supportedTokens: string[];
}

export interface FeeStructure {
  protocolFee: number;
  platformFee: number;
  totalFee: number;
  feeBreakdown: string;
}

export interface ProtocolHealth {
  isOperational: boolean;
  latency: number;
  lastChecked: Date;
  issues?: string[];
}

export interface ProtocolPreference {
  chainId: string;
  feature: FeatureType;
  preferredProtocol: string;
  fallbackProtocols: string[];
  lastUpdated: Date;
}

export interface TransactionIntent {
  type: string;
  description: string;
  inputToken: string;
  outputToken: string;
  minOutputAmount: string;
  maxSlippage: number;
  deadline: Date;
  routingPreference: string;
  chainId: string;
}

export interface RegisterProtocolInput {
  name: string;
  chainId: string;
  type: FeatureType;
  version: string;
  logoUrl: string;
  tier: ProtocolTier;
  website: string;
  docs: string;
  securityRating: number;
  supportedTokens: string[];
  protocolFee: number;
  platformFee: number;
}

export interface UpdateProtocolInput {
  name?: string;
  logoUrl?: string;
  tier?: ProtocolTier;
  website?: string;
  docs?: string;
  securityRating?: number;
  supportedTokens?: string[];
  tvl?: number;
  volume24h?: number;
  protocolFee?: number;
  platformFee?: number;
}

export interface GraphQLContext {
  user?: any;
  userId?: string;
  req: Request;
  prisma: any;
  redis: any;
  logger: any;
  dataloaders: DataLoaders;
  protocolRegistry?: ProtocolRegistry;
  protocolRouter?: ProtocolRouter;
  preferencesStore?: PreferencesStore;
}

export interface DataLoaders {
  protocolById?: any;
  protocolsByChainAndFeature?: any;
  protocolHealth?: any;
  userPreferences?: any;
}

export interface ProtocolRegistry {
  getProtocols(chainId: string, feature: FeatureType): Promise<Protocol[]>;
  getProtocol(id: string): Promise<Protocol | null>;
  registerProtocol(input: RegisterProtocolInput): Promise<Protocol>;
  updateProtocol(id: string, input: UpdateProtocolInput): Promise<Protocol>;
  activateProtocol(id: string): Promise<Protocol>;
  deactivateProtocol(id: string): Promise<Protocol>;
}

export interface ProtocolRouter {
  getProtocolHealth(protocolId: string): Promise<ProtocolHealth>;
  getBestProtocol(intent: TransactionIntent): Promise<Protocol>;
  getProtocol(chainId: string, feature: FeatureType, options?: any): Promise<any>;
  recordFailure(protocolId: string): Promise<void>;
}

export interface PreferencesStore {
  getProtocolPreference(
    userId: string,
    chainId: string,
    feature: FeatureType
  ): Promise<string | null>;
  setProtocolPreference(
    userId: string,
    chainId: string,
    feature: FeatureType,
    protocolId: string,
    fallbacks: string[]
  ): Promise<void>;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}
