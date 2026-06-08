import DataLoader from 'dataloader';
import { SUIRpcDataSource } from '../datasources/sui-rpc.js';

const transactionLoader = new DataLoader(async (digests: readonly string[]) => {
  const rpc = new SUIRpcDataSource();
  return Promise.all(Array.from(digests).map((digest) => rpc.getTransactionBlock(digest).catch(() => null)));
});

export const transactionResolvers = {
  Query: {
    suiTransaction: async (_: any, { digest }: { digest: string }, { dataSources }: any) => {
      return await dataSources.suiRpc.getTransactionBlock(digest);
    },

    suiEvents: async (
      _: any,
      { filter }: { filter: any },
      { dataSources }: any
    ) => {
      return await dataSources.suiRpc.queryEvents(filter);
    },
  },

  SUITransaction: {
    __resolveReference: async (tx: any, { dataSources }: any) => {
      return await dataSources.suiRpc.getTransactionBlock(tx.digest);
    },

    digest: (tx: any) => tx.digest,
    sender: (tx: any) => tx.sender,
    gasPrice: (tx: any) => tx.gasPrice || '1',
    gasBudget: (tx: any) => tx.gasBudget || '0',
    gasUsed: (tx: any) => tx.effects?.gasUsed || tx.gasUsed,
    timestamp: (tx: any) => tx.timestamp,

    effects: (tx: any) => ({
      status: tx.effects?.status || 'SUCCESS',
      gasUsed: tx.effects?.gasUsed || '0',
      computationCost: tx.effects?.computationCost || '0',
      storageCost: tx.effects?.storageCost || '0',
      storageRebate: tx.effects?.storageRebate || '0',
      nonRefundableStorageFee: tx.effects?.nonRefundableStorageFee || '0',
    }),

    events: (tx: any) => (tx.events && tx.events.data ? tx.events.data : []),

    status: (tx: any) => {
      const status = tx.effects?.status?.toLowerCase() || 'success';
      if (status === 'success') return 'SUCCESS';
      if (status === 'failure') return 'FAILURE';
      return 'PENDING';
    },
  },

  TransactionEffects: {
    status: (effects: any) => effects.status || 'SUCCESS',
    gasUsed: (effects: any) => effects.gasUsed || '0',
    computationCost: (effects: any) => effects.computationCost || '0',
    storageCost: (effects: any) => effects.storageCost || '0',
    storageRebate: (effects: any) => effects.storageRebate || '0',
    nonRefundableStorageFee: (effects: any) => effects.nonRefundableStorageFee || '0',
  },

  SUIEvent: {
    id: (event: any) => event.id,
    packageId: (event: any) => event.packageId,
    transactionModule: (event: any) => event.transactionModule,
    transactionFunction: (event: any) => event.transactionFunction,
    eventType: (event: any) => event.eventType,
    sender: (event: any) => event.sender,
    parsedJson: (event: any) => event.parsedJson,
    bcs: (event: any) => event.bcs,
    timestampMs: (event: any) => event.timestampMs,
  },
};
