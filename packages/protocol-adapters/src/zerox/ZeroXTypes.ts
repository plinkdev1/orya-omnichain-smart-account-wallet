export interface ZeroXSwapQuoteParams {
  sellToken: string;
  buyToken: string;
  sellAmount?: string;
  buyAmount?: string;
  slippagePercentage: number;
  takerAddress?: string;
  affiliateAddress?: string;
  skipValidation?: boolean;
}

export interface ZeroXSwapQuote {
  price: string;
  guaranteedPrice: string;
  estimatedPriceImpact: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
  protocolFee: string;
  minimumProtocolFee: string;
  buyAmount: string;
  sellAmount: string;
  sources: ZeroXSource[];
  buyTokenAddress: string;
  sellTokenAddress: string;
  allowanceTarget: string;
  sellTokenToEthRate: string;
  buyTokenToEthRate: string;
}

export interface ZeroXSource {
  name: string;
  proportion: string;
}

export interface ZeroXPriceParams {
  sellToken: string;
  buyToken: string;
  sellAmount?: string;
  buyAmount?: string;
  slippagePercentage?: number;
  takerAddress?: string;
}

export interface ZeroXPriceResponse {
  price: string;
  value: string;
  gasPrice: string;
  gas: string;
  estimatedGas: string;
  protocolFee: string;
  minimumProtocolFee: string;
  buyAmount: string;
  sellAmount: string;
  sources: ZeroXSource[];
  buyTokenAddress: string;
  sellTokenAddress: string;
  sellTokenToEthRate: string;
  buyTokenToEthRate: string;
  allowanceTarget: string;
}

export const ZEROX_SUPPORTED_CHAINS = {
  ethereum: 'https://api.0x.org',
  polygon: 'https://polygon.api.0x.org',
  bsc: 'https://bsc.api.0x.org',
  optimism: 'https://optimism.api.0x.org',
  arbitrum: 'https://arbitrum.api.0x.org',
  avalanche: 'https://avalanche.api.0x.org',
  fantom: 'https://fantom.api.0x.org',
  celo: 'https://celo.api.0x.org',
  base: 'https://base.api.0x.org',
} as const;

export type ZeroXChain = keyof typeof ZEROX_SUPPORTED_CHAINS;
