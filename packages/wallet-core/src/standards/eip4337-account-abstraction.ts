/**
 * EIP-4337: Account Abstraction Using Alt Mempool
 * https://eips.ethereum.org/EIPS/eip-4337
 *
 * Specifies a protocol for account abstraction without requiring consensus-layer protocol changes
 * Enables smart contracts to act as user accounts
 */

export interface UserOperation {
  sender: string;
  nonce: string | number;
  initCode: string;
  callData: string;
  callGasLimit: string | number;
  verificationGasLimit: string | number;
  preVerificationGas: string | number;
  maxFeePerGas: string | number;
  maxPriorityFeePerGas: string | number;
  paymasterAndData: string;
  signature: string;
}

export interface UserOperationWithMetadata extends UserOperation {
  userOpHash: string;
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
  transactionIndex: number;
  logIndex: number;
  gasPrice: string;
  gasUsed: string;
  success: boolean;
  revertReason?: string;
  timestamp: number;
}

export interface GasEstimate {
  preVerificationGas: string;
  verificationGasLimit: string;
  callGasLimit: string;
}

export interface UserOperationReceipt {
  userOpHash: string;
  entryPoint: string;
  sender: string;
  nonce: string;
  paymaster?: string;
  actualGasCost: string;
  actualGasUsed: string;
  success: boolean;
  reason?: string;
  logs: Array<{ topics: string[]; data: string; address: string }>;
  receipt: {
    transactionHash: string;
    blockNumber: number;
    blockHash: string;
  };
}

export interface EntryPointConfig {
  address: string;
  version: string;
  chainId: number;
  supportedSignatureAggregators?: string[];
}

export interface PaymasterConfig {
  address: string;
  name: string;
  mode: 'sponsorship' | 'token';
  supportedTokens?: string[];
  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
}

export interface SignatureAggregator {
  address: string;
  validateUserOps(
    userOps: UserOperation[],
    aggregatedSignature: string
  ): Promise<boolean>;
}

export interface SmartAccountConfig {
  address: string;
  chainId: number;
  entryPointAddress: string;
  factoryAddress: string;
  initCode: string;
  saltNonce: string;
  isInitialized: boolean;
  owner: string;
}

export interface ExecutionData {
  target: string;
  value: string | number;
  callData: string;
  operation?: 'call' | 'delegatecall';
}

export interface ValidatorConfig {
  type: 'eip191' | 'eip712' | 'custom';
  address?: string;
}

export interface BundlerConfig {
  rpcUrl: string;
  chainId: number;
  entryPointAddress: string;
}

export class EIP4337Constants {
  static readonly ENTRY_POINT_ADDRESSES: Record<number, string> = {
    1: '0x0576a174D229E3cDBb63AC86e94b157DDF17e9EC',
    5: '0x0576a174D229E3cDBb63AC86e94b157DDF17e9EC',
    11155111: '0x0BA5ED0c6DE15D1B8BA02B2B92073E57D1d94A0D',
    137: '0x0576a174D229E3cDBb63AC86e94b157DDF17e9EC',
    80001: '0x0576a174D229E3cDBb63AC86e94b157DDF17e9EC',
    42161: '0x0576a174D229E3cDBb63AC86e94b157DDF17e9EC',
    421613: '0x0576a174D229E3cDBb63AC86e94b157DDF17e9EC',
    10: '0x0576a174D229E3cDBb63AC86e94b157DDF17e9EC',
    8453: '0x0576a174D229E3cDBb63AC86e94b157DDF17e9EC',
  };

  static readonly ENTRYPOINT_VERSION = '0.6.0';
  static readonly BUNDLER_CALL_GAS_LIMIT = 100000;
  static readonly DEPOSIT_EXPIRATION = 2592000;
}

export const EIP4337_ERROR_CODES = {
  INVALID_SENDER: 'invalid_sender',
  INVALID_NONCE: 'invalid_nonce',
  INSUFFICIENT_BALANCE: 'insufficient_balance',
  INVALID_SIGNATURE: 'invalid_signature',
  INVALID_ENTRY_POINT: 'invalid_entry_point',
  OUT_OF_GAS: 'out_of_gas',
  REVERT_REASON: 'revert_reason',
} as const;

export class UserOperationValidator {
  static validateUserOperation(userOp: unknown): userOp is UserOperation {
    if (typeof userOp !== 'object' || userOp === null) {
      return false;
    }

    const uop = userOp as Record<string, unknown>;

    return (
      typeof uop.sender === 'string' &&
      this.isValidAddress(uop.sender) &&
      ('nonce' in uop) &&
      typeof uop.initCode === 'string' &&
      typeof uop.callData === 'string' &&
      ('callGasLimit' in uop) &&
      ('verificationGasLimit' in uop) &&
      ('preVerificationGas' in uop) &&
      ('maxFeePerGas' in uop) &&
      ('maxPriorityFeePerGas' in uop) &&
      typeof uop.paymasterAndData === 'string' &&
      typeof uop.signature === 'string'
    );
  }

  static validateGasEstimate(estimate: unknown): estimate is GasEstimate {
    if (typeof estimate !== 'object' || estimate === null) {
      return false;
    }

    const est = estimate as Record<string, unknown>;
    return (
      typeof est.preVerificationGas === 'string' &&
      typeof est.verificationGasLimit === 'string' &&
      typeof est.callGasLimit === 'string'
    );
  }

