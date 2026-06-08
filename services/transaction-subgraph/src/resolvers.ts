import type { GraphQLContext, SwapIntentInput, BridgeIntentInput, TransactionRecord } from './types';
import { requireAuth } from './middleware/auth';

export const resolvers = {
  Query: {
    transaction: async (_parent: any, args: { id: string }, context: GraphQLContext) => {
      requireAuth(context);
      return context.transactionService.getTransaction(args.id);
    },

    transactions: async (
      _parent: any,
      args: {
        walletId?: string;
        userId?: string;
        chainId?: string;
        type?: string;
        status?: string;
        pagination?: { first?: number; after?: string; last?: number; before?: string };
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const { transactions, total } = await context.transactionService.getTransactions({
        walletId: args.walletId,
        userId: args.userId || context.user?.id,
        chainId: args.chainId,
        type: args.type,
        status: args.status,
        limit: args.pagination?.first || 50,
        offset: 0,
      });

      return {
        edges: transactions.map((tx) => ({
          node: tx,
          cursor: Buffer.from(tx.id).toString('base64'),
        })),
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: transactions.length > 0 ? Buffer.from(transactions[0].id).toString('base64') : null,
          endCursor: transactions.length > 0 ? Buffer.from(transactions[transactions.length - 1].id).toString('base64') : null,
        },
        totalCount: total,
      };
    },

    estimateGas: async (
      _parent: any,
      args: {
        chainId: string;
        from: string;
        to: string;
        amount: string;
        tokenAddress: string;
        protocol?: string;
      },
      context: GraphQLContext
    ) => {
      try {
        const gasPrice = await context.rpcManager.getGasPrice(args.chainId);
        const gasLimit = '21000';

        return {
          chainId: args.chainId,
          gasPrice,
          gasLimit,
          estimatedFee: (BigInt(gasPrice) * BigInt(gasLimit)).toString(),
          estimatedFeeUSD: 100.0,
        };
      } catch (error) {
        context.logger.error('Gas estimation failed', { error });
        throw new Error(`Failed to estimate gas: ${(error as Error).message}`);
      }
    },

    swapQuote: async (
      _parent: any,
      args: {
        chainId: string;
        protocol?: string;
        fromToken: string;
        toToken: string;
        amount: string;
        slippage?: number;
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const route = await context.protocolRouter.getProtocol(args.chainId, 'swap', {
          preferredProtocol: args.protocol,
        });

        const quote = await context.protocolRouter.getProtocolQuote(route.protocol, {
          fromToken: args.fromToken,
          toToken: args.toToken,
          amount: args.amount,
          chainId: args.chainId,
          slippage: args.slippage || 0.01,
          userAddress: context.user?.id,
        });

        return {
          id: Math.random().toString(36).substr(2, 9),
          protocol: route.metadata.name,
          fromToken: args.fromToken,
          toToken: args.toToken,
          fromAmount: quote.fromAmount,
          toAmount: quote.toAmount,
          minAmountOut: quote.minAmountOut,
          priceImpact: quote.priceImpact,
          estimatedGas: quote.estimatedGas,
          estimatedGasUSD: quote.estimatedGasUSD,
          route: quote.route,
          validUntil: quote.validUntil,
          metadata: quote.metadata,
        };
      } catch (error) {
        context.logger.error('Swap quote failed', { error });
        throw new Error(`Failed to get swap quote: ${(error as Error).message}`);
      }
    },
  },

  Mutation: {
    initiateSwap: async (
      _parent: any,
      args: { intent: SwapIntentInput },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const intent = args.intent;
        context.logger.info('Initiating intent-based swap', {
          chainId: intent.chainId,
          preference: intent.routingPreference,
        });

        const bestProtocol = await context.protocolRouter.getBestProtocolForIntent({
          type: 'SWAP',
          chainId: intent.chainId,
          inputToken: intent.inputToken,
          outputToken: intent.outputToken,
          amount: intent.amount,
          preference: intent.routingPreference || 'BEST_PRICE',
          userPreferences: {},
        });

        const transaction = await context.protocolRouter.executeWithFailover(
          intent.chainId,
          'swap',
          async (protocol) => {
            const quote = await context.protocolRouter.getProtocolQuote(protocol, {
              fromToken: intent.inputToken,
              toToken: intent.outputToken,
              amount: intent.amount,
              chainId: intent.chainId,
              slippage: intent.maxSlippage,
              userAddress: context.user?.id,
            });

            return await context.protocolRouter.executeProtocolSwap(protocol, quote, {
              userAddress: context.user?.id || '',
              maxSlippage: intent.maxSlippage,
            });
          },
          { maxRetries: 3 }
        );

        const txRecord = await context.transactionService.createTransaction({
          userId: context.user!.id,
          walletId: context.user!.walletId,
          chainId: intent.chainId,
          type: 'SWAP',
          status: 'PENDING',
          fromAddress: context.user!.id,
          toAddress: intent.outputToken,
          amount: intent.amount,
          tokenSymbol: intent.inputToken,
          tokenAddress: intent.inputToken,
          protocol: bestProtocol.metadata.name,
          fee: '0',
          feeUSD: 0,
          hash: transaction.transactionHash,
          metadata: {
            protocolId: bestProtocol.protocolId,
            isPreferred: bestProtocol.isPreferred,
            isFallback: bestProtocol.isFallback,
            quote: transaction,
          },
        });

        await context.transactionService.publishTransactionEvent('created', {
          transactionId: txRecord.id,
          userId: context.user!.id,
          type: 'SWAP',
          protocol: bestProtocol.metadata.name,
        });

        await context.transactionService.startMonitoring(txRecord.id, intent.chainId);
        context.protocolRouter.invalidateProtocolCache();

        return txRecord;
      } catch (error) {
        context.logger.error('Intent swap failed', { error });
        throw new Error(`Swap failed: ${(error as Error).message}`);
      }
    },

    executeSwap: async (
      _parent: any,
      args: {
        chainId: string;
        protocol?: string;
        fromToken: string;
        toToken: string;
        amount: string;
        slippage: number;
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        context.logger.info('Executing direct swap', {
          chainId: args.chainId,
          protocol: args.protocol,
        });

        const route = await context.protocolRouter.getProtocol(args.chainId, 'swap', {
          preferredProtocol: args.protocol,
        });

        context.logger.info(`Using protocol: ${route.metadata.name}`);

        const quote = await context.protocolRouter.getProtocolQuote(route.protocol, {
          fromToken: args.fromToken,
          toToken: args.toToken,
          amount: args.amount,
          chainId: args.chainId,
          slippage: args.slippage,
          userAddress: context.user?.id,
        });

        const result = await context.protocolRouter.executeProtocolSwap(route.protocol, quote, {
          userAddress: context.user?.id || '',
          maxSlippage: args.slippage,
        });

        const transaction = await context.transactionService.createTransaction({
          userId: context.user!.id,
          walletId: context.user!.walletId,
          chainId: args.chainId,
          type: 'SWAP',
          status: 'PENDING',
          fromAddress: context.user!.id,
          toAddress: args.toToken,
          amount: args.amount,
          tokenSymbol: args.fromToken,
          tokenAddress: args.fromToken,
          protocol: route.metadata.name,
          fee: result.gasUsed || '0',
          feeUSD: 0,
          hash: result.transactionHash,
          metadata: {
            quote,
            protocolId: route.metadata.id,
            isPreferred: route.isPreferred,
            isFallback: route.isFallback,
          },
        });

        await context.transactionService.publishTransactionEvent('created', {
          transactionId: transaction.id,
          userId: context.user!.id,
          type: 'SWAP',
          protocol: route.metadata.name,
        });

        await context.transactionService.startMonitoring(transaction.id, args.chainId);
        context.protocolRouter.invalidateProtocolCache();

        return transaction;
      } catch (error) {
        context.logger.error('Direct swap failed', { error });
        throw new Error(`Swap execution failed: ${(error as Error).message}`);
      }
    },

    sendTokens: async (
      _parent: any,
      args: {
        walletId: string;
        toAddress: string;
        amount: string;
        tokenAddress: string;
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const transaction = await context.transactionService.createTransaction({
          userId: context.user!.id,
          walletId: args.walletId,
          chainId: 'ethereum',
          type: 'SEND',
          status: 'PENDING',
          fromAddress: context.user!.id,
          toAddress: args.toAddress,
          amount: args.amount,
          tokenSymbol: 'UNKNOWN',
          tokenAddress: args.tokenAddress,
          protocol: 'direct',
          fee: '0',
          feeUSD: 0,
        });

        await context.transactionService.publishTransactionEvent('created', {
          transactionId: transaction.id,
          userId: context.user!.id,
          type: 'SEND',
          protocol: 'direct',
        });

        return transaction;
      } catch (error) {
        context.logger.error('Send tokens failed', { error });
        throw new Error(`Send failed: ${(error as Error).message}`);
      }
    },

    cancelTransaction: async (
      _parent: any,
      args: { id: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const transaction = await context.transactionService.cancelTransaction(args.id);

        await context.transactionService.publishTransactionEvent('cancelled', {
          transactionId: transaction.id,
          userId: context.user!.id,
          type: transaction.type,
          protocol: transaction.protocol,
        });

        return transaction;
      } catch (error) {
        context.logger.error('Cancel transaction failed', { error });
        throw new Error(`Cancellation failed: ${(error as Error).message}`);
      }
    },

    initiateBridge: async (
      _parent: any,
      args: { intent: BridgeIntentInput },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        context.logger.info('Initiating bridge intent', {
          sourceChainId: args.intent.sourceChainId,
          destinationChainId: args.intent.destinationChainId,
        });

        const transaction = await context.transactionService.createTransaction({
          userId: context.user!.id,
          walletId: context.user!.walletId,
          chainId: args.intent.sourceChainId,
          type: 'BRIDGE',
          status: 'PENDING',
          fromAddress: context.user!.id,
          toAddress: args.intent.destinationChainId,
          amount: args.intent.amount,
          tokenSymbol: args.intent.token,
          tokenAddress: args.intent.token,
          protocol: 'bridge-aggregator',
          fee: '0',
          feeUSD: 0,
          metadata: {
            sourceChain: args.intent.sourceChainId,
            destinationChain: args.intent.destinationChainId,
          },
        });

        await context.transactionService.publishTransactionEvent('created', {
          transactionId: transaction.id,
          userId: context.user!.id,
          type: 'BRIDGE',
          protocol: 'bridge-aggregator',
        });

        return transaction;
      } catch (error) {
        context.logger.error('Bridge intent failed', { error });
        throw new Error(`Bridge failed: ${(error as Error).message}`);
      }
    },
  },

  Subscription: {
    transactionStatusChanged: {
      subscribe: (_parent: any, args: { transactionId: string }, context: GraphQLContext) => {
        return context.pubSub.asyncIterator([`TRANSACTION_STATUS_${args.transactionId}`]);
      },
      resolve: (payload: TransactionRecord) => payload,
    },

    transactionConfirmed: {
      subscribe: (_parent: any, args: { userId: string }, context: GraphQLContext) => {
        return context.pubSub.asyncIterator([`TRANSACTION_CONFIRMED_${args.userId}`]);
      },
      resolve: (payload: TransactionRecord) => payload,
    },
  },

  Transaction: {
    user: (parent: TransactionRecord, _args: any, context: GraphQLContext) => {
      return context.dataloaders.userLoader.load(parent.userId);
    },
    wallet: (parent: TransactionRecord, _args: any, context: GraphQLContext) => {
      return context.dataloaders.walletLoader.load(parent.walletId);
    },
  },
};
