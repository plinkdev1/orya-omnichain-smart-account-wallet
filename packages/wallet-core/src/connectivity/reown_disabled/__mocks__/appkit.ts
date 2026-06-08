export class AppKit {}

export type AppKitNetwork = {
  id: string | number;
  name: string;
  rpcUrl: string;
  explorerUrl?: string;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
  testnet?: boolean;
};
