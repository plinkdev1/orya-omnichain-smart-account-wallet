import { z } from "zod";

export interface Config {
  rpcUrl: string;
  chainId: number;
  apiKey?: string;
}

export enum TransactionStatus {
  Pending = "pending",
  Confirmed = "confirmed",
  Failed = "failed",
  Unknown = "unknown",
}

export interface TransactionRequest {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface TransactionResponse {
  hash: string;
  status: TransactionStatus;
  blockNumber?: number;
  timestamp?: number;
}

export interface Balance {
  address: string;
  balance: string;
  decimals: number;
  symbol: string;
}

export class AdapterError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = "AdapterError";
  }
}

export interface IChainAdapter {
  getBalance(address: string): Promise<Balance>;
  sendTransaction(tx: TransactionRequest): Promise<TransactionResponse>;
  getTransactionStatus(hash: string): Promise<TransactionStatus>;
  getChainId(): Promise<number>;
}

export const ConfigSchema = z.object({
  rpcUrl: z.string().url(),
  chainId: z.number().positive(),
  apiKey: z.string().optional(),
});

export type ValidatedConfig = z.infer<typeof ConfigSchema>;

export function validateConfig(config: unknown): ValidatedConfig {
  return ConfigSchema.parse(config);
}
