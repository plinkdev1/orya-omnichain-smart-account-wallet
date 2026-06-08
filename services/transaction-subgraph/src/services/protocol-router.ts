import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';
import type { Logger } from 'pino';
import type { ProtocolRoute, ProtocolQuote, ExecutionResult } from '../types';

export class ProtocolRouter {
  private cache: Map<string, ProtocolRoute> = new Map();

  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private logger: Logger,
  ) {}

  async getProtocol(
    chainId: string,
    feature: string,
    options?: { preferredProtocol?: string }
  ): Promise<ProtocolRoute> {
    const cacheKey = `protocol:${chainId}:${feature}:${options?.preferredProtocol || 'default'}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const route = await this.selectProtocol(chainId, feature, options?.preferredProtocol);
      this.cache.set(cacheKey, route);
      return route;
    } catch (error) {
      this.logger.error('Failed to get protocol', { chainId, feature, error });
      throw error;
    }
  }

  private async selectProtocol(
    chainId: string,
    feature: string,
    preferredProtocolId?: string
  ): Promise<ProtocolRoute> {
    const cacheKeyPrisma = `protocols:${chainId}:${feature}`;
    let cachedProtocols = await this.redis.get(cacheKeyPrisma);
    let protocols: any[] = [];

    if (cachedProtocols) {
      protocols = JSON.parse(cachedProtocols);
    } else {
      protocols = await this.prisma.protocol.findMany({
        where: {
          chainId,
          type: feature,
          isActive: true,
        },
        orderBy: [
          { tier: 'asc' },
          { isAudited: 'desc' },
        ],
      });
      await this.redis.setex(cacheKeyPrisma, 3600, JSON.stringify(protocols));
    }

    if (!protocols || protocols.length === 0) {
      throw new Error(`No active protocols found for ${chainId}:${feature}`);
    }

    let selectedProtocol = protocols[0];
    let isPreferred = false;

    if (preferredProtocolId) {
      const preferred = protocols.find((p) => p.id === preferredProtocolId);
      if (preferred) {
        selectedProtocol = preferred;
        isPreferred = true;
      }
    }

    return {
      protocolId: selectedProtocol.id,
      metadata: {
        name: selectedProtocol.name,
        id: selectedProtocol.id,
        chainId: selectedProtocol.chainId,
        type: selectedProtocol.type,
        contractAddress: selectedProtocol.metadata?.contractAddress,
      },
      isPreferred,
      isFallback: false,
      protocol: selectedProtocol,
    };
  }

  async getBestProtocolForIntent(options: {
    type: string;
    chainId: string;
    inputToken: string;
    outputToken: string;
    amount: string;
    preference: string;
    userPreferences?: any;
  }): Promise<ProtocolRoute> {
    const { type, chainId, preference, userPreferences } = options;

    if (preference === 'USER_PREFERRED' && userPreferences?.protocols) {
      const userPref = userPreferences.protocols.find(
        (p: any) => p.chainId === chainId && p.feature === type
      );
      if (userPref?.preferredProtocol) {
        return this.getProtocol(chainId, type, { preferredProtocol: userPref.preferredProtocol });
      }
    }

    return this.getProtocol(chainId, type);
  }

  async executeWithFailover(
    chainId: string,
    feature: string,
    executor: (protocol: any) => Promise<ExecutionResult>,
    options?: { maxRetries: number }
  ): Promise<ExecutionResult> {
    const maxRetries = options?.maxRetries || 3;
    const fallbackProtocols = await this.getFallbackProtocols(chainId, feature);

    let lastError: Error | null = null;

    for (let i = 0; i < Math.min(maxRetries, fallbackProtocols.length); i++) {
      try {
        const protocol = fallbackProtocols[i];
        this.logger.info(`Attempting execution with protocol: ${protocol.id}`, { attempt: i + 1 });
        const result = await executor(protocol);
        this.logger.info(`Execution successful with protocol: ${protocol.id}`);
        return result;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Protocol execution failed, trying next fallback`, {
          protocol: fallbackProtocols[i]?.id,
          error: (error as Error).message,
          attempt: i + 1,
        });
      }
    }

    throw new Error(`All protocol attempts failed: ${lastError?.message}`);
  }

  private async getFallbackProtocols(chainId: string, feature: string): Promise<any[]> {
    const cacheKey = `fallback-protocols:${chainId}:${feature}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const protocols = await this.prisma.protocol.findMany({
      where: {
        chainId,
        type: feature,
        isActive: true,
      },
      orderBy: [
        { tier: 'asc' },
        { isAudited: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    await this.redis.setex(cacheKey, 3600, JSON.stringify(protocols));
    return protocols;
  }

  async getProtocolQuote(
    protocol: any,
    options: {
      fromToken: string;
      toToken: string;
      amount: string;
      chainId: string;
      slippage: number;
      userAddress?: string;
    }
  ): Promise<ProtocolQuote> {
    try {
      const quote = await protocol.getQuote({
        fromToken: options.fromToken,
        toToken: options.toToken,
        amount: options.amount,
        chainId: options.chainId,
        slippage: options.slippage,
        userAddress: options.userAddress,
      });

      return quote;
    } catch (error) {
      this.logger.error('Failed to get protocol quote', { error, protocol: protocol.id });
      throw error;
    }
  }

  async executeProtocolSwap(
    protocol: any,
    quote: ProtocolQuote,
    options: {
      userAddress: string;
      maxSlippage: number;
    }
  ): Promise<ExecutionResult> {
    try {
      const result = await protocol.executeSwap({
        quote,
        userAddress: options.userAddress,
        maxSlippage: options.maxSlippage,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to execute protocol swap', { error, protocol: protocol.id });
      throw error;
    }
  }

  invalidateProtocolCache(chainId?: string, feature?: string): void {
    if (chainId && feature) {
      const keys = Array.from(this.cache.keys()).filter((key) =>
        key.includes(`${chainId}:${feature}`)
      );
      keys.forEach((key) => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }
}
