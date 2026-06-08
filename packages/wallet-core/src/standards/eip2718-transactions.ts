/**
 * EIP-2718: Typed Transaction Envelope
 * https://eips.ethereum.org/EIPS/eip-2718
 *
 * Specifies a single unified structure for all transaction types
 * Enables future transaction types to be defined
 */

export type TransactionType = 0 | 1 | 2 | 3;

export interface BaseLegacyTransaction {
  nonce: string | number;
  gasPrice: string;
  gasLimit: string;
  to: string | null;
  value: string;
  data: string;
  v?: string | number;
  r?: string;
  s?: string;
}

export interface LegacyTransaction extends BaseLegacyTransaction {
  type: 0;
}

export interface AccessListItem {
  address: string;
  storageKeys: string[];
}

export interface AccessListTransaction extends BaseLegacyTransaction {
  type: 1;
  chainId: number;
  accessList: AccessListItem[];
}

export interface FeeMarketTransaction extends BaseLegacyTransaction {
  type: 2;
  chainId: number;
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
  accessList?: AccessListItem[];
}

export interface BlobTransaction extends BaseLegacyTransaction {
  type: 3;
  chainId: number;
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
  maxFeePerBlobGas: string;
  blobVersionedHashes: string[];
  accessList?: AccessListItem[];
}

export type EIP2718Transaction = LegacyTransaction | AccessListTransaction | FeeMarketTransaction | BlobTransaction;

export interface EIP2718Envelope {
  type: TransactionType;
  payload: unknown;
}

export interface SignedLegacyTransaction extends LegacyTransaction {
  v: number;
  r: string;
  s: string;
}

export interface SignedAccessListTransaction extends AccessListTransaction {
  v: number;
  r: string;
  s: string;
}

export interface SignedFeeMarketTransaction extends FeeMarketTransaction {
  v: number;
  r: string;
  s: string;
}

export interface SignedBlobTransaction extends BlobTransaction {
  v: number;
  r: string;
  s: string;
}

export type SignedTransaction = SignedLegacyTransaction | SignedAccessListTransaction | SignedFeeMarketTransaction | SignedBlobTransaction;

export class EIP2718TransactionFactory {
  static createLegacy(tx: BaseLegacyTransaction): LegacyTransaction {
    return {
      ...tx,
      type: 0,
    };
  }

  static createAccessList(
    tx: Omit<AccessListTransaction, 'type'>,
    chainId: number
  ): AccessListTransaction {
    return {
      ...tx,
      type: 1,
      chainId,
    };
  }

  static createFeeMarket(
    tx: Omit<FeeMarketTransaction, 'type'>,
    chainId: number
  ): FeeMarketTransaction {
    return {
      ...tx,
      type: 2,
      chainId,
    };
  }

  static createBlob(tx: Omit<BlobTransaction, 'type'>, chainId: number): BlobTransaction {
    return {
      ...tx,
      type: 3,
      chainId,
    };
  }
}

export class EIP2718TransactionValidator {
  static validateLegacy(tx: unknown): tx is LegacyTransaction {
    if (typeof tx !== 'object' || tx === null) {
      return false;
    }

    const transaction = tx as Record<string, unknown>;
    return (
      ('nonce' in transaction) &&
      ('gasPrice' in transaction) &&
      ('gasLimit' in transaction) &&
      ('to' in transaction) &&
      ('value' in transaction) &&
      ('data' in transaction)
    );
  }

  static validateAccessList(tx: unknown): tx is AccessListTransaction {
    if (!this.validateLegacy(tx)) {
      return false;
    }

    const transaction = tx as any;
    return (
      transaction.type === 1 &&
      'chainId' in transaction &&
      'accessList' in transaction &&
      Array.isArray(transaction.accessList)
    );
  }

  static validateFeeMarket(tx: unknown): tx is FeeMarketTransaction {
    if (!this.validateLegacy(tx)) {
      return false;
    }

    const transaction = tx as any;
    return (
      transaction.type === 2 &&
      'chainId' in transaction &&
      'maxPriorityFeePerGas' in transaction &&
      'maxFeePerGas' in transaction
    );
  }

