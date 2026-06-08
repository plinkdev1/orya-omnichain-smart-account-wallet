# Smart Aggregator Router - Implementation Guide

## Overview

The **AggregatorRouter** is a production-ready smart routing engine that automatically selects the best DEX aggregator based on multiple execution factors:

- **Output Amount** (40%) - Maximize tokens received
- **Price Impact** (20%) - Minimize slippage
- **Gas Costs** (15%) - Optimize transaction fees
- **Historical Success** (15%) - Use performance data
- **User Preferences** (10%) - Respect user choices

## Quick Start

### Basic Usage

```typescript
import { AggregatorRouter, type BestRouteResult } from '@orya/protocol-core/routing';

const router = AggregatorRouter.getInstance();

const params = {
  fromToken: '0x0000000000000000000000000000000000000001', // SUI
  toToken: '0x0000000000000000000000000000000000000002',   // USDC
  amount: '1000000000', // 1 SUI (with decimals)
  chainId: 'sui',
  slippage: 0.01, // 1% slippage tolerance
  userAddress: '0x1234567890abcdef',
};

const result: BestRouteResult = await router.findBestRoute(params);

console.log(`Selected: ${result.selectedProtocol}`);
console.log(`Output: ${result.quote.toAmount}`);
console.log(`Savings: ${result.savingsVsWorst.percentage.toFixed(2)}%`);
```

### Result Structure

```typescript
interface BestRouteResult {
  selectedProtocol: string;           // Best aggregator name
  quote: SwapQuote;                   // Recommended quote
  alternatives: RouteScore[];         // Other options ranked
  reasoning: string[];                // Why this was chosen
  savingsVsWorst: {
    amount: string;                   // Absolute savings in output tokens
    percentage: number;               // Percentage improvement
  };
}
```

## Advanced Configuration

### Custom Router Config

```typescript
import { AggregatorRouter, type RouterConfig } from '@orya/protocol-core/routing';

const customConfig: Partial<RouterConfig> = {
  maxParallelQuotes: 6,              // Query 6 aggregators simultaneously
  quoteTimeout: 15000,               // 15 second timeout per aggregator
  minScoreDifference: 2,             // Require 2% improvement to switch
  weightFactors: {
    outputAmount: 0.5,               // Prioritize more output
    priceImpact: 0.2,
    gasCost: 0.1,
    historicalSuccess: 0.1,
    userPreference: 0.1,
  },
  gasTokenPrices: new Map([
    ['SUI', 0.5],
    ['ETH', 2500],
    ['BNB', 400],
  ]),
};

const router = AggregatorRouter.getInstance(customConfig);
```

## Performance Tracking

### Record Execution Results

After executing a swap, record the actual performance:

```typescript
router.recordSwapExecution(
  'LiFi',           // Protocol name
  'sui',            // Chain ID
  true,             // Success?
  0.008             // Actual slippage experienced
);
```

### Access Performance Metrics

```typescript
const metrics = router.getPerformanceMetrics('LiFi', 'sui');
console.log(`Success rate: ${(metrics.successCount / metrics.totalAttempts * 100).toFixed(1)}%`);

const allMetrics = router.getAllPerformanceMetrics();
for (const [key, data] of allMetrics.entries()) {
  console.log(`${key}: ${data.successCount}/${data.totalAttempts} successful`);
}
```

### Clear History

```typescript
router.clearPerformanceHistory();
```

## User Preferences Integration

### Set Protocol Preferences

```typescript
import { PreferencesStore } from '@orya/protocol-core/preferences';

const preferences = PreferencesStore.getInstance();

preferences.setProtocolPreference(
  'sui',                                    // Chain
  'aggregator',                             // Feature type
  'LiFi',                                   // Preferred protocol
  ['1inch', 'Symbiosis']                   // Fallback options
);
```

### How Preferences Affect Scoring

- **Exact match**: 100% preference score
- **First fallback**: 80% preference score
- **Second fallback**: 60% preference score
- **Not in preferences**: 50% preference score

## Route Scoring Details

### Output Amount Score
- Normalized against best performing aggregator
- Raw score multiplied by 40%

### Price Impact Score
- Inverted: lower impact = higher score
- Scores: 1 - (priceImpact / 10)
- Example: 1% impact = 0.9 score, 10% impact = 0 score
- Multiplied by 20%

### Gas Cost Score
- Scores: 1 - (gasCost / 100)
- Example: $0 gas = 1.0 score, $100 gas = 0.0 score
- Multiplied by 15%

### Historical Success Score
- 60% weighted on success rate
- 40% weighted on slippage accuracy
- Default 0.7 for new protocols

### Final Score Calculation

```
finalScore = 
  (0.4 × outputScore) +
  (0.2 × priceImpactScore) +
  (0.15 × gasCostScore) +
  (0.15 × historicalScore) +
  (0.1 × preferenceScore)
```

## Error Handling

### Quote Failures

```typescript
try {
  const result = await router.findBestRoute(params);
} catch (error) {
  if (error.message.includes('No aggregators available')) {
    console.error('Chain not supported:', params.chainId);
  } else if (error.message.includes('All aggregators failed')) {
    console.error('No quotes received - check network connectivity');
  }
}
```

### Timeout Handling

Each aggregator query has an individual timeout. If exceeded:
- That aggregator is skipped
- Router continues with remaining aggregators
- If < 1 aggregator succeeds, throws error

## Best Practices

### 1. Monitor Execution Performance

```typescript
async function executeSwapWithTracking(route: BestRouteResult, actual: SwapResult) {
  const expectedAmount = BigInt(route.quote.minAmountOut);
  const actualAmount = BigInt(actual.toAmount);
  const slippage = Number((expectedAmount - actualAmount) / expectedAmount);
  
  router.recordSwapExecution(route.selectedProtocol, chainId, true, slippage);
}
```

