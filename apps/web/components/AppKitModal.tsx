'use client';

import React, { useState, useEffect } from 'react';
import { useReOwnApprovals, ApprovalModal as ReOwnApprovalModal } from '@orya/wallet-core/connectivity';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface AppKitModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AppKitModal: React.FC<AppKitModalProps> = ({
  isOpen: controlledOpen,
  onOpenChange,
}) => {
  const {
    pendingSessions,
    pendingRequests,
    isLoading,
    approveSession,
    rejectSession,
    approveRequest,
    rejectRequest,
  } = useReOwnApprovals();

  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sessions' | 'requests'>('sessions');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    if (pendingSessions.length > 0 || pendingRequests.length > 0) {
      setOpen(true);
    }
  }, [pendingSessions.length, pendingRequests.length, setOpen]);

  const currentItem = activeTab === 'sessions'
    ? pendingSessions[selectedIndex]
    : pendingRequests[selectedIndex];

  const totalItems = activeTab === 'sessions' ? pendingSessions.length : pendingRequests.length;

  const handleApprove = () => {
    if (!currentItem) return;
    
    if (activeTab === 'sessions' && 'topic' in currentItem) {
      approveSession(currentItem.id);
    } else if (activeTab === 'requests' && 'method' in currentItem) {
      approveRequest(currentItem.id, 'approved');
    }
    
    if (selectedIndex < totalItems - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else {
      setOpen(false);
      setSelectedIndex(0);
    }
  };

  const handleReject = () => {
    if (!currentItem) return;
    
    if (activeTab === 'sessions' && 'topic' in currentItem) {
      rejectSession(currentItem.id);
    } else if (activeTab === 'requests' && 'method' in currentItem) {
      rejectRequest(currentItem.id, 'User rejected');
    }
    
    if (selectedIndex < totalItems - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else {
      setOpen(false);
      setSelectedIndex(0);
    }
  };

  const getSessionDisplay = () => {
    if (!currentItem || !('topic' in currentItem)) return null;
    const session = currentItem;
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Connection Request</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {session.peerName || 'Unknown'} wants to connect to your wallet
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Chain:</span>
            <span className="ml-2 text-slate-600 dark:text-slate-400">{session.chainId}</span>
          </div>
          <div className="text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Accounts:</span>
            <span className="ml-2 text-slate-600 dark:text-slate-400">{session.accounts.length} account(s)</span>
          </div>
        </div>
      </div>
    );
  };

  const getRequestDisplay = () => {
    if (!currentItem || !('method' in currentItem)) return null;
    const request = currentItem;
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Signing Request</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {request.peerName || 'Unknown'} is requesting a signature
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Method:</span>
            <span className="ml-2 font-mono text-sm text-slate-600 dark:text-slate-400">{request.method}</span>
          </div>
          <div className="text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Chain:</span>
            <span className="ml-2 text-slate-600 dark:text-slate-400">{request.chainId}</span>
          </div>
        </div>
      </div>
    );
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Wallet Action Required
          </DialogTitle>
          <DialogDescription>
            You have {totalItems} pending {activeTab === 'sessions' ? 'session' : 'signing'} request(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {totalItems > 1 && (
            <div className="flex gap-2 border-b">
              <button
                onClick={() => {
                  setActiveTab('sessions');
                  setSelectedIndex(0);
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'sessions'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                Sessions ({pendingSessions.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('requests');
                  setSelectedIndex(0);
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'requests'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                Requests ({pendingRequests.length})
              </button>
            </div>
          )}

          <div className="min-h-[200px]">
            {currentItem && (
              <>
                {activeTab === 'sessions' ? getSessionDisplay() : getRequestDisplay()}
              </>
            )}
          </div>

          {totalItems > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>{selectedIndex + 1} of {totalItems}</span>
              <div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-4">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${((selectedIndex + 1) / totalItems) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={isLoading}
              className="flex-1"
            >
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Processing...' : 'Approve'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppKitModal;
