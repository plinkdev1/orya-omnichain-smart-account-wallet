import DataLoader from 'dataloader';
import { Wallet, Balance, NFT, DataLoaders } from './types';

export function createDataLoaders(prisma: any, logger: any): DataLoaders {
  const walletById = new DataLoader(async (walletIds: readonly string[]) => {
    try {
      const wallets = await prisma.wallet.findMany({
        where: {
          id: { in: [...walletIds] },
        },
      });

      const walletMap = new Map<string, Wallet>();
      wallets.forEach((w: Wallet) => walletMap.set(w.id, w));

      return walletIds.map(id => walletMap.get(id) || null);
    } catch (error) {
      logger.error('Error loading wallets by id:', error);
      throw error;
    }
  });

  const walletsByUserId = new DataLoader(async (userIds: readonly string[]) => {
    try {
      const wallets = await prisma.wallet.findMany({
        where: {
          userId: { in: [...userIds] },
        },
      });

      return userIds.map(userId =>
        wallets.filter((w: Wallet) => w.userId === userId)
      );
    } catch (error) {
      logger.error('Error loading wallets by user id:', error);
      throw error;
    }
  });

  const balancesByWalletId = new DataLoader(async (walletIds: readonly string[]) => {
    try {
      const balances = await prisma.balance.findMany({
        where: {
          walletId: { in: [...walletIds] },
        },
      });

      return walletIds.map(walletId =>
        balances.filter((b: Balance) => b.walletId === walletId)
      );
    } catch (error) {
      logger.error('Error loading balances by wallet id:', error);
      throw error;
    }
  });

  const nftsByWalletId = new DataLoader(async (walletIds: readonly string[]) => {
    try {
      const nfts = await prisma.nft.findMany({
        where: {
          walletId: { in: [...walletIds] },
        },
      });

      return walletIds.map(walletId =>
        nfts.filter((n: NFT) => n.walletId === walletId)
      );
    } catch (error) {
      logger.error('Error loading nfts by wallet id:', error);
      throw error;
    }
  });

  return {
    walletById,
    walletsByUserId,
    balancesByWalletId,
    nftsByWalletId,
  };
}
