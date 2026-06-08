import type {
  ISwapProtocol,
  IStakingProtocol,
  ILendingProtocol,
  IAggregatorProtocol,
} from '../interfaces';

export type ProtocolType = 'swap' | 'stake' | 'lend' | 'bridge' | 'aggregator';

export interface ProtocolFeatures {
  swap: boolean;
  stake: boolean;
  lend: boolean;
  bridge: boolean;
  aggregator: boolean;
}

export interface ProtocolMetadata {
  id: string;
  name: string;
  chainId: string;
  type: ProtocolType;
  version: string;
  logoUrl: string;
  description?: string;
  websiteUrl?: string;
  docsUrl?: string;
  isAudited: boolean;
  auditors: string[];
  auditReportUrl?: string;
  isActive: boolean;
  isBeta: boolean;
  tier: 'core' | 'verified' | 'community';
  config?: Record<string, unknown>;
}

export abstract class ProtocolAdapter {
  abstract readonly name: string;
  abstract readonly chainId: string;
  abstract readonly version: string;
  abstract readonly logoUrl: string;
  abstract readonly features: ProtocolFeatures;

  async initialize(): Promise<void> {
    // Override in subclass if needed
  }

  async destroy(): Promise<void> {
    // Override in subclass if needed
  }
}

export type ProtocolAdapterInstance =
  | ISwapProtocol
  | IStakingProtocol
  | ILendingProtocol
  | IAggregatorProtocol;