  static validateSmartAccountConfig(config: unknown): config is SmartAccountConfig {
    if (typeof config !== 'object' || config === null) {
      return false;
    }

    const cfg = config as Record<string, unknown>;
    return (
      typeof cfg.address === 'string' &&
      this.isValidAddress(cfg.address) &&
      typeof cfg.chainId === 'number' &&
      typeof cfg.entryPointAddress === 'string' &&
      this.isValidAddress(cfg.entryPointAddress) &&
      typeof cfg.factoryAddress === 'string' &&
      typeof cfg.initCode === 'string' &&
      typeof cfg.isInitialized === 'boolean'
    );
  }

  private static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

export class UserOperationBuilder {
  private userOp: Partial<UserOperation> = {
    callGasLimit: '0',
    verificationGasLimit: '0',
    preVerificationGas: '0',
    maxFeePerGas: '0',
    maxPriorityFeePerGas: '0',
    paymasterAndData: '0x',
  };

  setSender(sender: string): this {
    this.userOp.sender = sender;
    return this;
  }

  setNonce(nonce: string | number): this {
    this.userOp.nonce = nonce;
    return this;
  }

  setInitCode(initCode: string): this {
    this.userOp.initCode = initCode;
    return this;
  }

  setCallData(callData: string): this {
    this.userOp.callData = callData;
    return this;
  }

  setCallGasLimit(limit: string | number): this {
    this.userOp.callGasLimit = limit;
    return this;
  }

  setVerificationGasLimit(limit: string | number): this {
    this.userOp.verificationGasLimit = limit;
    return this;
  }

  setPreVerificationGas(gas: string | number): this {
    this.userOp.preVerificationGas = gas;
    return this;
  }

  setMaxFeePerGas(fee: string | number): this {
    this.userOp.maxFeePerGas = fee;
    return this;
  }

  setMaxPriorityFeePerGas(fee: string | number): this {
    this.userOp.maxPriorityFeePerGas = fee;
    return this;
  }

  setPaymasterAndData(data: string): this {
    this.userOp.paymasterAndData = data;
    return this;
  }

  setSignature(signature: string): this {
    this.userOp.signature = signature;
    return this;
  }

  build(): UserOperation {
    const required: (keyof UserOperation)[] = [
      'sender',
      'nonce',
      'initCode',
      'callData',
      'callGasLimit',
      'verificationGasLimit',
      'preVerificationGas',
      'maxFeePerGas',
      'maxPriorityFeePerGas',
      'paymasterAndData',
      'signature',
    ];

    for (const key of required) {
      if (!(key in this.userOp) || this.userOp[key] === undefined) {
        throw new Error(`Missing required field: ${key}`);
      }
    }

    return this.userOp as UserOperation;
  }
}

export class UserOperationUtils {
  static getUserOpHash(userOp: UserOperation, entryPoint: string, chainId: number): string {
    return `0x${entryPoint.slice(2)}${chainId.toString(16).padStart(64, '0')}`;
  }

  static calculateTotalGasLimit(estimate: GasEstimate): string {
    const preVer = BigInt(estimate.preVerificationGas);
    const verif = BigInt(estimate.verificationGasLimit);
    const call = BigInt(estimate.callGasLimit);
    return (preVer + verif + call).toString();
  }

  static calculateTotalGasCost(userOp: UserOperation): string {
    const totalGas = this.calculateTotalGasLimit({
      preVerificationGas: userOp.preVerificationGas.toString(),
      verificationGasLimit: userOp.verificationGasLimit.toString(),
      callGasLimit: userOp.callGasLimit.toString(),
    });

    const maxFeePerGas = BigInt(userOp.maxFeePerGas.toString());
    const cost = BigInt(totalGas) * maxFeePerGas;

    return cost.toString();
  }

  static hasPaymaster(userOp: UserOperation): boolean {
    return userOp.paymasterAndData !== '0x' && userOp.paymasterAndData.length > 2;
  }

  static getPaymasterAddress(userOp: UserOperation): string | null {
    if (!this.hasPaymaster(userOp)) {
      return null;
    }
    return '0x' + userOp.paymasterAndData.slice(2, 42);
  }

  static isSponsoredByPaymaster(userOp: UserOperation): boolean {
    return this.hasPaymaster(userOp);
  }

  static validateUserOpForChain(userOp: UserOperation, chainId: number): boolean {
    const entryPointAddress = EIP4337Constants.ENTRY_POINT_ADDRESSES[chainId];
    return Boolean(entryPointAddress);
  }
}

export class SmartAccountFactory {
  static createInitCode(
    factoryAddress: string,
    initMethod: string,
    owner: string,
    saltNonce: string = '0'
  ): string {
    return factoryAddress + initMethod.slice(2) + owner.slice(2) + saltNonce;
  }

  static extractFactoryAddress(initCode: string): string | null {
    if (initCode.length < 42) {
      return null;
    }
    return '0x' + initCode.slice(2, 42);
  }

  static isInitCodeEmpty(initCode: string): boolean {
    return initCode === '0x' || initCode.length === 0;
  }
}
