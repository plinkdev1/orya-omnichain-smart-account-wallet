import { useState, useCallback, useEffect } from 'react';
import { useReOwnManager } from './ReOwnProvider';
import { WalletSession, SigningRequest } from './sessionStore';

export interface UseReOwnApprovalsState {
  pendingSessions: WalletSession[];
  pendingRequests: SigningRequest[];
  isLoading: boolean;
  error: Error | null;
}

export interface UseReOwnApprovalsActions {
  approveSession: (sessionId: string) => void;
  rejectSession: (sessionId: string) => void;
  approveRequest: (requestId: string, signature: string) => void;
  rejectRequest: (requestId: string, reason?: string) => void;
  refresh: () => void;
}

export interface UseReOwnApprovalsReturn extends UseReOwnApprovalsState, UseReOwnApprovalsActions {}

export function useReOwnApprovals(): UseReOwnApprovalsReturn {
  const manager = useReOwnManager();
  const [state, setState] = useState<UseReOwnApprovalsState>({
    pendingSessions: [],
    pendingRequests: [],
    isLoading: false,
    error: null,
  });

  const refresh = useCallback(() => {
    try {
      const sessions = manager.getPendingApprovals();
      const requests = manager.getPendingSigningRequests();
      setState(prev => ({
        ...prev,
        pendingSessions: sessions,
        pendingRequests: requests,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to refresh approvals'),
        isLoading: false,
      }));
    }
  }, [manager]);

  useEffect(() => {
    refresh();

    const unsubscribeSessions = manager.on('session_created', refresh);
    const unsubscribeRequests = manager.on('signing_request', refresh);
    const unsubscribeApproved = manager.on('session_approved', refresh);
    const unsubscribeRejected = manager.on('session_rejected', refresh);

    return () => {
      unsubscribeSessions();
      unsubscribeRequests();
      unsubscribeApproved();
      unsubscribeRejected();
    };
  }, [manager, refresh]);

  const approveSession = useCallback((sessionId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      manager.approveSession(sessionId);
      refresh();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to approve session'),
        isLoading: false,
      }));
    }
  }, [manager, refresh]);

  const rejectSession = useCallback((sessionId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      manager.rejectSession(sessionId);
      refresh();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to reject session'),
        isLoading: false,
      }));
    }
  }, [manager, refresh]);

  const approveRequest = useCallback((requestId: string, signature: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      manager.approveSigningRequest(requestId, signature);
      refresh();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to approve request'),
        isLoading: false,
      }));
    }
  }, [manager, refresh]);

  const rejectRequest = useCallback((requestId: string, reason?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      manager.rejectSigningRequest(requestId, reason);
      refresh();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to reject request'),
        isLoading: false,
      }));
    }
  }, [manager, refresh]);

  return {
    ...state,
    approveSession,
    rejectSession,
    approveRequest,
    rejectRequest,
    refresh,
  };
}
