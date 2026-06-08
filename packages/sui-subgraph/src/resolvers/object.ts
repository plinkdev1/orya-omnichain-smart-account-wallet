import DataLoader from 'dataloader';
import { SUIRpcDataSource } from '../datasources/sui-rpc.js';

const objectLoader = new DataLoader(async (objectIds: readonly string[]) => {
  const rpc = new SUIRpcDataSource();
  return Promise.all(Array.from(objectIds).map((id) => rpc.getOwnedObjects(id).catch(() => [])));
});

export const objectResolvers = {
  SUIObject: {
    __resolveReference: async (obj: any, { dataSources }: any) => {
      const objects = await dataSources.suiRpc.getOwnedObjects(obj.owner?.address || '');
      return objects.find((o: any) => o.objectId === obj.objectId) || obj;
    },

    objectId: (obj: any) => obj.objectId,
    version: (obj: any) => parseInt(obj.version || '0'),
    digest: (obj: any) => obj.digest,
    type: (obj: any) => obj.type,

    owner: (obj: any) => {
      if (!obj.owner) {
        return { type: 'Unknown' };
      }

      if (typeof obj.owner === 'string') {
        return { type: 'Address', address: obj.owner };
      }

      if (obj.owner.__typename === 'AddressOwner') {
        return { type: 'Address', address: obj.owner.address };
      }

      if (obj.owner.__typename === 'ObjectOwner') {
        return { type: 'Object', objectId: obj.owner.objectId };
      }

      if (obj.owner.__typename === 'Shared') {
        return { type: 'Shared', address: obj.owner.initialSharedVersion };
      }

      if (obj.owner.__typename === 'Immutable') {
        return { type: 'Immutable' };
      }

      return obj.owner;
    },

    previousTransaction: (obj: any) => obj.previousTransaction,
    storageRebate: (obj: any) => obj.storageRebate || '0',

    display: (obj: any) => ({
      data: obj.display?.data,
      error: obj.display?.error,
    }),
  },

  ObjectOwner: {
    type: (owner: any) => owner.type || 'Unknown',
    address: (owner: any) => owner.address,
    objectId: (owner: any) => owner.objectId,
  },

  ObjectDisplay: {
    data: (display: any) => {
      if (typeof display.data === 'string') {
        try {
          return JSON.stringify(JSON.parse(display.data));
        } catch {
          return display.data;
        }
      }
      return display.data ? JSON.stringify(display.data) : null;
    },
    error: (display: any) => display.error,
  },
};
