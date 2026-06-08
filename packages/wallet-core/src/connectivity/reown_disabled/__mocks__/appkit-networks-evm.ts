const createNetwork = (id: string, name: string, testnet = false) => ({
  id,
  name,
  rpcUrl: `https://rpc.${id}.mock`,
  explorerUrl: `https://explorer.${id}.mock`,
  nativeCurrency: {
    name: 'Mock Token',
    symbol: 'MOCK',
    decimals: 18
  },
  testnet
});

export const mainnet = createNetwork('eip155:1', 'Ethereum Mainnet');
export const sepolia = createNetwork('eip155:11155111', 'Ethereum Sepolia', true);
export const polygonMainnet = createNetwork('eip155:137', 'Polygon Mainnet');
export const polygonAmoy = createNetwork('eip155:80002', 'Polygon Amoy', true);
export const arbitrumMainnet = createNetwork('eip155:42161', 'Arbitrum Mainnet');
export const arbitrumSepolia = createNetwork('eip155:421614', 'Arbitrum Sepolia', true);
export const optimismMainnet = createNetwork('eip155:10', 'Optimism Mainnet');
export const optimismSepolia = createNetwork('eip155:11155420', 'Optimism Sepolia', true);
