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
import { ZeroXClient } from './ZeroXClient';
import type { ZeroXChain } from './ZeroXTypes';

export class ZeroXAdapter extends ProtocolAdapter implements ISwapProtocol {
  readonly name = '0x Protocol';
  readonly chainId: string;
  readonly version = '1.0.0';
  readonly logoUrl = 'https://0x.org/logo.png';
  readonly features = {
    swap: true,
    stake: false,
    lend: false,
    bridge: false,
    aggregator: true,
  };

  private client: ZeroXClient;
  private initialized = false;
  private supportedTokens: Token[] = [];

  constructor(chainId: ZeroXChain, apiKey: string) {
    super();
    this.chainId = chainId;
    this.client = new ZeroXClient(chainId, apiKey);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.client.getSupportedTokens();
      this.initialized = true;
      console.log(`[ZeroXAdapter] Initialized for ${this.chainId}`);
    } catch (error) {
      console.error('[ZeroXAdapter] Initialization failed:', error);
      throw error;
    }
  }

  async destroy(): Promise<void> {
    this.initialized = false;
    this.supportedTokens = [];
  }

  async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
    this.ensureInitialized();

    try {
      const zeroXQuote = await this.client.getSwapQuote({
        sellToken: params.fromToken,
        buyToken: params.toToken,
        sellAmount: params.amount,
        slippagePercentage: params.slippage || 0.005,
        takerAddress: params.userAddress,
      });

      return {
        fromToken: await this.getTokenInfo(params.fromToken),
        toToken: await this.getTokenInfo(params.toToken),
        fromAmount: zeroXQuote.sellAmount,
        toAmount: zeroXQuote.buyAmount,
        minAmountOut: this.calculateMinOutput(
          zeroXQuote.buyAmount,
          params.slippage || 0.005
        ),
        priceImpact: parseFloat(zeroXQuote.estimatedPriceImpact),
        route: zeroXQuote.sources.map(source => ({
          protocol: source.name,
          percentage: parseFloat(source.proportion) * 100,
          path: [params.fromToken, params.toToken],
        })),
        estimatedGas: zeroXQuote.gas,
        estimatedGasUSD: this.calculateGasCost(
          zeroXQuote.gas,
          zeroXQuote.gasPrice
        ),
        validUntil: new Date(Date.now() + 60000),
        metadata: {
          allowanceTarget: zeroXQuote.allowanceTarget,
          to: zeroXQuote.to,
          data: zeroXQuote.data,
          value: zeroXQuote.value,
          guaranteedPrice: zeroXQuote.guaranteedPrice,
          protocolFee: zeroXQuote.protocolFee,
        },
      };
    } catch (error) {
      console.error('[ZeroXAdapter] getQuote failed:', error);
      throw new Error(`Failed to get quote from 0x: ${(error as Error).message}`);
    }
  }

  async executeSwap(params: SwapExecutionParams): Promise<SwapResult> {
    this.ensureInitialized();

    try {
      const metadata = params.quote.metadata as Record<string, string>;

      const tx = {
        from: params.userAddress,
        to: metadata.to,
        data: metadata.data,
        value: metadata.value,
        gas: params.quote.estimatedGas,
      };

      return {
        transactionHash: '0x_pending',
        status: 'pending',
        fromAmount: params.quote.fromAmount,
        toAmount: params.quote.toAmount,
        actualPriceImpact: params.quote.priceImpact,
        gasUsed: params.quote.estimatedGas,
      };
    } catch (error) {
      console.error('[ZeroXAdapter] executeSwap failed:', error);
      throw new Error(`Failed to execute swap on 0x: ${(error as Error).message}`);
    }
  }

  async getSupportedTokens(): Promise<Token[]> {
    this.ensureInitialized();

    try {
      const tokens = await this.client.getSupportedTokens();

      return tokens.map((token: any) => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logoUrl: token.logoURI,
      }));
    } catch (error) {
      console.error('[ZeroXAdapter] getSupportedTokens failed:', error);
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
      console.error('[ZeroXAdapter] isTokenSupported failed:', error);
      return false;
    }
  }

  async getFeeStructure(): Promise<FeeStructure> {
    return {
      protocolFee: 0.005,
      platformFee: 0,
      totalFee: 0.005,
      feeBreakdown: '0.5% protocol fee',
    };
  }

  async getLiquidity(
    tokenPair: [string, string]
  ): Promise<{ token0Reserve: string; token1Reserve: string; totalLiquidityUSD: number; volume24h: number }> {
    this.ensureInitialized();

    try {
      const [token0, token1] = tokenPair;
      const quote = await this.client.getPrice({
        sellToken: token0,
        buyToken: token1,
        sellAmount: '1000000000000000000',
      });

      return {
        token0Reserve: '0',
        token1Reserve: '0',
        totalLiquidityUSD: 0,
        volume24h: 0,
      };
    } catch (error) {
      console.error('[ZeroXAdapter] getLiquidity failed:', error);
      return {
        token0Reserve: '0',
        token1Reserve: '0',
        totalLiquidityUSD: 0,
        volume24h: 0,
      };
    }
  }

  getSecurityInfo(): ProtocolSecurityInfo {
    return {
      isAudited: true,
      auditors: ['Trail of Bits', 'OpenZeppelin'],
      auditReportUrl: 'https://0x.org/security',
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
      await this.client.getSupportedTokens();
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
      throw new Error('ZeroXAdapter not initialized. Call initialize() first.');
    }
  }

  private async getTokenInfo(tokenAddress: string): Promise<Token> {
    const tokens = await this.getSupportedTokens();
    const token = tokens.find(
      t => t.address.toLowerCase() === tokenAddress.toLowerCase()
    );

    if (!token) {
      return {
        address: tokenAddress,
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: 18,
      };
    }

    return token;
  }

  private calculateMinOutput(outputAmount: string, slippage: number): string {
    const output = BigInt(outputAmount);
    const slippageBp = BigInt(Math.floor(slippage * 10000));
    const minOutput = output - (output * slippageBp) / BigInt(10000);
    return minOutput.toString();
  }

  private calculateGasCost(gasEstimate: string, gasPrice: string): number {
    try {
      const gas = BigInt(gasEstimate);
      const price = BigInt(gasPrice);
      const weiCost = gas * price;
      const ethCost = Number(weiCost) / 1e18;
      const usdPrice = 2000;
      return ethCost * usdPrice;
    } catch {
      return 0;
    }
  }
}
