import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';
import type { Logger } from 'pino';
import type { TransactionRecord, ProtocolRoute } from '../types';

export class TransactionService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private logger: Logger,
  ) {}

  async createTransaction(data: {
    userId: string;
    walletId: string;
    chainId: string;
    type: string;
    status: string;
    fromAddress: string;
    toAddress: string;
    amount: string;
    tokenSymbol: string;
    tokenAddress: string;
    protocol: string;
    fee: string;
    feeUSD: number;
    hash?: string;
    intent?: any;
    metadata?: any;
  }): Promise<TransactionRecord> {
    try {
      const transaction = await this.prisma.transaction.create({
        data: {
          userId: data.userId,
          walletId: data.walletId,
          chainId: data.chainId,
          type: data.type,
          status: data.status,
          fromAddress: data.fromAddress,
          toAddress: data.toAddress,
          amount: data.amount,
          tokenSymbol: data.tokenSymbol,
          tokenAddress: data.tokenAddress,
          protocol: data.protocol,
          fee: data.fee,
          feeUSD: data.feeUSD,
          hash: data.hash,
          metadata: data.metadata,
        },
      });

      this.logger.info('Transaction created', { transactionId: transaction.id, protocol: data.protocol });

      await this.invalidateBalanceCache(data.walletId);
      await this.invalidatePortfolioCache(data.userId);

      return transaction as TransactionRecord;
    } catch (error) {
      this.logger.error('Failed to create transaction', { error });
      throw error;
    }
  }

  async getTransaction(id: string): Promise<TransactionRecord | null> {
    try {
      const cacheKey = `transaction:${id}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const transaction = await this.prisma.transaction.findUnique({
        where: { id },
      });

      if (transaction) {
        await this.redis.setex(cacheKey, 300, JSON.stringify(transaction));
      }

      return transaction as TransactionRecord | null;
    } catch (error) {
      this.logger.error('Failed to fetch transaction', { id, error });
      throw error;
    }
  }

  async getTransactions(filters: {
    walletId?: string;
    userId?: string;
    chainId?: string;
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ transactions: TransactionRecord[]; total: number }> {
    try {
      const where: any = {};
      if (filters.walletId) where.walletId = filters.walletId;
      if (filters.userId) where.userId = filters.userId;
      if (filters.chainId) where.chainId = filters.chainId;
      if (filters.type) where.type = filters.type;
      if (filters.status) where.status = filters.status;

      const [transactions, total] = await Promise.all([
        this.prisma.transaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: filters.limit || 50,
          skip: filters.offset || 0,
        }),
        this.prisma.transaction.count({ where }),
      ]);

      return { transactions: transactions as TransactionRecord[], total };
    } catch (error) {
      this.logger.error('Failed to fetch transactions', { filters, error });
      throw error;
    }
  }

  async updateTransactionStatus(id: string, status: string, hash?: string): Promise<TransactionRecord> {
    try {
      const transaction = await this.prisma.transaction.update({
        where: { id },
        data: {
          status,
          hash: hash || undefined,
          confirmedAt: status === 'CONFIRMED' ? new Date() : undefined,
        },
      });

      const cacheKey = `transaction:${id}`;
      await this.redis.del(cacheKey);

      this.logger.info('Transaction status updated', { transactionId: id, status, hash });

      return transaction as TransactionRecord;
    } catch (error) {
      this.logger.error('Failed to update transaction status', { id, status, error });
      throw error;
    }
  }

  async cancelTransaction(id: string): Promise<TransactionRecord> {
    try {
      const transaction = await this.prisma.transaction.findUnique({ where: { id } });
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status === 'CONFIRMED') {
        throw new Error('Cannot cancel confirmed transaction');
      }

      const cancelled = await this.prisma.transaction.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      const cacheKey = `transaction:${id}`;
      await this.redis.del(cacheKey);

      this.logger.info('Transaction cancelled', { transactionId: id });

      return cancelled as TransactionRecord;
    } catch (error) {
      this.logger.error('Failed to cancel transaction', { id, error });
      throw error;
    }
  }

  async startMonitoring(transactionId: string, chainId: string): Promise<void> {
    try {
      const monitoringKey = `monitoring:${transactionId}`;
      await this.redis.setex(monitoringKey, 3600, JSON.stringify({ chainId, startedAt: new Date() }));
      this.logger.info('Transaction monitoring started', { transactionId, chainId });
    } catch (error) {
      this.logger.error('Failed to start transaction monitoring', { transactionId, error });
    }
  }

  async publishTransactionEvent(
    event: string,
    data: {
      transactionId: string;
      userId: string;
      type: string;
      protocol: string;
      status?: string;
    }
  ): Promise<void> {
    try {
      const channel = `transaction:${event}`;
      await this.redis.publish(channel, JSON.stringify(data));
      this.logger.debug('Transaction event published', { event, transactionId: data.transactionId });
    } catch (error) {
      this.logger.error('Failed to publish transaction event', { event, error });
    }
  }

  private async invalidateBalanceCache(walletId: string): Promise<void> {
    try {
      await this.redis.del(`balance:${walletId}`);
    } catch (error) {
      this.logger.warn('Failed to invalidate balance cache', { walletId, error });
    }
  }

  private async invalidatePortfolioCache(userId: string): Promise<void> {
    try {
      await this.redis.del(`portfolio:${userId}`);
    } catch (error) {
      this.logger.warn('Failed to invalidate portfolio cache', { userId, error });
    }
  }
}
