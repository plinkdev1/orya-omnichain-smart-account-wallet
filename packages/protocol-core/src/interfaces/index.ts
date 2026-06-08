/**
 * Core protocol abstraction interfaces
 * 
 * Defines standard interfaces that all protocol adapters must implement.
 * Enables protocol-agnostic feature implementations across the wallet.
 */

export * from './ISwapProtocol';
export * from './IStakingProtocol';
export * from './ILendingProtocol';
export * from './IAggregatorProtocol';

export type {
  Token,
  SwapQuote,
  SwapRoute,
  FeeStructure,
  ProtocolSecurityInfo,
  HealthStatus,
} from './ISwapProtocol';
