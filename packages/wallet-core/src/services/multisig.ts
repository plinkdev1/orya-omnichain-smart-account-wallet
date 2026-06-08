/**
 * Multi-Sig Service - Enterprise Wallet Management
 * Implements M-of-N threshold signatures using IKA
 * Supports DAO governance and corporate treasury management
 */

import { IKAMPCService } from './ika-mpc';

export interface MultiSigConfig {
  threshold: number;
  totalSigners: number;
  signers: string[];
}

export interface MultiSigWallet {
  address: string;
  threshold: number;
  totalSigners: number;
  signers: string[];
  keyShares: string[];
  createdAt: Date;
  createdBy: string;
}

export interface TransactionProposal {
  id: string;
  multiSigAddress: string;
  transaction: {
    to?: string;
    amount?: string;
    data?: string;
    [key: string]: any;
  };
  proposer: string;
  approvals: string[];
  threshold: number;
  status: 'pending' | 'executed' | 'rejected';
  createdAt: Date;
  executedAt?: Date;
  rejectedAt?: Date;
  txHash?: string;
}

/**
 * Multi-Sig Service
 * Manages multi-signature wallet creation and transaction approval
 */
export class MultiSigService {
  private wallets: Map<string, MultiSigWallet> = new Map();
  private proposals: Map<string, TransactionProposal> = new Map();
  private ikaMpcService: IKAMPCService | null = null;

  constructor(ikaMpcService?: IKAMPCService) {
    this.ikaMpcService = ikaMpcService || null;
  }

