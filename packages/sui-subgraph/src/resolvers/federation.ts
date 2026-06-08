import { SUIRpcDataSource } from '../datasources/sui-rpc.js';

export const federationResolvers = {
  User: {
    __resolveReference: async (user: any) => {
      return user;
    },

    suiWallets: async (user: any) => {
      const rpc = new SUIRpcDataSource();

      if (!user.walletAddresses || user.walletAddresses.length === 0) {
        return [];
      }

      const wallets = await Promise.all(
        user.walletAddresses
          .filter((addr: any) => addr.chain === 'SUI')
          .map(async (walletRef: any) => {
            const data = await rpc.getAddress(walletRef.address).catch(() => null);
            if (!data) return null;

            return {
              userId: user.id,
              chain: 'SUI',
              address: walletRef.address,
              balance: data.balance,
              coins: data.coins,
              createdAt: walletRef.createdAt || new Date().toISOString(),
              updatedAt: walletRef.updatedAt || new Date().toISOString(),
            };
          })
      );

      return wallets.filter((w: any) => w !== null);
    },
  },

  Query: {
    userSuiWallets: async (_: any, { userId }: { userId: string }, { dataSources }: any) => {
      return [];
    },
  },
};
