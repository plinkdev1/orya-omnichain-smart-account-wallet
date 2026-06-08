'use client';

import { useState, useEffect } from 'react';
import { multiSigService, MultiSigWallet, TransactionProposal } from '@orya/wallet-core';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface MultiSigWalletManagerProps {
  userId: string;
}

export function MultiSigWalletManager({ userId }: MultiSigWalletManagerProps) {
  const [proposals, setProposals] = useState<TransactionProposal[]>([]);
  const [wallets, setWallets] = useState<MultiSigWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingProposalId, setApprovingProposalId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [pendingProposals, userWallets] = await Promise.all([
          multiSigService.getPendingProposals(userId),
          multiSigService.getUserWallets(userId),
        ]);

        setProposals(pendingProposals);
        setWallets(userWallets);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleApprove = async (proposalId: string) => {
    try {
      setApprovingProposalId(proposalId);
      const result = await multiSigService.approveTransaction(proposalId, userId);

      const updatedProposal = await multiSigService.getProposal(proposalId);
      if (updatedProposal) {
        setProposals(prev =>
          prev.map(p => (p.id === proposalId ? updatedProposal : p)).filter(p => p.status === 'pending')
        );
      }

      if (result.executed) {
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve transaction');
    } finally {
      setApprovingProposalId(null);
    }
  };

  const handleReject = async (proposalId: string) => {
    try {
      setApprovingProposalId(proposalId);
      await multiSigService.rejectTransaction(proposalId, userId);

      setProposals(prev => prev.filter(p => p.id !== proposalId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject transaction');
    } finally {
      setApprovingProposalId(null);
    }
  };

  const getStatusIcon = (proposal: TransactionProposal) => {
    if (proposal.status === 'executed') {
      return <CheckCircle2 className="text-green-500" size={20} />;
    }
    if (proposal.status === 'rejected') {
      return <XCircle className="text-red-500" size={20} />;
    }
    return <Clock className="text-yellow-500" size={20} />;
  };

  const getApprovalPercentage = (proposal: TransactionProposal) => {
    return Math.round((proposal.approvals.length / proposal.threshold) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-32 bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-semibold mb-4">Your Multi-Sig Wallets</h2>
        {wallets.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">No multi-sig wallets yet</Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wallets.map(wallet => (
              <Card key={wallet.address} className="p-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-mono text-sm truncate">{wallet.address}</p>
                  <div className="flex justify-between text-sm mt-4">
                    <span>
                      Threshold: {wallet.threshold}-of-{wallet.totalSigners}
                    </span>
                    <span className="text-gray-500">Signers: {wallet.signers.length}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Multi-Sig Proposals</h2>
        {proposals.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <Clock className="mx-auto mb-2 text-gray-400" size={32} />
            <p>No pending proposals</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {proposals.map(proposal => {
              const isApproved = proposal.approvals.includes(userId);
              const approvalPercentage = getApprovalPercentage(proposal);

              return (
                <Card key={proposal.id} className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(proposal)}
                          <h3 className="font-semibold">Transaction Proposal</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          Proposed by: <span className="font-mono">{proposal.proposer}</span>
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          proposal.status === 'executed'
                            ? 'bg-green-100 text-green-800'
                            : proposal.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {proposal.status}
                      </span>
                    </div>

                    {proposal.transaction.to && (
                      <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                        <div>
                          <span className="text-gray-600">To:</span>{' '}
                          <span className="font-mono text-xs truncate">{proposal.transaction.to}</span>
                        </div>
                        {proposal.transaction.amount && (
                          <div>
                            <span className="text-gray-600">Amount:</span>{' '}
                            <span className="font-mono">{proposal.transaction.amount}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Approvals</span>
                        <span className="font-mono">
                          {proposal.approvals.length} / {proposal.threshold}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${approvalPercentage}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {proposal.approvals.map((signer, i) => (
                          <span
                            key={i}
                            className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                          >
                            ✓ {signer.substring(0, 8)}...
                          </span>
                        ))}
                      </div>
                    </div>

                    {proposal.status === 'pending' && (
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          onClick={() => handleApprove(proposal.id)}
                          disabled={isApproved || approvingProposalId === proposal.id}
                          className={
                            isApproved
                              ? 'bg-green-100 text-green-800 hover:bg-green-100'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }
                        >
                          {approvingProposalId === proposal.id
                            ? 'Approving...'
                            : isApproved
                              ? 'Approved'
                              : 'Approve'}
                        </Button>
                        <Button
                          onClick={() => handleReject(proposal.id)}
                          disabled={approvingProposalId === proposal.id}
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          {approvingProposalId === proposal.id ? 'Processing...' : 'Reject'}
                        </Button>
                      </div>
                    )}

                    {proposal.txHash && (
                      <div className="text-xs text-green-600 pt-2">
                        Executed: <span className="font-mono">{proposal.txHash.substring(0, 16)}...</span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
