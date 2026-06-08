import { MultiSigService, MultiSigWallet, TransactionProposal } from '../services/multisig';

class MockFetch {
  private responses: Map<string, any> = new Map();

  mockResponse(path: string, response: any, status: number = 200) {
    this.responses.set(path, { response, status });
  }

  async call(url: string, options: any): Promise<Response> {
    const path = url.split('?')[0];
    const mock = this.responses.get(path);

    if (!mock) {
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not found' }),
      } as Response;
    }

    return {
      ok: mock.status === 200,
      status: mock.status,
      statusText: mock.status === 200 ? 'OK' : 'Error',
      json: async () => mock.response,
    } as Response;
  }

  clear() {
    this.responses.clear();
  }
}

global.fetch = jest.fn();

describe('MultiSigService', () => {
  let service: MultiSigService;
  let mockFetch: MockFetch;

  beforeEach(() => {
    service = new MultiSigService();
    mockFetch = new MockFetch();

    (global.fetch as jest.Mock).mockImplementation((url: string, options: any) =>
      mockFetch.call(url, options)
    );
  });

  afterEach(() => {
    mockFetch.clear();
    jest.clearAllMocks();
  });

  describe('createMultiSigWallet', () => {
    it('should create 2-of-3 multi-sig wallet', async () => {
      const walletResponse: Omit<MultiSigWallet, 'createdAt'> & { createdAt: string } = {
        address: '0x_multisig_wallet_address',
        threshold: 2,
        totalSigners: 3,
        signers: ['signer1', 'signer2', 'signer3'],
        keyShares: ['share1', 'share2', 'share3'],
        createdBy: 'user1',
        createdAt: new Date().toISOString(),
      };

      mockFetch.mockResponse('/api/multisig/wallets', walletResponse);

      const wallet = await service.createMultiSigWallet(
        {
          threshold: 2,
          totalSigners: 3,
          signers: ['signer1', 'signer2', 'signer3'],
        },
        'user1'
      );

      expect(wallet.threshold).toBe(2);
      expect(wallet.totalSigners).toBe(3);
      expect(wallet.signers).toHaveLength(3);
      expect(wallet.address).toBe('0x_multisig_wallet_address');
    });

    it('should throw error if threshold exceeds totalSigners', async () => {
      await expect(
        service.createMultiSigWallet(
          {
            threshold: 4,
            totalSigners: 3,
            signers: ['signer1', 'signer2', 'signer3'],
          },
          'user1'
        )
      ).rejects.toThrow('Threshold cannot exceed total signers');
    });

    it('should throw error if threshold is 0', async () => {
      await expect(
        service.createMultiSigWallet(
          {
            threshold: 0,
            totalSigners: 3,
            signers: ['signer1', 'signer2', 'signer3'],
          },
          'user1'
        )
      ).rejects.toThrow('Threshold must be at least 1');
    });

    it('should throw error if signer count mismatch', async () => {
      await expect(
        service.createMultiSigWallet(
          {
            threshold: 2,
            totalSigners: 3,
            signers: ['signer1', 'signer2'],
          },
          'user1'
        )
      ).rejects.toThrow('Number of signers must match totalSigners');
    });
  });

  describe('proposeTransaction', () => {
    it('should propose transaction successfully', async () => {
      const walletResponse: Omit<MultiSigWallet, 'createdAt'> & { createdAt: string } = {
        address: '0x_multisig_wallet_address',
        threshold: 2,
        totalSigners: 3,
        signers: ['signer1', 'signer2', 'signer3'],
        keyShares: ['share1', 'share2', 'share3'],
        createdBy: 'user1',
        createdAt: new Date().toISOString(),
      };

      mockFetch.mockResponse('/api/multisig/wallets', walletResponse);

      const wallet = await service.createMultiSigWallet(
        {
          threshold: 2,
          totalSigners: 3,
          signers: ['signer1', 'signer2', 'signer3'],
        },
        'user1'
      );

      const proposalResponse: Omit<TransactionProposal, 'createdAt' | 'executedAt' | 'rejectedAt'> & {
        createdAt: string;
        executedAt?: string;
        rejectedAt?: string;
      } = {
        id: 'proposal-123',
        multiSigAddress: wallet.address,
        transaction: {
          to: '0x_recipient_address',
          amount: '1000000',
        },
        proposer: 'signer1',
        approvals: ['signer1'],
        threshold: 2,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      mockFetch.mockResponse('/api/multisig/proposals', proposalResponse);

      const proposal = await service.proposeTransaction(
        wallet.address,
        { to: '0x_recipient_address', amount: '1000000' },
        'signer1'
      );

      expect(proposal.id).toBe('proposal-123');
      expect(proposal.status).toBe('pending');
      expect(proposal.approvals).toContain('signer1');
      expect(proposal.threshold).toBe(2);
    });

    it('should throw error if wallet not found', async () => {
      await expect(
        service.proposeTransaction('0x_unknown_address', { to: '0x_recipient' }, 'signer1')
      ).rejects.toThrow('Multi-sig wallet not found');
    });
  });

  describe('approveTransaction', () => {
    it('should approve transaction with threshold check', async () => {
      const walletResponse: Omit<MultiSigWallet, 'createdAt'> & { createdAt: string } = {
        address: '0x_multisig_wallet_address',
        threshold: 2,
        totalSigners: 3,
        signers: ['signer1', 'signer2', 'signer3'],
        keyShares: ['share1', 'share2', 'share3'],
        createdBy: 'user1',
        createdAt: new Date().toISOString(),
      };

      mockFetch.mockResponse('/api/multisig/wallets', walletResponse);

      const wallet = await service.createMultiSigWallet(
        {
          threshold: 2,
          totalSigners: 3,
          signers: ['signer1', 'signer2', 'signer3'],
        },
        'user1'
      );

      const proposalResponse: Omit<TransactionProposal, 'createdAt' | 'executedAt' | 'rejectedAt'> & {
        createdAt: string;
        executedAt?: string;
        rejectedAt?: string;
      } = {
        id: 'proposal-123',
        multiSigAddress: wallet.address,
        transaction: {
          to: '0x_recipient_address',
          amount: '1000000',
        },
        proposer: 'signer1',
        approvals: ['signer1'],
        threshold: 2,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      mockFetch.mockResponse('/api/multisig/proposals', proposalResponse);

      const proposal = await service.proposeTransaction(
        wallet.address,
        { to: '0x_recipient_address', amount: '1000000' },
        'signer1'
      );

      const approvalResponse: {
        executed: boolean;
        txHash?: string;
        proposal: Omit<TransactionProposal, 'createdAt' | 'executedAt' | 'rejectedAt'> & {
          createdAt: string;
          executedAt?: string;
          rejectedAt?: string;
        };
      } = {
        executed: false,
        proposal: {
          ...proposalResponse,
          approvals: ['signer1', 'signer2'],
        },
      };

      mockFetch.mockResponse(`/api/multisig/proposals/${proposal.id}/approve`, approvalResponse);

      const result = await service.approveTransaction(proposal.id, 'signer2');

      expect(result.executed).toBe(false);
    });

    it('should execute transaction when threshold is met', async () => {
      const walletResponse: Omit<MultiSigWallet, 'createdAt'> & { createdAt: string } = {
        address: '0x_multisig_wallet_address',
        threshold: 2,
        totalSigners: 3,
        signers: ['signer1', 'signer2', 'signer3'],
        keyShares: ['share1', 'share2', 'share3'],
        createdBy: 'user1',
        createdAt: new Date().toISOString(),
      };

      mockFetch.mockResponse('/api/multisig/wallets', walletResponse);

      const wallet = await service.createMultiSigWallet(
        {
          threshold: 2,
          totalSigners: 3,
          signers: ['signer1', 'signer2', 'signer3'],
        },
        'user1'
      );

      const proposalResponse: Omit<TransactionProposal, 'createdAt' | 'executedAt' | 'rejectedAt'> & {
        createdAt: string;
        executedAt?: string;
        rejectedAt?: string;
      } = {
        id: 'proposal-123',
        multiSigAddress: wallet.address,
        transaction: {
          to: '0x_recipient_address',
          amount: '1000000',
        },
        proposer: 'signer1',
        approvals: ['signer1'],
        threshold: 2,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      mockFetch.mockResponse('/api/multisig/proposals', proposalResponse);

      const proposal = await service.proposeTransaction(
        wallet.address,
        { to: '0x_recipient_address', amount: '1000000' },
        'signer1'
      );

      const approvalResponse: {
        executed: boolean;
        txHash?: string;
        proposal: Omit<TransactionProposal, 'createdAt' | 'executedAt' | 'rejectedAt'> & {
          createdAt: string;
          executedAt?: string;
          rejectedAt?: string;
        };
      } = {
        executed: true,
        txHash: '0x_transaction_hash',
        proposal: {
          ...proposalResponse,
          approvals: ['signer1', 'signer2'],
          status: 'executed',
          txHash: '0x_transaction_hash',
        },
      };

      mockFetch.mockResponse(`/api/multisig/proposals/${proposal.id}/approve`, approvalResponse);

      const result = await service.approveTransaction(proposal.id, 'signer2');

      expect(result.executed).toBe(true);
      expect(result.txHash).toBe('0x_transaction_hash');
    });
  });

  describe('getPendingProposals', () => {
    it('should fetch pending proposals for user', async () => {
      const proposalsResponse: Array<
        Omit<TransactionProposal, 'createdAt' | 'executedAt' | 'rejectedAt'> & {
          createdAt: string;
          executedAt?: string;
          rejectedAt?: string;
        }
      > = [
        {
          id: 'proposal-1',
          multiSigAddress: '0x_wallet_1',
          transaction: { to: '0x_recipient', amount: '1000' },
          proposer: 'signer1',
          approvals: ['signer1'],
          threshold: 2,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'proposal-2',
          multiSigAddress: '0x_wallet_1',
          transaction: { to: '0x_recipient', amount: '2000' },
          proposer: 'signer2',
          approvals: ['signer2'],
          threshold: 2,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ];

      mockFetch.mockResponse('/api/multisig/proposals/pending', proposalsResponse);

      const proposals = await service.getPendingProposals('user1');

      expect(proposals).toHaveLength(2);
      expect(proposals[0].id).toBe('proposal-1');
      expect(proposals[1].id).toBe('proposal-2');
    });
  });

  describe('rejectTransaction', () => {
    it('should reject a pending proposal', async () => {
      const walletResponse: Omit<MultiSigWallet, 'createdAt'> & { createdAt: string } = {
        address: '0x_multisig_wallet_address',
        threshold: 2,
        totalSigners: 3,
        signers: ['signer1', 'signer2', 'signer3'],
        keyShares: ['share1', 'share2', 'share3'],
        createdBy: 'user1',
        createdAt: new Date().toISOString(),
      };

      mockFetch.mockResponse('/api/multisig/wallets', walletResponse);

      const wallet = await service.createMultiSigWallet(
        {
          threshold: 2,
          totalSigners: 3,
          signers: ['signer1', 'signer2', 'signer3'],
        },
        'user1'
      );

      const proposalResponse: Omit<TransactionProposal, 'createdAt' | 'executedAt' | 'rejectedAt'> & {
        createdAt: string;
        executedAt?: string;
        rejectedAt?: string;
      } = {
        id: 'proposal-123',
        multiSigAddress: wallet.address,
        transaction: { to: '0x_recipient', amount: '1000' },
        proposer: 'signer1',
        approvals: ['signer1'],
        threshold: 2,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      mockFetch.mockResponse('/api/multisig/proposals', proposalResponse);

      const proposal = await service.proposeTransaction(
        wallet.address,
        { to: '0x_recipient', amount: '1000' },
        'signer1'
      );

      const rejectResponse: Omit<TransactionProposal, 'createdAt' | 'executedAt' | 'rejectedAt'> & {
        createdAt: string;
        executedAt?: string;
        rejectedAt?: string;
      } = {
        ...proposalResponse,
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
      };

      mockFetch.mockResponse(`/api/multisig/proposals/${proposal.id}/reject`, rejectResponse);

      await service.rejectTransaction(proposal.id, 'signer2');

      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('getWalletProposals', () => {
    it('should fetch all proposals for a wallet', async () => {
      const proposalsResponse: Array<
        Omit<TransactionProposal, 'createdAt' | 'executedAt' | 'rejectedAt'> & {
          createdAt: string;
          executedAt?: string;
          rejectedAt?: string;
        }
      > = [
        {
          id: 'proposal-1',
          multiSigAddress: '0x_wallet_1',
          transaction: { to: '0x_recipient', amount: '1000' },
          proposer: 'signer1',
          approvals: ['signer1'],
          threshold: 2,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'proposal-2',
          multiSigAddress: '0x_wallet_1',
          transaction: { to: '0x_recipient', amount: '2000' },
          proposer: 'signer2',
          approvals: ['signer1', 'signer2'],
          threshold: 2,
          status: 'executed',
          createdAt: new Date().toISOString(),
          txHash: '0x_tx_hash',
        },
      ];

      mockFetch.mockResponse('/api/multisig/wallets/0x_wallet_1/proposals', proposalsResponse);

      const proposals = await service.getWalletProposals('0x_wallet_1');

      expect(proposals).toHaveLength(2);
      expect(proposals[0].status).toBe('pending');
      expect(proposals[1].status).toBe('executed');
    });
  });

  describe('getUserWallets', () => {
    it('should fetch all wallets for a user', async () => {
      const walletsResponse: Array<Omit<MultiSigWallet, 'createdAt'> & { createdAt: string }> = [
        {
          address: '0x_wallet_1',
          threshold: 2,
          totalSigners: 3,
          signers: ['signer1', 'signer2', 'signer3'],
          keyShares: ['share1', 'share2', 'share3'],
          createdBy: 'user1',
          createdAt: new Date().toISOString(),
        },
        {
          address: '0x_wallet_2',
          threshold: 3,
          totalSigners: 5,
          signers: ['signer1', 'signer2', 'signer3', 'signer4', 'signer5'],
          keyShares: ['share1', 'share2', 'share3', 'share4', 'share5'],
          createdBy: 'user1',
          createdAt: new Date().toISOString(),
        },
      ];

      mockFetch.mockResponse('/api/multisig/users/user1/wallets', walletsResponse);

      const wallets = await service.getUserWallets('user1');

      expect(wallets).toHaveLength(2);
      expect(wallets[0].threshold).toBe(2);
      expect(wallets[1].threshold).toBe(3);
    });
  });
});
