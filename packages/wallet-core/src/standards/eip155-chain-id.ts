/**
 * EIP-155: Simple replay attack protection
 * https://eips.ethereum.org/EIPS/eip-155
 *
 * Specifies chain ID to be used in transaction signing and validation
 * Prevents transactions from being replayed on different chains
 */

export interface EIP155ChainConfig {
  chainId: number;
  name: string;
  networkId?: number;
  symbol?: string;
  rpcUrl?: string;
}

export const MAINNET_CHAIN_IDS = {
  ETHEREUM: 1,
  ETHEREUM_CLASSIC: 61,
  POLYGON: 137,
  OPTIMISM: 10,
  ARBITRUM: 42161,
  BASE: 8453,
  ZKSYNC: 324,
  LINEA: 59144,
  SCROLL: 534352,
  AVALANCHE: 43114,
  FANTOM: 250,
  GNOSIS: 100,
  HARMONY: 1666600000,
  AURORA: 1313161554,
  CELO: 42220,
} as const;

export const TESTNET_CHAIN_IDS = {
  SEPOLIA: 11155111,
  GOERLI: 5,
  MUMBAI: 80001,
  OPTIMISM_GOERLI: 420,
  ARBITRUM_GOERLI: 421613,
  BASE_GOERLI: 84531,
  ZKSYNC_TESTNET: 280,
  LINEA_TESTNET: 59140,
  SCROLL_TESTNET: 534351,
  FUJI: 43113,
  FANTOM_TESTNET: 4002,
  GNOSIS_TESTNET: 10200,
} as const;

export type EthereumChainId = typeof MAINNET_CHAIN_IDS[keyof typeof MAINNET_CHAIN_IDS] |
  typeof TESTNET_CHAIN_IDS[keyof typeof TESTNET_CHAIN_IDS];

export class EIP155ChainValidator {
  private static readonly CHAIN_IDS = new Set<number>([
    ...Object.values(MAINNET_CHAIN_IDS),
    ...Object.values(TESTNET_CHAIN_IDS),
  ]);

  static validateChainId(chainId: number | string): boolean {
    const id = typeof chainId === 'string' ? this.parseChainId(chainId) : chainId;
    return id !== null && id >= 0;
  }

  static parseChainId(chainIdHex: string): number | null {
    if (!chainIdHex.startsWith('0x')) {
      return null;
    }

    try {
      return parseInt(chainIdHex, 16);
    } catch {
      return null;
    }
  }

  static toHex(chainId: number): string {
    return `0x${chainId.toString(16)}`;
  }

  static fromHex(chainIdHex: string): number {
    if (!chainIdHex.startsWith('0x')) {
      throw new Error(`Invalid chain ID format: ${chainIdHex}`);
    }
    return parseInt(chainIdHex, 16);
  }

  static isMainnet(chainId: number): boolean {
    return Object.values(MAINNET_CHAIN_IDS).includes(chainId as any);
  }

  static isTestnet(chainId: number): boolean {
    return Object.values(TESTNET_CHAIN_IDS).includes(chainId as any);
  }

  static getChainName(chainId: number): string | null {
    for (const [name, id] of Object.entries(MAINNET_CHAIN_IDS)) {
      if (id === chainId) return name;
    }
    for (const [name, id] of Object.entries(TESTNET_CHAIN_IDS)) {
      if (id === chainId) return name;
    }
    return null;
  }
}

export interface EIP155Transaction {
  nonce: string | number;
  gasPrice: string;
  gasLimit: string;
  to: string | null;
  value: string;
  data: string;
  chainId: number;
  v?: string | number;
  r?: string;
  s?: string;
}

export interface EIP155SignedTransaction extends EIP155Transaction {
  v: number;
  r: string;
  s: string;
}

export class EIP155TransactionValidator {
  static validateTransaction(tx: unknown): tx is EIP155Transaction {
    if (typeof tx !== 'object' || tx === null) {
      return false;
    }

    const transaction = tx as any;
    return (
      'nonce' in transaction &&
      'gasPrice' in transaction &&
      'gasLimit' in transaction &&
      'to' in transaction &&
      'value' in transaction &&
      'data' in transaction &&
      'chainId' in transaction &&
      typeof transaction.chainId === 'number'
    );
  }

  static validateSignedTransaction(tx: unknown): tx is EIP155SignedTransaction {
    if (!this.validateTransaction(tx)) {
      return false;
    }

    const signed = tx as any;
    return typeof signed.v === 'number' && typeof signed.r === 'string' && typeof signed.s === 'string';
  }

  static validateAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  static validateHash(hash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  }
}

export interface EIP155SignatureData {
  v: number;
  r: string;
  s: string;
  chainId: number;
  recoveryId: number;
}

export class EIP155SignatureUtil {
  static computeRecoveryId(v: number, chainId: number): number {
    const expectedV = 27 + ((chainId * 2 + 36) % 2);
    if (v !== expectedV && v !== expectedV + 1) {
      throw new Error(`Invalid v value ${v} for chainId ${chainId}`);
    }
    return v - expectedV;
  }

  static computeV(recoveryId: number, chainId: number): number {
    return 27 + recoveryId + chainId * 2 + 36;
  }

  static isValidSignature(signature: EIP155SignatureData): boolean {
    const { v, r, s, chainId } = signature;

    if (!this.isValidVValue(v, chainId)) {
      return false;
    }

    if (!this.isValidRValue(r)) {
      return false;
    }

    if (!this.isValidSValue(s)) {
      return false;
    }

    return true;
  }

  private static isValidVValue(v: number, chainId: number): boolean {
    const expectedBase = 27 + (chainId * 2 + 36);
    return v === expectedBase || v === expectedBase + 1;
  }

  private static isValidRValue(r: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(r) && r !== '0x0000000000000000000000000000000000000000000000000000000000000000';
  }

  private static isValidSValue(s: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(s) && s !== '0x0000000000000000000000000000000000000000000000000000000000000000';
  }
}
