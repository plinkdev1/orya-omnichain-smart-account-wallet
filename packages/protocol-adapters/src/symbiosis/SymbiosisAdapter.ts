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
import { SymbiosisClient } from './SymbiosisClient';
import type { SymbiosisAdapterConfig, SymbiosisToken, TokenInfo } from './SymbiosisTypes';

export class SymbiosisAdapter extends ProtocolAdapter implements ISwapProtocol {
  readonly name = 'Symbiosis';
  readonly version = '1.0.0';
  readonly logoUrl = 'https://app.symbiosis.finance/logo.svg';
  readonly features = {
    swap: true,
    stake: false,
    lend: false,
    bridge: true,
    aggregator: true,
  };

  readonly chainId: string;
  private client: SymbiosisClient;
  private initialized = false;
  private symbiosisChainId: number;
  private config: SymbiosisAdapterConfig;

  readonly supportedChains = [1, 56, 137, 250, 42161, 43114];

  constructor(chainId: number, config: SymbiosisAdapterConfig = {}) {
    super();
    this.symbiosisChainId = chainId;
    this.chainId = chainId.toString();
    this.config = config;
    this.client = new SymbiosisClient(config);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const isHealthy = await this.client.healthCheck();
      if (!isHealthy) {
        throw new Error('Symbiosis service not responding');
      }
      this.initialized = true;
      console.log(`[SymbiosisAdapter] Initialized for chain ${this.symbiosisChainId}`);
    } catch (error) {
      console.error('[SymbiosisAdapter] Initialization failed:', error);
      throw error;
    }
  }

  async destroy(): Promise<void> {
    this.initialized = false;
  }

  async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
    this.ensureInitialized();

    try {
      const swapResponse = await this.client.getSwap({
        tokenAmountIn: {
          address: params.fromToken,
          chainId: parseInt(params.chainId || this.symbiosisChainId.toString()),
          decimals: 18,
          symbol: 'TOKEN',
          amount: params.amount,
        },
        tokenOut: {
          address: params.toToken,
          chainId: parseInt(params.chainId || this.symbiosisChainId.toString()),
          decimals: 18,
          symbol: 'TOKEN',
        },
        from: params.userAddress || '0x0000000000000000000000000000000000000000',
        to: params.userAddress || '0x0000000000000000000000000000000000000000',
        slippage: (params.slippage || 0.5) * 100,
        affiliateFee: this.config.affiliateFee,
      });

      return {
        fromToken: this.convertToken({
          address: params.fromToken,
          chainId: parseInt(params.chainId || this.symbiosisChainId.toString()),
          decimals: 18,
          symbol: 'TOKEN',
          name: 'Token',
        }),
        toToken: this.convertToken({
          address: params.toToken,
          chainId: parseInt(params.chainId || this.symbiosisChainId.toString()),
          decimals: 18,
          symbol: 'TOKEN',
          name: 'Token',
        }),
        fromAmount: params.amount,
        toAmount: swapResponse.tokenAmountOut.amount,
        minAmountOut: swapResponse.tokenAmountOutMin.amount,
        priceImpact: parseFloat(swapResponse.priceImpact),
        route: swapResponse.route.map((route, index) => ({
          protocol: route.provider,
          percentage: 100 / swapResponse.route.length,
          path: [params.fromToken, params.toToken],
        })),
        estimatedGas: swapResponse.tx.gas || '0',
        estimatedGasUSD: this.estimateGasCostUSD(swapResponse.tx.gas),
        validUntil: new Date(Date.now() + 60000),
        metadata: {
          tx: swapResponse.tx,
          fees: swapResponse.fees,
          rewards: swapResponse.rewards,
          kind: swapResponse.kind,
        },
      };
    } catch (error) {
      console.error('[SymbiosisAdapter] getQuote failed:', error);
      throw new Error(`Failed to get quote from Symbiosis: ${(error as Error).message}`);
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
      console.error('[SymbiosisAdapter] executeSwap failed:', error);
      throw new Error(`Failed to execute swap on Symbiosis: ${(error as Error).message}`);
    }
  }

  async getSupportedTokens(): Promise<Token[]> {
    this.ensureInitialized();

    try {
      const tokensResponse = await this.client.getTokens();
      return tokensResponse.tokens
        .filter(token => token.chainId === this.symbiosisChainId)
        .map(token => this.convertSymbiosisToken(token));
    } catch (error) {
      console.error('[SymbiosisAdapter] getSupportedTokens failed:', error);
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
      console.error('[SymbiosisAdapter] isTokenSupported failed:', error);
      return false;
    }
  }

  async getFeeStructure(): Promise<FeeStructure> {
    const affiliateBps = this.config.affiliateFee?.bps || 0;
    const feePercent = affiliateBps / 100;
    return {
      protocolFee: 0.003,
      platformFee: feePercent,
      totalFee: 0.003 + feePercent,
      feeBreakdown: `0.3% protocol fee + ${feePercent}% affiliate fee`,
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
      auditors: ['PeckShield'],
      auditReportUrl: 'https://symbiosis.finance/security',
      hasBugBounty: true,
      isOpenSource: false,
      securityRating: 92,
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
      throw new Error('SymbiosisAdapter not initialized. Call initialize() first.');
    }
  }

  private convertToken(token: TokenInfo): Token {
    return {
      address: token.address,
      symbol: token.symbol,
      name: token.name || token.symbol,
      decimals: token.decimals,
    };
  }

  private convertSymbiosisToken(token: SymbiosisToken): Token {
    return {
      address: token.address,
      symbol: token.symbol,
      name: token.name || token.symbol,
      decimals: token.decimals,
      logoUrl: token.icons?.large,
    };
  }

  private estimateGasCostUSD(gasEstimate: string | undefined): number {
    if (!gasEstimate) return 0;
    try {
      const ethPrice = 2000;
      const gasPrice = 50;
      const gas = BigInt(gasEstimate);
      const ethCost = Number(gas * BigInt(gasPrice)) / 1e9;
      return ethCost * ethPrice;
    } catch {
      return 0;
    }
  }
}
