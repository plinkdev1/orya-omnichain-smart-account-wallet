export interface OneInchQuoteParams {
  src: string;
  dst: string;
  amount: string;
  from?: string;
  slippage?: number;
  protocols?: string;
  fee?: number;
  gasPrice?: string;
  complexityLevel?: number;
  parts?: number;
  mainRouteParts?: number;
  gasLimit?: number;
  includeTokensInfo?: boolean;
  includeProtocols?: boolean;
  includeGas?: boolean;
  connectorTokens?: string;
}

export interface OneInchQuoteResponse {
  toAmount: string;
  fromToken: TokenInfo;
  toToken: TokenInfo;
  protocols: Protocol[][][];
  estimatedGas: number;
}

export interface OneInchSwapParams extends OneInchQuoteParams {
  from: string;
  disableEstimate?: boolean;
  allowPartialFill?: boolean;
  referrer?: string;
  receiver?: string;
}

export interface OneInchSwapResponse {
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gas: number;
    gasPrice: string;
  };
  toAmount: string;
  fromToken: TokenInfo;
  toToken: TokenInfo;
  protocols: Protocol[][][];
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
}

export interface Protocol {
  name: string;
  part: number;
  fromTokenAddress: string;
  toTokenAddress: string;
}

export interface OneInchTokensResponse {
  tokens: Record<string, TokenInfo>;
}

export interface OneInchProtocolsResponse {
  protocols: string[];
}

export interface OneInchLiquiditySourcesResponse {
  sources: Array<{ name: string; proportion: string }>;
}

export interface OneInchApproveCallDataParams {
  tokenAddress: string;
  amount?: string;
}

export interface OneInchApproveCallDataResponse {
  data: string;
  gasPrice: string;
  to: string;
  value: string;
}

export interface OneInchApproveSpenderResponse {
  address: string;
}

export interface OneInchError {
  statusCode: number;
  error: string;
  description: string;
  requestId?: string;
  meta?: any[];
}

export interface OneInchAdapterConfig {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  referrerAddress?: string;
  fee?: number;
  enableGasEstimation?: boolean;
}

export interface OneInchSwapRequest {
  chainId: number;
  fromToken: string;
  toToken: string;
  amount: string;
  userAddress: string;
  slippage: number;
  protocols?: string[];
  fee?: number;
  referrer?: string;
  receiver?: string;
}

export interface OneInchQuoteRequest {
  chainId: number;
  fromToken: string;
  toToken: string;
  amount: string;
  protocols?: string[];
}

export const ONEINCH_SUPPORTED_CHAINS = {
  1: 'ethereum',
  56: 'bsc',
  137: 'polygon',
  10: 'optimism',
  42161: 'arbitrum',
  100: 'gnosis',
  43114: 'avalanche',
  250: 'fantom',
  8217: 'klaytn',
  1313161554: 'aurora',
  324: 'zkSync',
  8453: 'base',
} as const;

export type OneInchChainId = keyof typeof ONEINCH_SUPPORTED_CHAINS;
