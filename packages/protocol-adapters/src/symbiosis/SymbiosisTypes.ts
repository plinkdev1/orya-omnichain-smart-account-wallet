export interface SymbiosisSwapRequest {
  tokenAmountIn: {
    address: string;
    chainId: number;
    decimals: number;
    symbol: string;
    amount: string;
  };
  tokenOut: {
    address: string;
    chainId: number;
    decimals: number;
    symbol: string;
  };
  from: string;
  to: string;
  slippage: number;
  deadline?: number;
  affiliateFee?: {
    address: string;
    bps: number;
  };
}

export interface SymbiosisSwapResponse {
  kind: 'crosschain-swap' | 'wrap' | 'onchain-swap';
  tokenAmountOut: {
    address: string;
    chainId: number;
    decimals: number;
    symbol: string;
    amount: string;
  };
  tokenAmountOutMin: {
    address: string;
    chainId: number;
    decimals: number;
    symbol: string;
    amount: string;
  };
  priceImpact: string;
  approveTo: string;
  route: Route[];
  tx: TransactionData;
  inTradeType: 'exact-in' | 'exact-out';
  outTradeType: 'exact-in' | 'exact-out';
  amountInUsd: AmountUsd;
  fees: Fee[];
  rewards: Reward[];
}

export interface Route {
  provider: string;
  tokens: TokenInfo[];
}

export interface TransactionData {
  chainId: number;
  to: string;
  data: string;
  value: string;
  from?: string;
  gas?: string;
  gasPrice?: string;
}

export interface AmountUsd {
  in: string;
  out: string;
  impact: string;
}

export interface Fee {
  provider: string;
  description: string;
  value: {
    address: string;
    chainId: number;
    decimals: number;
    symbol: string;
    amount: string;
  };
}

export interface Reward {
  type: string;
  description: string;
  value: {
    address: string;
    chainId: number;
    decimals: number;
    symbol: string;
    amount: string;
  };
}

export interface SymbiosisToken {
  address: string;
  chainId: number;
  decimals: number;
  symbol: string;
  name: string;
  icons: {
    small: string;
    large: string;
  };
  chainFromId?: number;
}

export interface SymbiosisTokensResponse {
  tokens: SymbiosisToken[];
}

export interface SymbiosisChain {
  id: number;
  name: string;
  icons: {
    small: string;
    large: string;
  };
  explorer: string;
  swapable: boolean;
  evm: boolean;
}

export interface SymbiosisChainsResponse {
  chains: SymbiosisChain[];
}

export interface SymbiosisLimitsRequest {
  tokenIn: {
    address: string;
    chainId: number;
  };
  tokenOut: {
    address: string;
    chainId: number;
  };
}

export interface SymbiosisLimitsResponse {
  minAmount: string;
  maxAmount: string;
}

export interface SymbiosisError {
  code: string;
  message: string;
  details?: any;
}

export interface SymbiosisAdapterConfig {
  apiUrl?: string;
  timeout?: number;
  affiliateFee?: {
    address: string;
    bps: number;
  };
  defaultSlippage?: number;
  enableGasEstimation?: boolean;
}

export interface SymbiosisTransactionRequest {
  transactionHash: string;
  chainId: number;
}

export interface SymbiosisTransactionStatus {
  status: 'pending' | 'success' | 'failed' | 'reverted';
  fromChainId: number;
  toChainId: number;
  fromTxHash: string;
  toTxHash?: string;
  state:
    | 'not_found'
    | 'pending'
    | 'waiting_for_bridge'
    | 'bridging'
    | 'waiting_for_swap'
    | 'swapping'
    | 'success'
    | 'stuck'
    | 'reverted';
  createdAt: number;
  updatedAt: number;
}

export interface TokenInfo {
  address: string;
  chainId: number;
  decimals: number;
  symbol: string;
  name?: string;
  logoURI?: string;
}