### 2. Use Alternatives for Fallback

```typescript
const result = await router.findBestRoute(params);

try {
  await execute(result.selectedProtocol, result.quote);
} catch (error) {
  console.log('Primary failed, trying alternative...');
  const fallback = result.alternatives[0];
  await execute(fallback.protocol, fallback.quote);
}
```

### 3. Cache Recent Routes

```typescript
const routeCache = new Map<string, BestRouteResult>();

async function getRoute(params: SwapQuoteParams): Promise<BestRouteResult> {
  const cacheKey = `${params.fromToken}-${params.toToken}-${params.chainId}`;
  
  const cached = routeCache.get(cacheKey);
  if (cached && Date.now() - cached.quote.validUntil.getTime() < 60000) {
    return cached;
  }
  
  const fresh = await router.findBestRoute(params);
  routeCache.set(cacheKey, fresh);
  return fresh;
}
```

### 4. A/B Test Different Configurations

```typescript
const conservativeRouter = AggregatorRouter.getInstance({
  minScoreDifference: 3,            // Require 3% improvement
  weightFactors: {
    historicalSuccess: 0.2,
    outputAmount: 0.3,
    // ... other factors
  },
});

const aggressiveRouter = AggregatorRouter.getInstance({
  minScoreDifference: 0.5,          // Any improvement
  weightFactors: {
    outputAmount: 0.5,
    historicalSuccess: 0.1,
    // ... other factors
  },
});
```

## Integration with Protocol Registry

The AggregatorRouter automatically discovers available aggregators:

```typescript
// Automatically queries all registered aggregators for 'sui' chain
const result = await router.findBestRoute({
  chainId: 'sui',
  fromToken: tokenA,
  toToken: tokenB,
  amount: amount,
});
```

Register new aggregators with the protocol registry before routing:

```typescript
import { ProtocolRegistry } from '@orya/protocol-core/registry';

const registry = ProtocolRegistry.getInstance();
await registry.register(lifiMetadata, lifiAdapter);

// Now router will automatically use LiFi
```

## Supported Chains

The router supports any chain with registered aggregators:

- `sui` - Sui blockchain
- `ethereum` - Ethereum mainnet
- `polygon` - Polygon (Matic)
- `arbitrum` - Arbitrum One
- `optimism` - Optimism
- `bsc` - Binance Smart Chain
- `avalanche` - Avalanche C-Chain

## Storage & Persistence

Performance history is automatically stored in browser localStorage:

- **Storage key**: `orya_aggregator_performance`
- **Data structure**: Map<protocolName-chainId, PerformanceMetrics>
- **Updated**: After each `recordSwapExecution` call
- **Loaded**: Automatically on router initialization

To clear storage:

```typescript
router.clearPerformanceHistory();
```

## TypeScript Interfaces

### RouteScore

```typescript
interface RouteScore {
  protocol: string;                 // Aggregator name
  score: number;                    // Final score (0-1)
  reasons: string[];                // Scoring explanation
  quote: SwapQuote;                 // Full quote details
  estimatedCost: {
    gasCostUSD: number;            // Estimated gas in USD
    totalCostUSD: number;          // Total execution cost
  };
  probability: number;              // Success likelihood (0-1)
}
```

### RouterConfig

```typescript
interface RouterConfig {
  maxParallelQuotes: number;        // Aggregators to query in parallel
  quoteTimeout: number;              // Milliseconds per quote request
  minScoreDifference: number;        // Min % difference to prefer non-default
  weightFactors: {
    outputAmount: number;            // 0-1 weight
    priceImpact: number;
    gasCost: number;
    historicalSuccess: number;
    userPreference: number;
  };
  gasTokenPrices: Map<string, number>; // Token symbol → USD price
}
```

## Performance Considerations

- **Parallel quotes**: Max 4 concurrent aggregator requests (configurable)
- **Timeout**: 10 seconds per aggregator (configurable)
- **Memory**: Performance history stored in-memory + localStorage
- **Network**: Minimal overhead - direct aggregator API calls

## Production Checklist

- ✅ Zero console.log in production (console.warn/error for debugging)
- ✅ No TODOs or FIXMEs in router code
- ✅ Full TypeScript type safety
- ✅ Performance history persistence
- ✅ Error handling for network failures
- ✅ Configurable timeout handling
- ✅ User preference integration
- ✅ Comprehensive scoring algorithm
- ✅ ESLint compliant
- ✅ TypeScript strict mode ready

## Troubleshooting

### All aggregators timing out?
- Increase `quoteTimeout` configuration
- Check network connectivity
- Verify aggregator API endpoints are accessible

### Unexpected score calculations?
- Review `weight factors` in config
- Check performance history with `getPerformanceMetrics`
- Review `reasoning` array in `BestRouteResult`

### Storage not persisting?
- Verify localStorage is enabled
- Check browser storage quota
- Clear browser cache and try again

## API Reference

### AggregatorRouter Class

#### Static Methods

- `getInstance(config?: Partial<RouterConfig>): AggregatorRouter`

#### Instance Methods

- `findBestRoute(params: SwapQuoteParams): Promise<BestRouteResult>`
- `recordSwapExecution(protocolName: string, chainId: string, success: boolean, actualSlippage: number): void`
- `getPerformanceMetrics(protocolName: string, chainId: string): PerformanceMetrics | undefined`
- `getAllPerformanceMetrics(): Map<string, PerformanceMetrics>`
- `clearPerformanceHistory(): void`

## License

Part of @orya/protocol-core - See main LICENSE file
