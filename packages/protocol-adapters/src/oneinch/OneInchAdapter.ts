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
import { OneInchClient } from './OneInchClient';
import type { OneInchAdapterConfig, OneInchChainId, TokenInfo } from './OneInchTypes';
import { ONEINCH_SUPPORTED_CHAINS } from './OneInchTypes';

export class OneInchAdapter extends ProtocolAdapter implements ISwapProtocol {
  readonly name = '1inch';
  readonly version = '1.0.0';
  readonly logoUrl = 'https://1inch.io/logo.svg';
  readonly features = {
    swap: true,
    stake: false,
    lend: false,
    bridge: false,
    aggregator: true,
  };

  readonly chainId: string;
  private client: OneInchClient;
  private initialized = false;
  private oneInchChainId: OneInchChainId;
  private config: OneInchAdapterConfig;

  readonly supportedChains = Object.keys(ONEINCH_SUPPORTED_CHAINS).map(Number) as OneInchChainId[];

  constructor(chainId: OneInchChainId, config: OneInchAdapterConfig = {}) {
    super();
    this.oneInchChainId = chainId;
    this.chainId = chainId.toString();
    this.config = config;
    this.client = new OneInchClient(chainId, config);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const isHealthy = await this.client.healthCheck();
      if (!isHealthy) {
        throw new Error('1inch service not responding');
      }
      this.initialized = true;
      console.log(`[OneInchAdapter] Initialized for chain ${this.oneInchChainId}`);
    } catch (error) {
      console.error('[OneInchAdapter] Initialization failed:', error);
      throw error;
    }
  }

  async destroy(): Promise<void> {
    this.initialized = false;
  }

  async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
    this.ensureInitialized();

    try {
      const quoteResponse = await this.client.getQuote({
        src: params.fromToken,
        dst: params.toToken,
        amount: params.amount,
        slippage: params.slippage || 0.5,
        complexityLevel: 2,
        parts: 10,
        mainRouteParts: 5,
        includeTokensInfo: true,
        includeProtocols: true,
        includeGas: true,
      });

      return {
        fromToken: this.convertToken(quoteResponse.fromToken),
        toToken: this.convertToken(quoteResponse.toToken),
        fromAmount: params.amount,
        toAmount: quoteResponse.toAmount,
        minAmountOut: this.calculateMinOutput(quoteResponse.toAmount, params.slippage || 0.5),
        priceImpact: this.calculatePriceImpact(params.amount, quoteResponse.toAmount),
        route: quoteResponse.protocols.map((protocols, index) => ({
          protocol: protocols[0]?.[0]?.name || `Route ${index}`,
          percentage: 100 / quoteResponse.protocols.length,
          path: [params.fromToken, params.toToken],
        })),
        estimatedGas: quoteResponse.estimatedGas.toString(),
        estimatedGasUSD: this.estimateGasCostUSD(quoteResponse.estimatedGas),
        validUntil: new Date(Date.now() + 60000),
        metadata: {
          protocols: quoteResponse.protocols,
        },
      };
    } catch (error) {
      console.error('[OneInchAdapter] getQuote failed:', error);
      throw new Error(`Failed to get quote from 1inch: ${(error as Error).message}`);
    }
  }

  async executeSwap(params: SwapExecutionParams): Promise<SwapResult> {
    this.ensureInitialized();

    try {
      const metadata = params.quote.metadata as Record<string, any>;

      return {
        transactionHash: '0x_pending',
        status: 'pending',
        fromAmount: params.quote.fromAmount,
        toAmount: params.quote.toAmount,
        actualPriceImpact: params.quote.priceImpact,
        gasUsed: params.quote.estimatedGas,
      };
    } catch (error) {
      console.error('[OneInchAdapter] executeSwap failed:', error);
      throw new Error(`Failed to execute swap on 1inch: ${(error as Error).message}`);
    }
  }

  async getSupportedTokens(): Promise<Token[]> {
    this.ensureInitialized();

    try {
      const tokensResponse = await this.client.getTokens();
      return Object.values(tokensResponse.tokens).map(token => this.convertToken(token));
    } catch (error) {
      console.error('[OneInchAdapter] getSupportedTokens failed:', error);
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
      console.error('[OneInchAdapter] isTokenSupported failed:', error);
      return false;
    }
  }

  async getFeeStructure(): Promise<FeeStructure> {
    return {
      protocolFee: this.config.fee || 0,
      platformFee: 0,
      totalFee: this.config.fee || 0,
      feeBreakdown: `${this.config.fee || 0}% platform fee`,
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
      auditors: ['Trail of Bits', 'Consensys', 'OpenZeppelin'],
      auditReportUrl: 'https://1inch.io/security',
      hasBugBounty: true,
      isOpenSource: true,
      securityRating: 94,
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
      const isHealthy = await this.client.healthCheck();
      const latency = Date.now() - startTime;

      return {
        isOperational: isHealthy,
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
      throw new Error('OneInchAdapter not initialized. Call initialize() first.');
    }
  }

  private convertToken(token: TokenInfo): Token {
    return {
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      logoUrl: token.logoURI,
    };
  }

  private calculateMinOutput(toAmount: string, slippage: number): string {
    try {
      const amount = BigInt(toAmount);
      const slippageBp = BigInt(Math.floor(slippage * 100));
      const minOutput = amount - (amount * slippageBp) / BigInt(10000);
      return minOutput.toString();
    } catch {
      return toAmount;
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

  private estimateGasCostUSD(gasEstimate: number): number {
    try {
      const ethPrice = 2000;
      const gasPrice = 50;
      const ethCost = (gasEstimate * gasPrice) / 1e9;
      return ethCost * ethPrice;
    } catch {
      return 0;
    }
  }
}
