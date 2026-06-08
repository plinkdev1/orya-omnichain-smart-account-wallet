import {
  StandardConnectFeature,
  StandardEventsFeature,
  StandardEventsOnMethod,
  Wallet,
  WalletAccount,
} from '@mysten/wallet-standard';

export interface SUIWalletFeatures {
  'sui:signTransactionBlock': {
    version: '1.0.0';
  };
  'sui:signAndExecuteTransactionBlock': {
    version: '1.0.0';
  };
  'sui:signMessage': {
    version: '1.0.0';
  };
  'sui:signPersonalMessage': {
    version: '1.0.0';
  };
  'sui:getAccounts': {
    version: '1.0.0';
  };
  'sui:getChain': {
    version: '1.0.0';
  };
}

export interface OryaSUIWalletAccount extends WalletAccount {
  publicKey: Uint8Array;
  address: string;
}

export interface SignTransactionBlockInput {
  transactionBlock: any;
  chain?: string;
}

export interface SignTransactionBlockOutput {
  transactionBlock: Uint8Array;
  signature: Uint8Array;
}

export interface SignAndExecuteTransactionBlockInput {
  transactionBlock: any;
  chain?: string;
  options?: {
    gasPrice?: string;
    gasBudget?: string;
  };
}

export interface SignAndExecuteTransactionBlockOutput {
  transactionBlock: Uint8Array;
  signature: Uint8Array;
  digest: string;
}

export interface SignMessageInput {
  message: Uint8Array;
}

export interface SignMessageOutput {
  messageBytes: Uint8Array;
  signature: Uint8Array;
}

export interface SignPersonalMessageInput {
  message: string | Uint8Array;
}

export interface SignPersonalMessageOutput {
  bytes: Uint8Array;
  signature: Uint8Array;
}

export interface GetAccountsOutput {
  accounts: OryaSUIWalletAccount[];
}

export interface GetChainOutput {
  chain: string;
}

export enum SUIChain {
  MAINNET = 'sui:mainnet',
  TESTNET = 'sui:testnet',
  DEVNET = 'sui:devnet',
}

export interface SUIWalletConfig {
  name: string;
  version: string;
  icon: string;
  chains: SUIChain[];
}
