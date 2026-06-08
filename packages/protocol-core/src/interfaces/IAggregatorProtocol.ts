/**
 * Standard interface for DEX aggregators (1inch, LI.FI, Symbiosis)
 */

import type { ISwapProtocol, SwapQuoteParams, SwapQuote } from './ISwapProtocol';

export interface AggregatorQuoteParams extends SwapQuoteParams {
  /**
   * Only include these protocols in routing
   */
  includedProtocols?: string[];
  /**
   * Exclude these protocols from routing
   */
  excludedProtocols?: string[];
  /**
   * Maximum number of different protocols to split trade across
   */
  maxSplits?: number;
}

export interface ProtocolPreference {
  /**
   * Protocol name
   */
  protocol: string;
  /**
   * Whether to include this protocol
   */
  enabled: boolean;
  /**
   * Priority rank (higher = better)
   */
  priority?: number;
}

export interface AggregatorRoute {
  /**
   * Protocol handling this portion
   */
  protocol: string;
  /**
   * Percentage of trade through this protocol
   */
  percentage: number;
  /**
   * Quote for this portion of the trade
   */
  quote: SwapQuote;
}

export interface AggregatorQuote extends SwapQuote {
  /**
   * Breakdown of routes across multiple protocols
   */
  routes: AggregatorRoute[];
  /**
   * Savings vs best single-protocol quote (in USD)
   */
  savings: number;
  /**
   * Aggregator fee on top of protocol fees
   */
  aggregatorFee: number;
}

/**
 * IAggregatorProtocol - Extended interface for DEX aggregators
 * 
 * Aggregators split trades across multiple DEXs to find optimal routes
 * 
 * @example
 * ```typescript
 * class OneInchAdapter implements IAggregatorProtocol {
 *   readonly name = "1inch";
 *   readonly chainId = "ethereum";
 *   // ... implementation with routing logic
 * }
 * ```
 */
export interface IAggregatorProtocol extends ISwapProtocol {
  /**
   * Get optimized quote with multi-protocol routing
   */
  getQuoteWithRouting(params: AggregatorQuoteParams): Promise<AggregatorQuote>;

  /**
   * Get list of protocols this aggregator can route through
   */
  getSupportedProtocols(): Promise<string[]>;

  /**
   * Compare multiple route options for a swap
   */
  compareRoutes(params: SwapQuoteParams): Promise<AggregatorQuote[]>;

  /**
   * Set protocol preferences for routing
   */
  setProtocolPreferences(preferences: ProtocolPreference[]): void;
}
