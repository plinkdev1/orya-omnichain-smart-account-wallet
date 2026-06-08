import DataLoader from 'dataloader';
import type { PrismaClient } from '@prisma/client';
import type { Logger } from 'pino';
import type { DataLoaders } from './types';

export function createDataLoaders(prisma: PrismaClient, logger: Logger): DataLoaders {
  const userLoader = new DataLoader(async (userIds: readonly string[]) => {
    try {
      const users = await prisma.user.findMany({
        where: { id: { in: userIds as string[] } },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));
      return userIds.map((id) => userMap.get(id as string) || null);
    } catch (error) {
      logger.error('User dataloader failed', { error });
      throw error;
    }
  });

  const walletLoader = new DataLoader(async (walletIds: readonly string[]) => {
    try {
      const wallets = await prisma.wallet.findMany({
        where: { id: { in: walletIds as string[] } },
        include: { balances: true },
      });

      const walletMap = new Map(wallets.map((w) => [w.id, w]));
      return walletIds.map((id) => walletMap.get(id as string) || null);
    } catch (error) {
      logger.error('Wallet dataloader failed', { error });
      throw error;
    }
  });

  const transactionLoader = new DataLoader(async (transactionIds: readonly string[]) => {
    try {
      const transactions = await prisma.transaction.findMany({
        where: { id: { in: transactionIds as string[] } },
      });

      const txMap = new Map(transactions.map((t) => [t.id, t]));
      return transactionIds.map((id) => txMap.get(id as string) || null);
    } catch (error) {
      logger.error('Transaction dataloader failed', { error });
      throw error;
    }
  });

  return {
    userLoader,
    walletLoader,
    transactionLoader,
  };
}
