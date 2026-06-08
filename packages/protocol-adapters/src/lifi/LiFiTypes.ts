export interface LiFiQuoteParams {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: string;
  slippage?: number;
  allowBridges?: string[];
  denyBridges?: string[];
  allowExchanges?: string[];
  denyExchanges?: string[];
  order?: 'RECOMMENDED' | 'FASTEST' | 'CHEAPEST' | 'SAFEST';
}

export interface LiFiRoute {
  id: string;
  fromChain: ChainInfo;
  toChain: ChainInfo;
  fromToken: TokenInfo;
  toToken: TokenInfo;
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  steps: RouteStep[];
  insurance: Insurance;
  tags: string[];
  gasCosts: GasCost[];
}

export interface RouteStep {
  id: string;
  type: 'swap' | 'cross' | 'lifi';
  tool: string;
  toolDetails: ToolDetails;
  action: StepAction;
  estimate: StepEstimate;
  includedSteps?: RouteStep[];
}

export interface StepAction {
  fromChain: string;
  toChain: string;
  fromToken: TokenInfo;
  toToken: TokenInfo;
  fromAmount: string;
  toAmount: string;
  slippage: number;
  fromAddress: string;
  toAddress: string;
}

export interface StepEstimate {
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  approvalAddress: string;
  executionDuration: number;
  feeCosts: FeeCost[];
  gasCosts: GasCost[];
}

export interface ToolDetails {
  key: string;
  name: string;
  logoURI: string;
}

export interface TokenInfo {
  address: string;
  chainId: string;
  symbol: string;
  decimals: number;
  name: string;
  coinKey?: string;
  logoURI?: string;
  priceUSD?: string;
}

export interface ChainInfo {
  id: string;
  key: string;
  name: string;
  chainType: 'EVM' | 'SVM' | 'UTXO';
  coin: string;
  logoURI: string;
  nativeToken: TokenInfo;
}

export interface GasCost {
  type: string;
  price: string;
  estimate: string;
  limit: string;
  amount: string;
  amountUSD: string;
  token: TokenInfo;
}

export interface FeeCost {
  name: string;
  description: string;
  percentage: string;
  token: TokenInfo;
  amount: string;
  amountUSD: string;
  included: boolean;
}

export interface Insurance {
  state: 'INSURED' | 'INSURABLE' | 'NOT_INSURABLE';
  feeAmountUsd?: string;
}

export interface LiFiStatus {
  transactionId: string;
  sending: TransactionStatus;
  receiving?: TransactionStatus;
  lifiExplorerLink?: string;
  fromChain: ChainInfo;
  toChain: ChainInfo;
  tool: string;
  status: 'PENDING' | 'DONE' | 'FAILED';
  substatus?: string;
  substatusMessage?: string;
}

export interface TransactionStatus {
  txHash: string;
  txLink: string;
  amount: string;
  token: TokenInfo;
  chainId: string;
  gasPrice?: string;
  gasUsed?: string;
  gasToken?: TokenInfo;
  timestamp: number;
}

export const LIFI_SUPPORTED_CHAINS = [
  '1',
  '10',
  '56',
  '100',
  '137',
  '250',
  '324',
  '1101',
  '8453',
  '42161',
  '43114',
  '59144',
] as const;

export type LiFiChain = typeof LIFI_SUPPORTED_CHAINS[number];

export const LIFI_API_URL = 'https://li.quest/v1';
