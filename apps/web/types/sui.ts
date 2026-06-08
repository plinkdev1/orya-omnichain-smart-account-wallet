/**
 * SUI Wallet Provider Types
 * 
 * Re-exports and extends types from @orya/wallet-core for convenient access
 */

export type {
  OrysaSUIWallet,
  OryaSUIWalletAccount,
  SUIChain,
  SUIWalletConfig,
  SUIWalletFeatures,
  SignTransactionBlockInput,
  SignTransactionBlockOutput,
  SignAndExecuteTransactionBlockInput,
  SignAndExecuteTransactionBlockOutput,
  SignMessageInput,
  SignMessageOutput,
  SignPersonalMessageInput,
  SignPersonalMessageOutput,
  GetAccountsOutput,
  GetChainOutput,
} from '@orya/wallet-core';

export { SUIChain } from '@orya/wallet-core';

/**
 * Context type for SUIWalletProvider
 */
export interface SUIWalletContextType {
  wallet: import('@orya/wallet-core').OrysaSUIWallet | null;
  accounts: import('@orya/wallet-core').OryaSUIWalletAccount[];
  selectedAccount: import('@orya/wallet-core').OryaSUIWalletAccount | null;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  selectAccount: (account: import('@orya/wallet-core').OryaSUIWalletAccount) => void;
  signTransactionBlock: (tx: Uint8Array) => Promise<Uint8Array>;
  signAndExecuteTransactionBlock: (tx: Uint8Array) => Promise<string>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}

/**
 * State returned by useSUITransaction hook
 */
export interface SUITransactionState {
  isLoading: boolean;
  error: Error | null;
  data: string | null;
}

/**
 * Methods returned by useSUITransaction hook
 */
export interface SUITransactionMethods {
  execute: (txBlock: Uint8Array) => Promise<string>;
  reset: () => void;
}

/**
 * Combined type returned by useSUITransaction
 */
export type SUITransactionHookReturn = SUITransactionState & SUITransactionMethods;

/**
 * Transaction error types
 */
export enum SUITransactionErrorType {
  NOT_CONNECTED = 'NOT_CONNECTED',
  NO_ACCOUNT_SELECTED = 'NO_ACCOUNT_SELECTED',
  SIGNING_FAILED = 'SIGNING_FAILED',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  INVALID_TRANSACTION = 'INVALID_TRANSACTION',
}

export class SUITransactionError extends Error {
  constructor(
    public type: SUITransactionErrorType,
    message: string
  ) {
    super(message);
    this.name = 'SUITransactionError';
  }
}
