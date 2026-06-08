/**
 * ReOwn Provider Stub
 * Temporary passthrough provider while ReOwn integration is disabled
 * TODO: Re-enable ReOwn provider when module compilation issues are resolved
 */

import React, { ReactNode, FC } from 'react';

export interface ReOwnContextType {
  manager: null;
  isReady: false;
  error: null;
}

export interface ReOwnProviderProps {
  children: ReactNode;
  config?: any;
  onError?: (error: Error) => void;
  onReady?: () => void;
}

export const ReOwnProvider: FC<ReOwnProviderProps> = ({ children, onReady }) => {
  React.useEffect(() => {
    onReady?.();
  }, [onReady]);

  return <>{children}</>;
};

export function useReOwn(): ReOwnContextType {
  return {
    manager: null,
    isReady: false,
    error: null,
  };
}

export function useReOwnManager() {
  throw new Error('ReOwn Manager not available - feature is disabled');
}

export interface UseReOwnApprovalsState {
  pendingSessions: any[];
  pendingRequests: any[];
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
  return {
    pendingSessions: [],
    pendingRequests: [],
    isLoading: false,
    error: null,
    approveSession: () => {},
    rejectSession: () => {},
    approveRequest: () => {},
    rejectRequest: () => {},
    refresh: () => {},
  };
}

export const ApprovalModal: React.FC<any> = () => {
  return null;
};

export default ReOwnProvider;
