import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { parse } from 'graphql';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { SUIRpcDataSource } from './datasources/sui-rpc.js';
import { walletResolvers } from './resolvers/wallet.js';
import { transactionResolvers } from './resolvers/transaction.js';
import { objectResolvers } from './resolvers/object.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const typeDefsString = readFileSync(join(__dirname, 'schema.graphql'), 'utf-8');
const typeDefs = parse(typeDefsString);

const resolvers = {
  Query: {
    ...walletResolvers.Query,
    ...transactionResolvers.Query,
  },
  SUIWallet: walletResolvers.SUIWallet,
  SUIBalance: walletResolvers.SUIBalance,
  SUICoin: walletResolvers.SUICoin,
  SUITransaction: transactionResolvers.SUITransaction,
  TransactionEffects: transactionResolvers.TransactionEffects,
  SUIEvent: transactionResolvers.SUIEvent,
  SUIObject: objectResolvers.SUIObject,
  ObjectOwner: objectResolvers.ObjectOwner,
  ObjectDisplay: objectResolvers.ObjectDisplay,
};

const schema = buildSubgraphSchema([
  {
    typeDefs,
    resolvers,
  },
]);

const server = new ApolloServer({
  schema,
  formatError: (err: any) => {
    console.error('GraphQL Error:', err);
    return {
      message: err.message,
      extensions: {
        code: (err.extensions?.code as string) || 'INTERNAL_SERVER_ERROR',
      },
    };
  },
});

const port = process.env.PORT || 4005;

startStandaloneServer(server, {
  context: async () => {
    return {
      dataSources: {
        suiRpc: new SUIRpcDataSource(),
      },
    };
  },
  listen: { port: Number(port) },
}).then(({ url }: { url: string }) => {
  console.log(`🚀 SUI Subgraph server ready at ${url}`);
  console.log(`📊 GraphQL endpoint: ${url}`);
  console.log(`🔗 SUI RPC: https://sui-mainnet.mystenlabs.com/graphql`);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
