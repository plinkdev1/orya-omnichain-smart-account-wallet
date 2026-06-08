import { SUIRpcDataSource } from '../datasources/sui-rpc.js';
import DataLoader from 'dataloader';

const addressLoader = new DataLoader(async (addresses: readonly string[]) => {
  const rpc = new SUIRpcDataSource();
  return Promise.all(Array.from(addresses).map((addr) => rpc.getAddress(addr).catch(() => null)));
});

const balanceLoader = new DataLoader(async (addresses: readonly string[]) => {
  const rpc = new SUIRpcDataSource();
  return Promise.all(Array.from(addresses).map((addr) => rpc.getBalance(addr).catch(() => null)));
});

const coinsLoader = new DataLoader(async (addresses: readonly string[]) => {
  const rpc = new SUIRpcDataSource();
  return Promise.all(Array.from(addresses).map((addr) => rpc.getCoins(addr).catch(() => [])));
});

const objectsLoader = new DataLoader(async (addresses: readonly string[]) => {
  const rpc = new SUIRpcDataSource();
  return Promise.all(Array.from(addresses).map((addr) => rpc.getOwnedObjects(addr).catch(() => [])));
});

const transactionsLoader = new DataLoader(async (addresses: readonly string[]) => {
  const rpc = new SUIRpcDataSource();
  return Promise.all(Array.from(addresses).map((addr) => rpc.getTransactions(addr).catch(() => [])));
});

export const walletResolvers = {
  Query: {
    suiWallet: async (_: any, { userId, address }: { userId: string; address: string }, { dataSources }: any) => {
      const data = await dataSources.suiRpc.getAddress(address);
      return {
        userId,
        chain: 'SUI',
        address,
        balance: data.balance,
        coins: data.coins,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
  },

  SUIWallet: {
    __resolveReference: async (wallet: any, { dataSources }: any) => {
      const data = await dataSources.suiRpc.getAddress(wallet.address);
      return {
        ...wallet,
        balance: data.balance,
        coins: data.coins,
      };
    },

    balance: async (wallet: any, _: any, { dataSources }: any) => {
      const balance = await balanceLoader.load(wallet.address);
      return balance || { total: '0', coinType: '0x2::sui::SUI' };
    },

    coins: async (wallet: any, _: any, { dataSources }: any) => {
      const coins = await coinsLoader.load(wallet.address);
      const coinMap = new Map<string, any>();

      coins.forEach((coin: any) => {
        const existing = coinMap.get(coin.coinType);
        if (existing) {
          existing.balance = (BigInt(existing.balance) + BigInt(coin.balance)).toString();
          existing.coinObjectCount += 1;
        } else {
          coinMap.set(coin.coinType, {
            coinType: coin.coinType,
            balance: coin.balance,
            coinObjectCount: 1,
          });
        }
      });

      return Array.from(coinMap.values());
    },

    transactions: async (
      wallet: any,
      { first = 20, after }: { first?: number; after?: string },
      { dataSources }: any
    ) => {
      const transactions = await transactionsLoader.load(wallet.address);
      const startIndex = after ? parseInt(Buffer.from(after, 'base64').toString()) : 0;
      const endIndex = startIndex + (first || 20);
      const paginated = transactions.slice(startIndex, endIndex);

      return {
        edges: paginated.map((tx: any, idx: number) => ({
          cursor: Buffer.from((startIndex + idx).toString()).toString('base64'),
          node: tx,
        })),
        pageInfo: {
          hasNextPage: endIndex < transactions.length,
          hasPreviousPage: startIndex > 0,
          startCursor: Buffer.from(startIndex.toString()).toString('base64'),
          endCursor: Buffer.from((endIndex - 1).toString()).toString('base64'),
        },
        totalCount: transactions.length,
      };
    },

    nfts: async (wallet: any, _: any, { dataSources }: any) => {
      const objects = await objectsLoader.load(wallet.address);
      return objects.filter(
        (obj: any) =>
          obj.type &&
          (obj.type.includes('0x2::nft') || obj.type.includes('Nft') || obj.type.includes('NFT'))
      );
    },
  },

  SUIBalance: {
    total: (balance: any) => balance.totalBalance || balance.total || '0',
    coinType: (balance: any) => balance.coinType || '0x2::sui::SUI',
    lockedBalance: (balance: any) => balance.lockedBalance || null,
  },

  SUICoin: {
    balance: (coin: any) => coin.balance || '0',
    coinObjectCount: (coin: any) => coin.coinObjectCount || 1,
  },
};
