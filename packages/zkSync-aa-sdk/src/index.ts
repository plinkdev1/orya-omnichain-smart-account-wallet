/**
 * zkSync AA SDK
 * 
 * Client library for interacting with Account Abstraction wallets on zkSync Era.
 * Features:
 * - AA account interaction
 * - Multi-signature flow (off-chain signature aggregation)
 * - Paymaster request formatting
 * - Hardware wallet support (WalletConnect)
 * - Transaction signing and submission
 */

export interface AAWalletConfig {
  accountAddress: string;
  signers: string[];
  threshold: number; // M-of-N threshold
  rpcUrl: string;
  paymasterAddress?: string;
}

export interface SignatureRequest {
  hash: string;
  payload: string;
}

export interface ExecutionRequest {
  target: string;
  value: bigint;
  data: string;
  operation: 0 | 1; // 0: CALL, 1: DELEGATECALL
}

export class AAWallet {
  private config: AAWalletConfig;

  constructor(config: AAWalletConfig) {
    this.config = config;
  }

  /**
   * Format a transaction for AA execution
   * Returns payload ready for signature collection
   */
  async formatAATransaction(execution: ExecutionRequest): Promise<SignatureRequest> {
    // TODO: Implement in Verify 1
    throw new Error("Not implemented - part of Verify 1");
  }

  /**
   * Submit a multi-sig operation
   * Requires M signatures from N signers
   */
  async submitMultiSig(
    execution: ExecutionRequest,
    signatures: string[]
  ): Promise<string> {
    // TODO: Implement in Verify 1
    throw new Error("Not implemented - part of Verify 1");
  }

  /**
   * Get role assignments for access control
   */
  async getRoleAssignments(): Promise<Record<string, string[]>> {
    // TODO: Implement in Verify 3
    throw new Error("Not implemented - part of Verify 3");
  }

  /**
   * Format paymaster request for stablecoin gas payment
   */
  async formatPaymasterRequest(
    execution: ExecutionRequest,
    tokenAddress: string
  ): Promise<any> {
    // TODO: Implement in Verify 2
    throw new Error("Not implemented - part of Verify 2");
  }
}

export default AAWallet;