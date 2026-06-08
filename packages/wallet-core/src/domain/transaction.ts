/**
 * Transaction Entity & Validation Logic
 * Pure business logic, no external dependencies
 */

export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';
export type TransactionType = 'send' | 'receive' | 'swap' | 'stake' | 'unstake' | 'bridge';

export interface TransactionConfig {
  id: string;
  hash?: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  fee?: string;
  chainId: string;
  type: TransactionType;
  status: TransactionStatus;
  timestamp: Date;
  confirmations: number;
  data?: Record<string, any>;
}

export class Transaction {
  constructor(private config: TransactionConfig) {}

  getId(): string {
    return this.config.id;
  }

  getHash(): string | undefined {
    return this.config.hash;
  }

  getFromAddress(): string {
    return this.config.fromAddress;
  }

  getToAddress(): string {
    return this.config.toAddress;
  }

  getAmount(): string {
    return this.config.amount;
  }

  getFee(): string | undefined {
    return this.config.fee;
  }

  getStatus(): TransactionStatus {
    return this.config.status;
  }

  getType(): TransactionType {
    return this.config.type;
  }

  isConfirmed(): boolean {
    return this.config.status === 'confirmed' && this.config.confirmations > 0;
  }

  isPending(): boolean {
    return this.config.status === 'pending';
  }

  isFailed(): boolean {
    return this.config.status === 'failed';
  }

  getConfig(): TransactionConfig {
    return { ...this.config };
  }

  updateStatus(status: TransactionStatus, confirmations?: number): void {
    this.config.status = status;
    if (confirmations !== undefined) {
      this.config.confirmations = confirmations;
    }
  }

  setHash(hash: string): void {
    this.config.hash = hash;
  }
}

/**
 * Transaction creation & validation
 */
export function createTransaction(
  config: Omit<TransactionConfig, 'id' | 'status' | 'confirmations' | 'timestamp'>
): Transaction {
  const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const fullConfig: TransactionConfig = {
    ...config,
    id,
    status: 'pending',
    confirmations: 0,
    timestamp: new Date(),
  };
  return new Transaction(fullConfig);
}

/**
 * Transaction validation
 */
export function validateTransaction(tx: TransactionConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!tx.fromAddress) errors.push('fromAddress is required');
  if (!tx.toAddress) errors.push('toAddress is required');
  if (!tx.amount || parseFloat(tx.amount) <= 0) errors.push('amount must be greater than 0');
  if (!tx.chainId) errors.push('chainId is required');
  if (tx.fromAddress === tx.toAddress) errors.push('fromAddress and toAddress cannot be the same');

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function restoreTransaction(config: TransactionConfig): Transaction {
  return new Transaction({
    ...config,
    timestamp: new Date(config.timestamp),
  });
}