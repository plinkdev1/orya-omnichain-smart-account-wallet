const createNetwork = (id: string, name: string, testnet = false) => ({
  id,
  name,
  rpcUrl: `https://rpc.${id}.mock`,
  explorerUrl: `https://explorer.${id}.mock`,
  nativeCurrency: {
    name: 'Mock SOL',
    symbol: 'mSOL',
    decimals: 9
  },
  testnet
});

export const solanaMainnet = createNetwork('solana:1', 'Solana Mainnet');
export const solanaDevnet = createNetwork('solana:devnet', 'Solana Devnet', true);
export const solanaTestnet = createNetwork('solana:testnet', 'Solana Testnet', true);
