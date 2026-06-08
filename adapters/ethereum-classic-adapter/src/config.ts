export interface Config {
  network: string;
  rpcUrl: string;
  chainId: number;
}

export function loadConfig(): Config {
  return {
    network: process.env.NETWORK || "mainnet",
    rpcUrl: process.env.RPC_URL || "",
    chainId: parseInt(process.env.CHAIN_ID || "1"),
  };
}
