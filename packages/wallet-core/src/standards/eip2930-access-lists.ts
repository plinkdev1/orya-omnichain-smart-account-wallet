/**
 * EIP-2930: Optional access lists
 * https://eips.ethereum.org/EIPS/eip-2930
 *
 * Specifies access lists to reduce gas costs of state-accessing opcodes
 * Enables pre-declaration of smart contract storage access
 */

export interface AccessListItem {
  address: string;
  storageKeys: string[];
}

export type AccessList = AccessListItem[];

export interface AccessListTransaction {
  type: 1;
  chainId: number;
  nonce: string | number;
  gasPrice: string;
  gasLimit: string;
  to: string | null;
  value: string;
  data: string;
  accessList: AccessList;
  v?: string | number;
  r?: string;
  s?: string;
}

export interface SignedAccessListTransaction extends AccessListTransaction {
  v: number;
  r: string;
  s: string;
}

export class AccessListValidator {
  static validateItem(item: unknown): item is AccessListItem {
    if (typeof item !== 'object' || item === null) {
      return false;
    }

    const ali = item as any;

    if (typeof ali.address !== 'string') {
      return false;
    }

    if (!this.isValidAddress(ali.address)) {
      return false;
    }

    if (!Array.isArray(ali.storageKeys)) {
      return false;
    }

    return ali.storageKeys.every((key) => this.isValidStorageKey(key));
  }

  static validateList(list: unknown): list is AccessList {
    if (!Array.isArray(list)) {
      return false;
    }

    return list.every((item) => this.validateItem(item));
  }

  static validateTransaction(tx: unknown): tx is AccessListTransaction {
    if (typeof tx !== 'object' || tx === null) {
      return false;
    }

    const transaction = tx as any;

    return (
      transaction.type === 1 &&
      typeof transaction.chainId === 'number' &&
      'nonce' in transaction &&
      'gasPrice' in transaction &&
      'gasLimit' in transaction &&
      'to' in transaction &&
      'value' in transaction &&
      'data' in transaction &&
      'accessList' in transaction &&
      this.validateList(transaction.accessList)
    );
  }

  static validateSignedTransaction(tx: unknown): tx is SignedAccessListTransaction {
    if (!this.validateTransaction(tx)) {
      return false;
    }

    const signed = tx as any;
    return (
      typeof signed.v === 'number' &&
      typeof signed.r === 'string' &&
      typeof signed.s === 'string' &&
      this.isValidRValue(signed.r) &&
      this.isValidSValue(signed.s)
    );
  }

  private static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private static isValidStorageKey(key: unknown): boolean {
    return typeof key === 'string' && /^0x[a-fA-F0-9]{64}$/.test(key);
  }

  private static isValidRValue(r: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(r) && r !== '0x0000000000000000000000000000000000000000000000000000000000000000';
  }

  private static isValidSValue(s: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(s) && s !== '0x0000000000000000000000000000000000000000000000000000000000000000';
  }
}

export interface AccessListGasOptions {
  accessListGasCost: number;
  txAccessListGasCost: number;
}

export class AccessListGasCalculator {
  static readonly GAS_COST = {
    ACCOUNT_IN_ACCESS_LIST: 2400,
    ACCOUNT_NOT_IN_ACCESS_LIST: 20000,
    STORAGE_KEY_IN_ACCESS_LIST: 100,
    STORAGE_KEY_NOT_IN_ACCESS_LIST: 2100,
  } as const;

  static calculateAccessListGasCost(accessList: AccessList): number {
    let gasCost = 0;

    for (const item of accessList) {
      gasCost += this.GAS_COST.ACCOUNT_IN_ACCESS_LIST;
      gasCost += item.storageKeys.length * this.GAS_COST.STORAGE_KEY_IN_ACCESS_LIST;
    }

    return gasCost;
  }

  static calculateTransactionCost(data: string, accessList: AccessList): number {
    let intrinsicGas = 21000;

    for (let i = 0; i < data.length; i += 2) {
      const byte = data.slice(i, i + 2);
      intrinsicGas += byte === '00' ? 4 : 16;
    }

    intrinsicGas += this.calculateAccessListGasCost(accessList);

    return intrinsicGas;
  }

  static estimateGasSavings(
    accessList: AccessList,
    touchedAccounts: number,
    touchedStorageSlots: number
  ): number {
    const withoutAccessList = touchedAccounts * this.GAS_COST.ACCOUNT_NOT_IN_ACCESS_LIST +
      touchedStorageSlots * this.GAS_COST.STORAGE_KEY_NOT_IN_ACCESS_LIST;

    const withAccessList = this.calculateAccessListGasCost(accessList) +
      touchedAccounts * this.GAS_COST.ACCOUNT_IN_ACCESS_LIST +
      touchedStorageSlots * this.GAS_COST.STORAGE_KEY_IN_ACCESS_LIST;

    return Math.max(0, withoutAccessList - withAccessList);
  }
}

export class AccessListBuilder {
  private items: Map<string, Set<string>> = new Map();

  addAddress(address: string): this {
    if (!AccessListValidator['isValidAddress'](address)) {
      throw new Error(`Invalid address: ${address}`);
    }

    if (!this.items.has(address)) {
      this.items.set(address, new Set());
    }

    return this;
  }

  addStorageKey(address: string, storageKey: string): this {
    if (!AccessListValidator['isValidStorageKey'](storageKey)) {
      throw new Error(`Invalid storage key: ${storageKey}`);
    }

    this.addAddress(address);
    this.items.get(address)!.add(storageKey);

    return this;
  }

  addAccessListItem(item: AccessListItem): this {
    this.addAddress(item.address);
    const addressSet = this.items.get(item.address)!;

    for (const key of item.storageKeys) {
      addressSet.add(key);
    }

    return this;
  }

  addAccessList(list: AccessList): this {
    for (const item of list) {
      this.addAccessListItem(item);
    }
    return this;
  }

  build(): AccessList {
    return Array.from(this.items).map(([address, storageKeys]) => ({
      address,
      storageKeys: Array.from(storageKeys),
    }));
  }

  clear(): this {
    this.items.clear();
    return this;
  }

  has(address: string, storageKey?: string): boolean {
    const addressSet = this.items.get(address);
    if (!addressSet) {
      return false;
    }

    if (storageKey === undefined) {
      return true;
    }

    return addressSet.has(storageKey);
  }

  size(): { addresses: number; totalKeys: number } {
    let totalKeys = 0;
    for (const keys of this.items.values()) {
      totalKeys += keys.size;
    }
    return {
      addresses: this.items.size,
      totalKeys,
    };
  }
}

export class AccessListOptimizer {
  static removeDuplicates(list: AccessList): AccessList {
    const seen = new Map<string, Set<string>>();

    for (const item of list) {
      if (!seen.has(item.address)) {
        seen.set(item.address, new Set());
      }

      const keys = seen.get(item.address)!;
      for (const key of item.storageKeys) {
        keys.add(key);
      }
    }

    return Array.from(seen).map(([address, storageKeys]) => ({
      address,
      storageKeys: Array.from(storageKeys),
    }));
  }

  static sortByAddress(list: AccessList): AccessList {
    return [...list].sort((a, b) => a.address.localeCompare(b.address));
  }

  static sortByGasImpact(list: AccessList): AccessList {
    return [...list].sort((a, b) => {
      const aCost = a.storageKeys.length;
      const bCost = b.storageKeys.length;
      return bCost - aCost;
    });
  }

  static optimize(list: AccessList): AccessList {
    let optimized = this.removeDuplicates(list);
    optimized = this.sortByGasImpact(optimized);
    return optimized;
  }
}