  /**
   * Create a new multi-sig wallet
   * Generates key shares for each signer using IKA
   */
  async createMultiSigWallet(
    config: MultiSigConfig,
    userId: string
  ): Promise<MultiSigWallet> {
    if (config.threshold > config.totalSigners) {
      throw new Error('Threshold cannot exceed total signers');
    }

    if (config.threshold < 1) {
      throw new Error('Threshold must be at least 1');
    }

    if (config.signers.length !== config.totalSigners) {
      throw new Error('Number of signers must match totalSigners');
    }

    try {
      const response = await fetch('/api/multisig/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threshold: config.threshold,
          totalSigners: config.totalSigners,
          signers: config.signers,
          createdBy: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create multi-sig wallet: ${response.statusText}`);
      }

      const result = await response.json() as Omit<MultiSigWallet, 'createdAt'> & { createdAt: string };
      const wallet: MultiSigWallet = {
        ...result,
        createdAt: new Date(result.createdAt),
      };

      this.wallets.set(wallet.address, wallet);
      return wallet;
    } catch (error) {
      throw new Error(
        `Multi-sig wallet creation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Propose a transaction for the multi-sig wallet
   */
  async proposeTransaction(
    multiSigAddress: string,
    transaction: TransactionProposal['transaction'],
    proposer: string
  ): Promise<TransactionProposal> {
    const wallet = this.wallets.get(multiSigAddress);
    if (!wallet) {
      throw new Error(`Multi-sig wallet not found: ${multiSigAddress}`);
    }

    try {
      const response = await fetch('/api/multisig/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          multiSigAddress,
          transaction,
          proposer,
          threshold: wallet.threshold,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to propose transaction: ${response.statusText}`);
      }

      const result = await response.json() as Omit<TransactionProposal, 'createdAt'> & { createdAt: string };
      const proposal: TransactionProposal = {
        ...result,
        createdAt: new Date(result.createdAt),
        executedAt: result.executedAt ? new Date(result.executedAt) : undefined,
        rejectedAt: result.rejectedAt ? new Date(result.rejectedAt) : undefined,
      };

      this.proposals.set(proposal.id, proposal);
      return proposal;
    } catch (error) {
      throw new Error(
        `Transaction proposal failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Approve a transaction proposal
   * Returns whether transaction was executed (if threshold met)
   */
  async approveTransaction(
    proposalId: string,
    signerId: string
  ): Promise<{ executed: boolean; txHash?: string }> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    if (proposal.status !== 'pending') {
      throw new Error(`Proposal is no longer pending: ${proposal.status}`);
    }

    try {
      const response = await fetch(`/api/multisig/proposals/${proposalId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signerId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to approve transaction: ${response.statusText}`);
      }

      const result = await response.json() as {
        executed: boolean;
        txHash?: string;
        proposal: Omit<TransactionProposal, 'createdAt' | 'executedAt' | 'rejectedAt'> & {
          createdAt: string;
          executedAt?: string;
          rejectedAt?: string;
        };
      };

      const updatedProposal: TransactionProposal = {
        ...result.proposal,
        createdAt: new Date(result.proposal.createdAt),
        executedAt: result.proposal.executedAt ? new Date(result.proposal.executedAt) : undefined,
        rejectedAt: result.proposal.rejectedAt ? new Date(result.proposal.rejectedAt) : undefined,
      };

      this.proposals.set(proposalId, updatedProposal);

      return {
        executed: result.executed,
        txHash: result.txHash,
      };
    } catch (error) {
      throw new Error(
        `Approval failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Reject a transaction proposal
   */
  async rejectTransaction(
    proposalId: string,
    rejecterId: string
  ): Promise<void> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    if (proposal.status !== 'pending') {
      throw new Error(`Proposal is no longer pending: ${proposal.status}`);
    }

    try {
      const response = await fetch(`/api/multisig/proposals/${proposalId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejecterId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reject transaction: ${response.statusText}`);
      }

      const result = await response.json() as Omit<TransactionProposal, 'createdAt' | 'executedAt' | 'rejectedAt'> & {
        createdAt: string;
        executedAt?: string;
        rejectedAt?: string;
      };

      const updatedProposal: TransactionProposal = {
        ...result,
        createdAt: new Date(result.createdAt),
        executedAt: result.executedAt ? new Date(result.executedAt) : undefined,
        rejectedAt: result.rejectedAt ? new Date(result.rejectedAt) : undefined,
      };

      this.proposals.set(proposalId, updatedProposal);
    } catch (error) {
      throw new Error(
        `Rejection failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all pending proposals for a user
   */
  async getPendingProposals(userId: string): Promise<TransactionProposal[]> {
    try {
      const response = await fetch(`/api/multisig/proposals/pending?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pending proposals: ${response.statusText}`);
      }

      const results = await response.json() as Array<Omit<TransactionProposal, 'createdAt' | 'executedAt' | 'rejectedAt'> & {
        createdAt: string;
        executedAt?: string;
        rejectedAt?: string;
      }>;

      return results.map(result => {
        const proposal: TransactionProposal = {
          ...result,
          createdAt: new Date(result.createdAt),
          executedAt: result.executedAt ? new Date(result.executedAt) : undefined,
          rejectedAt: result.rejectedAt ? new Date(result.rejectedAt) : undefined,
        };
        this.proposals.set(proposal.id, proposal);
        return proposal;
      });
    } catch (error) {
      throw new Error(
        `Failed to fetch pending proposals: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all proposals for a multi-sig wallet
   */
  async getWalletProposals(multiSigAddress: string): Promise<TransactionProposal[]> {
    try {
      const response = await fetch(`/api/multisig/wallets/${multiSigAddress}/proposals`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch wallet proposals: ${response.statusText}`);
      }

      const results = await response.json() as Array<Omit<TransactionProposal, 'createdAt' | 'executedAt' | 'rejectedAt'> & {
        createdAt: string;
        executedAt?: string;
        rejectedAt?: string;
      }>;

      return results.map(result => {
        const proposal: TransactionProposal = {
          ...result,
          createdAt: new Date(result.createdAt),
          executedAt: result.executedAt ? new Date(result.executedAt) : undefined,
          rejectedAt: result.rejectedAt ? new Date(result.rejectedAt) : undefined,
        };
        this.proposals.set(proposal.id, proposal);
        return proposal;
      });
    } catch (error) {
      throw new Error(
        `Failed to fetch wallet proposals: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get a specific proposal by ID
   */
  async getProposal(proposalId: string): Promise<TransactionProposal | null> {
    const cached = this.proposals.get(proposalId);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`/api/multisig/proposals/${proposalId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch proposal: ${response.statusText}`);
      }

      const result = await response.json() as Omit<TransactionProposal, 'createdAt' | 'executedAt' | 'rejectedAt'> & {
        createdAt: string;
        executedAt?: string;
        rejectedAt?: string;
      };

      const proposal: TransactionProposal = {
        ...result,
        createdAt: new Date(result.createdAt),
        executedAt: result.executedAt ? new Date(result.executedAt) : undefined,
        rejectedAt: result.rejectedAt ? new Date(result.rejectedAt) : undefined,
      };

      this.proposals.set(proposal.id, proposal);
      return proposal;
    } catch (error) {
      throw new Error(
        `Failed to fetch proposal: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get multi-sig wallet details
   */
  async getWallet(address: string): Promise<MultiSigWallet | null> {
    const cached = this.wallets.get(address);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`/api/multisig/wallets/${address}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch wallet: ${response.statusText}`);
      }

      const result = await response.json() as Omit<MultiSigWallet, 'createdAt'> & { createdAt: string };
      const wallet: MultiSigWallet = {
        ...result,
        createdAt: new Date(result.createdAt),
      };

      this.wallets.set(wallet.address, wallet);
      return wallet;
    } catch (error) {
      throw new Error(
        `Failed to fetch wallet: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all wallets for a user
   */
  async getUserWallets(userId: string): Promise<MultiSigWallet[]> {
    try {
      const response = await fetch(`/api/multisig/users/${userId}/wallets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user wallets: ${response.statusText}`);
      }

      const results = await response.json() as Array<Omit<MultiSigWallet, 'createdAt'> & { createdAt: string }>;

      return results.map(result => {
        const wallet: MultiSigWallet = {
          ...result,
          createdAt: new Date(result.createdAt),
        };
        this.wallets.set(wallet.address, wallet);
        return wallet;
      });
    } catch (error) {
      throw new Error(
        `Failed to fetch user wallets: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

export const multiSigService = new MultiSigService();
