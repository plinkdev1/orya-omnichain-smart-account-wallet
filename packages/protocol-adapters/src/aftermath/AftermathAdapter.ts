import type {
  ISwapProtocol,
  SwapQuoteParams,
  SwapQuote,
  SwapExecutionParams,
  SwapResult,
  Token,
  FeeStructure,
  LiquidityInfo,
  ProtocolSecurityInfo,
  HealthStatus,
} from '@orya/protocol-core';
import { ProtocolAdapter } from '@orya/protocol-core';

export class AftermathSwapAdapter extends ProtocolAdapter implements ISwapProtocol {
  readonly name = 'Aftermath Finance';
  readonly chainId = 'sui';
  readonly version = '1.0.0';
  readonly logoUrl = 'https://aftermath.finance/logo.png';
  readonly features = {
    swap: true,
    stake: false,
    lend: false,
    bridge: false,
    aggregator: true,
  };

  private sdkClient: any;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.sdkClient = {
        initialized: true,
      };

      this.initialized = true;
      console.log('[AftermathAdapter] Initialized');
    } catch (error) {
      console.error('[AftermathAdapter] Initialization failed:', error);
      throw error;
    }
  }

  async destroy(): Promise<void> {
    this.initialized = false;
    console.log('[AftermathAdapter] Destroyed');
  }

  async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
    this.ensureInitialized();

    try {
      const mockQuote: SwapQuote = {
        fromToken: await this.getTokenInfo(params.fromToken),
        toToken: await this.getTokenInfo(params.toToken),
        fromAmount: params.amount,
        toAmount: this.calculateMockOutput(params.amount),
        minAmountOut: this.calculateMinOutput(params.amount, params.slippage || 0.005),
        priceImpact: 0.002,
        route: [
          {
            protocol: 'Aftermath Finance',
            percentage: 100,
            path: [params.fromToken, params.toToken],
          },
        ],
        estimatedGas: '1000000',
        estimatedGasUSD: 0.05,
        validUntil: new Date(Date.now() + 60000),
        metadata: {
          routerAddress: '0xaftermath_router_address',
          aggregatorUsed: true,
          pricePerToken: 1.0,
        },
      };

      return mockQuote;
    } catch (error) {
      console.error('[AftermathAdapter] getQuote failed:', error);
      throw new Error(`Failed to get quote from Aftermath: ${(error as Error).message}`);
    }
  }

  async executeSwap(params: SwapExecutionParams): Promise<SwapResult> {
    this.ensureInitialized();

    try {
      const mockResult: SwapResult = {
        transactionHash: '0xmock_aftermath_hash',
        status: 'pending',
        fromAmount: params.quote.fromAmount,
        toAmount: params.quote.toAmount,
        actualPriceImpact: params.quote.priceImpact,
        gasUsed: params.quote.estimatedGas,
      };

      return mockResult;
    } catch (error) {
      console.error('[AftermathAdapter] executeSwap failed:', error);
      throw new Error(`Failed to execute swap on Aftermath: ${(error as Error).message}`);
    }
  }

  async getSupportedTokens(): Promise<Token[]> {
    this.ensureInitialized();

    return [
      {
        address: '0x2::sui::SUI',
        symbol: 'SUI',
        name: 'SUI',
        decimals: 9,
        logoUrl: 'https://sui.io/logo.png',
        priceUSD: 2.5,
      },
      {
        address: '0xaf8cd5edc19c4512f4259f0bee101a40d41eb881e0e0755ea418e2a5f3e6e38::usdc::USDC',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        logoUrl: 'https://usdc.circle.com/logo.png',
        priceUSD: 1.0,
      },
      {
        address: '0xc060006111016b8a029ad1e843526c64f45b48519a479e29868cef48e671045::usdt::USDT',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        logoUrl: 'https://tether.to/logo.png',
        priceUSD: 1.0,
      },
    ];
  }

  async isTokenSupported(tokenAddress: string): Promise<boolean> {
    const tokens = await this.getSupportedTokens();
    return tokens.some(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
  }

  async getFeeStructure(): Promise<FeeStructure> {
    return {
      protocolFee: 0.0025,
      platformFee: 0.0005,
      totalFee: 0.003,
      feeBreakdown: 'Protocol: 0.25% | Platform: 0.05%',
    };
  }

  async getLiquidity(tokenPair: [string, string]): Promise<LiquidityInfo> {
    this.ensureInitialized();

    return {
      token0Reserve: '1000000000000',
      token1Reserve: '2500000000000',
      totalLiquidityUSD: 3500000,
      volume24h: 500000,
    };
  }

  getSecurityInfo(): ProtocolSecurityInfo {
    return {
      isAudited: true,
      auditors: ['CertiK', 'MoveBit'],
      auditReportUrl: 'https://aftermath.finance/audits',
      hasBugBounty: true,
      isOpenSource: true,
      securityRating: 92,
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      await this.getSupportedTokens();
      return true;
    } catch (error) {
      console.error('[AftermathAdapter] Availability check failed:', error);
      return false;
    }
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      const isHealthy = await this.isAvailable();
      const latency = Date.now() - startTime;

      return {
        isOperational: isHealthy,
        latency,
        lastUpdated: new Date(),
        issues: isHealthy ? undefined : ['API unavailable'],
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
    return '1000000';
  }

  async getMaxSwapAmount(token: string): Promise<string> {
    return '1000000000000000';
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Aftermath adapter not initialized. Call initialize() first.');
    }
  }

  private async getTokenInfo(tokenAddress: string): Promise<Token> {
    const tokens = await this.getSupportedTokens();
    const token = tokens.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());

    if (!token) {
      throw new Error(`Token ${tokenAddress} not supported by Aftermath`);
    }

    return token;
  }

  private calculateMockOutput(inputAmount: string): string {
    const input = parseFloat(inputAmount);
    const output = input * 0.998;
    return output.toString();
  }

  private calculateMinOutput(inputAmount: string, slippage: number): string {
    const output = this.calculateMockOutput(inputAmount);
    const outputNum = parseFloat(output);
    const minOutput = outputNum * (1 - slippage);
    return minOutput.toString();
  }
}

export default new AftermathSwapAdapter();