  static validateBlob(tx: unknown): tx is BlobTransaction {
    if (!this.validateLegacy(tx)) {
      return false;
    }

    const transaction = tx as any;
    return (
      transaction.type === 3 &&
      'chainId' in transaction &&
      'maxPriorityFeePerGas' in transaction &&
      'maxFeePerGas' in transaction &&
      'maxFeePerBlobGas' in transaction &&
      'blobVersionedHashes' in transaction &&
      Array.isArray(transaction.blobVersionedHashes)
    );
  }

  static validateAccessListItem(item: unknown): item is AccessListItem {
    if (typeof item !== 'object' || item === null) {
      return false;
    }

    const ali = item as Record<string, unknown>;
    return (
      typeof ali.address === 'string' &&
      /^0x[a-fA-F0-9]{40}$/.test(ali.address) &&
      'storageKeys' in ali &&
      Array.isArray(ali.storageKeys) &&
      ali.storageKeys.every((k) => typeof k === 'string' && /^0x[a-fA-F0-9]{64}$/.test(k))
    );
  }

  static validateAccessListArray(list: unknown): list is AccessListItem[] {
    if (!Array.isArray(list)) {
      return false;
    }
    return list.every((item) => this.validateAccessListItem(item));
  }

  static validateBlobVersionedHash(hash: string): boolean {
    return /^0x01[a-fA-F0-9]{62}$/.test(hash);
  }

  static validateBlobVersionedHashes(hashes: unknown): hashes is string[] {
    if (!Array.isArray(hashes)) {
      return false;
    }
    return hashes.every((h) => this.validateBlobVersionedHash(h));
  }
}

export class EIP2718TransactionSerializer {
  static encode(tx: EIP2718Transaction): string {
    if (tx.type === 0) {
      return this.encodeLegacy(tx as LegacyTransaction);
    }

    const typePrefix = `0x${tx.type.toString(16)}`;
    const payload = this.encodePayload(tx);
    return typePrefix + payload.slice(2);
  }

  private static encodeLegacy(tx: LegacyTransaction): string {
    return '0xlegacy_encoded_tx';
  }

  private static encodePayload(tx: EIP2718Transaction): string {
    return '0xpayload_encoded';
  }

  static decode(encoded: string): EIP2718Transaction {
    if (!encoded.match(/^0x[0-3]/)) {
      return this.decodeLegacy(encoded);
    }

    const type = parseInt(encoded.slice(2, 4), 16) as TransactionType;
    return this.decodePayload(type, encoded.slice(4));
  }

  private static decodeLegacy(encoded: string): LegacyTransaction {
    return {
      type: 0,
      nonce: 0,
      gasPrice: '0',
      gasLimit: '0',
      to: null,
      value: '0',
      data: '0x',
    };
  }

  private static decodePayload(type: TransactionType, payload: string): EIP2718Transaction {
    throw new Error(`Transaction type ${type} decoding not implemented`);
  }
}

export class EIP2718TransactionUtils {
  static isLegacy(tx: EIP2718Transaction): tx is LegacyTransaction {
    return tx.type === 0;
  }

  static isAccessList(tx: EIP2718Transaction): tx is AccessListTransaction {
    return tx.type === 1;
  }

  static isFeeMarket(tx: EIP2718Transaction): tx is FeeMarketTransaction {
    return tx.type === 2;
  }

  static isBlob(tx: EIP2718Transaction): tx is BlobTransaction {
    return tx.type === 3;
  }

  static getTransactionType(tx: EIP2718Transaction): TransactionType {
    return tx.type || 0;
  }

  static hasAccessList(tx: EIP2718Transaction): boolean {
    return this.isAccessList(tx) || this.isFeeMarket(tx) || this.isBlob(tx);
  }

  static getEffectiveGasPrice(tx: EIP2718Transaction, baseFeePerGas?: string): string {
    if (this.isFeeMarket(tx) || this.isBlob(tx)) {
      return (tx as FeeMarketTransaction | BlobTransaction).maxFeePerGas;
    }
    return (tx as LegacyTransaction | AccessListTransaction).gasPrice;
  }

  static supportsAccessList(type: TransactionType): boolean {
    return type >= 1;
  }

  static supportsDynamicFees(type: TransactionType): boolean {
    return type >= 2;
  }

  static supportsBlobs(type: TransactionType): boolean {
    return type >= 3;
  }
}
