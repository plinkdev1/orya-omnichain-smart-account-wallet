import type {
  ISwapProtocol,
  SwapQuoteParams,
  SwapQuote,
  SwapExecutionParams,
  SwapResult,
  Token,
  FeeStructure,
  ProtocolSecurityInfo,
  HealthStatus,
} from '@orya/protocol-core';
import { ProtocolAdapter } from '@orya/protocol-core';
import { LiFiClient } from './LiFiClient';
import type { LiFiRoute, TokenInfo } from './LiFiTypes';

export class LiFiAdapter extends ProtocolAdapter implements ISwapProtocol {
  readonly name = 'LI.FI';
  readonly version = '1.0.0';
  readonly logoUrl = 'https://li.quest/logo.svg';
  readonly features = {
    swap: true,
    stake: false,
    lend: false,
    bridge: true,
    aggregator: true,
  };

  readonly chainId: string;
  private client: LiFiClient;
  private initialized = false;
  private supportedChains: Map<string, string> = new Map();

  constructor(chainId: string, apiKey?: string) {
    super();
    this.chainId = chainId;
    this.client = new LiFiClient(apiKey);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const chains = await this.client.getChains();
      chains.forEach(chain => {
        this.supportedChains.set(chain.key, chain.id);
      });
      this.initialized = true;
      console.log(`[LiFiAdapter] Initialized for ${this.chainId}`);
    } catch (error) {
      console.error('[LiFiAdapter] Initialization failed:', error);
      throw error;
    }
  }

  async destroy(): Promise<void> {
    this.initialized = false;
    this.supportedChains.clear();
  }

  async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
    this.ensureInitialized();

    try {
      const route = await this.client.getBestRoute({
        fromChain: params.chainId || this.chainId,
        toChain: params.chainId || this.chainId,
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.amount,
        fromAddress: params.userAddress || '0x0000000000000000000000000000000000000000',
        slippage: params.slippage || 0.005,
      });

      return this.convertRouteToQuote(route, params);
    } catch (error) {
      console.error('[LiFiAdapter] getQuote failed:', error);
      throw new Error(`Failed to get quote from LI.FI: ${(error as Error).message}`);
    }
  }

  async executeSwap(params: SwapExecutionParams): Promise<SwapResult> {
    this.ensureInitialized();

    try {
      const metadata = params.quote.metadata as Record<string, any>;
      const txData = metadata.txData;

      return {
        transactionHash: '0x_pending',
        status: 'pending',
        fromAmount: params.quote.fromAmount,
        toAmount: params.quote.toAmount,
        actualPriceImpact: params.quote.priceImpact,
        gasUsed: params.quote.estimatedGas,
      };
    } catch (error) {
      console.error('[LiFiAdapter] executeSwap failed:', error);
      throw new Error(`Failed to execute swap on LI.FI: ${(error as Error).message}`);
    }
  }

  async getSupportedTokens(): Promise<Token[]> {
    this.ensureInitialized();

    try {
      const tokens = await this.client.getTokens(this.chainId);

      return tokens.map((token: TokenInfo) => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logoUrl: token.logoURI,
      }));
    } catch (error) {
      console.error('[LiFiAdapter] getSupportedTokens failed:', error);
      return [];
    }
  }

  async isTokenSupported(tokenAddress: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const tokens = await this.getSupportedTokens();
      return tokens.some(
        token => token.address.toLowerCase() === tokenAddress.toLowerCase()
      );
    } catch (error) {
      console.error('[LiFiAdapter] isTokenSupported failed:', error);
      return false;
    }
  }

  async getFeeStructure(): Promise<FeeStructure> {
    return {
      protocolFee: 0.003,
      platformFee: 0,
      totalFee: 0.003,
      feeBreakdown: '0.3% protocol fee',
    };
  }

  async getLiquidity(
    tokenPair: [string, string]
  ): Promise<{ token0Reserve: string; token1Reserve: string; totalLiquidityUSD: number; volume24h: number }> {
    return {
      token0Reserve: '0',
      token1Reserve: '0',
      totalLiquidityUSD: 0,
      volume24h: 0,
    };
  }

  getSecurityInfo(): ProtocolSecurityInfo {
    return {
      isAudited: true,
      auditors: ['Hexagate', 'OpenZeppelin'],
      auditReportUrl: 'https://li.quest/security',
      hasBugBounty: true,
      isOpenSource: true,
      securityRating: 95,
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const health = await this.getHealthStatus();
      return health.isOperational;
    } catch {
      return false;
    }
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      await this.client.getChains();
      const latency = Date.now() - startTime;

      return {
        isOperational: true,
        latency,
        lastUpdated: new Date(),
      };
    } catch (error) {
      return {
        isOperational: false,
        latency: Date.now() - startTime,
        lastUpdated: new Date(),
        issues: [(error as Error).message],
      };
    }
  }

  async getMinSwapAmount(token: string): Promise<string> {
    return '0';
  }

  async getMaxSwapAmount(token: string): Promise<string> {
    return '999999999999999999999999999999';
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('LiFiAdapter not initialized. Call initialize() first.');
    }
  }

  private convertRouteToQuote(route: LiFiRoute, params: SwapQuoteParams): SwapQuote {
    const gasCostUSD = this.calculateGasCostUSD(route.gasCosts);
    const priceImpact = this.calculatePriceImpact(route.fromAmount, route.toAmount);

    return {
      fromToken: {
        address: route.fromToken.address,
        symbol: route.fromToken.symbol,
        name: route.fromToken.name,
        decimals: route.fromToken.decimals,
        logoUrl: route.fromToken.logoURI,
      },
      toToken: {
        address: route.toToken.address,
        symbol: route.toToken.symbol,
        name: route.toToken.name,
        decimals: route.toToken.decimals,
        logoUrl: route.toToken.logoURI,
      },
      fromAmount: route.fromAmount,
      toAmount: route.toAmount,
      minAmountOut: route.toAmountMin,
      priceImpact,
      route: route.steps.map(step => ({
        protocol: step.tool,
        percentage: 100 / route.steps.length,
        path: [route.fromToken.address, route.toToken.address],
      })),
      estimatedGas: route.gasCosts[0]?.estimate || '0',
      estimatedGasUSD: gasCostUSD,
      validUntil: new Date(Date.now() + 60000),
      metadata: {
        routeId: route.id,
        steps: route.steps,
        insurance: route.insurance,
        tags: route.tags,
      },
    };
  }

  private calculateGasCostUSD(gasCosts: any[]): number {
    if (!gasCosts || gasCosts.length === 0) return 0;
    try {
      return parseFloat(gasCosts[0].amountUSD || '0');
    } catch {
      return 0;
    }
  }

  private calculatePriceImpact(fromAmount: string, toAmount: string): number {
    try {
      const from = BigInt(fromAmount);
      const to = BigInt(toAmount);
      if (from === BigInt(0)) return 0;
      const impact = Number((BigInt(10000) - (to * BigInt(10000)) / from)) / 100;
      return Math.max(0, impact);
    } catch {
      return 0;
    }
  }
}
