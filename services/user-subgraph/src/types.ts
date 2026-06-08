import { Request } from 'express';

export enum KYCStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum KYCProvider {
  SUMSUB = 'SUMSUB',
  PERSONA = 'PERSONA',
}

export enum FeatureType {
  SWAP = 'SWAP',
  STAKE = 'STAKE',
  LEND = 'LEND',
  BRIDGE = 'BRIDGE',
  AGGREGATOR = 'AGGREGATOR',
}

export interface User {
  id: string;
  email: string;
  privyId: string;
  firebaseUid: string;
  kycStatus: KYCStatus;
  kycProvider?: KYCProvider | null;
  advancedMode: boolean;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  protocols: ProtocolPreference[];
  autoSigning: AutoSigningConfig;
  defaultChain: string;
  hiddenTokens: string[];
  favoriteProtocols: string[];
}

export interface ProtocolPreference {
  chainId: string;
  feature: FeatureType;
  preferredProtocol: string;
  fallbackProtocols: string[];
  lastUpdated: Date;
}

export interface AutoSigningConfig {
  enabled: boolean;
  thresholdUSD: number;
  whitelistedContracts: string[];
  expiryHours: number;
  maxDailyAmountUSD: number;
  requireBiometric: boolean;
}

export interface KYCSession {
  id: string;
  userId: string;
  provider: KYCProvider;
  sessionId: string;
  status: string;
  externalUrl?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface KYCSubmission {
  id: string;
  sessionId: string;
  status: string;
  documents: string[];
  submittedAt: Date;
}

export interface AuthPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface GraphQLContext {
  user?: User | null;
  userId?: string;
  req: Request;
  prisma: any;
  redis: any;
  logger: any;
  dataloaders: DataLoaders;
}

export interface DataLoaders {
  userById: any;
  userByEmail: any;
  userPreferences: any;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface UserFilter {
  email?: string;
  kycStatus?: KYCStatus;
  advancedMode?: boolean;
  search?: string;
}

export interface PaginationInput {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

export interface UserConnection {
  edges: UserEdge[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface UserEdge {
  cursor: string;
  node: User;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}
