import {
  OrÿaSUIProvider,
  RateLimitExceededError,
  SUIRpcError,
  createSUIProvider,
  OrÿaSUIProviderConfig,
} from './rpc-provider';

const config: OrÿaSUIProviderConfig = {
  rpcUrl: 'https://fullnode.mainnet.sui.io',
  cacheEnabled: true,
  rateLimitPerSecond: 10,
};

const provider = createSUIProvider(config);

async function testCompilation() {
  try {
    const balance = await provider.getBalance('0x123');
    console.log('Balance:', balance);

    const coins = await provider.getCoins('0x123');
    console.log('Coins:', coins);

    const tx = await provider.getTransactionBlock('abc123');
    console.log('TX:', tx);

    const obj = await provider.getObject('obj123');
    console.log('Object:', obj);

    const events = await provider.queryEvents({} as any);
    console.log('Events:', events);

    provider.setRateLimitPerSecond(20);
    provider.enableCache();
    provider.disableCache();
    await provider.clearCache();
    await provider.clearCacheKey('test');
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      console.error('Rate limit exceeded');
    } else if (error instanceof SUIRpcError) {
      console.error('RPC error:', error.code);
    } else {
      console.error('Unknown error');
    }
  }
}

export { testCompilation };
