/**
 * Domain Layer - Aggregate Roots & Business Entities
 * Pure business logic, no external dependencies
 */

export * from './auth';
export * from './portfolio';
export * from './transaction';
export * from './wallet';
export * from './protocols';

// Blockchain types (re-exported from services for domain convenience)
export type { BlockchainConfig, ChainName as BlockchainType } from '../services/blockchain';
export interface Blockchain {
  type: string;
  name: string;
  config: any;
}

export const DOMAIN_VERSION = '0.1.0';
