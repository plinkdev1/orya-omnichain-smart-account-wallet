import { useEffect, useState, useCallback } from 'react';
import { walletConnectService } from '../services/walletconnect';
import type { SessionTypes } from '@walletconnect/types';
import type { SessionProposal, SessionRequest, PairingInfo } from '../services/walletconnect';

export interface UseWalletConnectReturn {
  initializing: boolean;
  initialized: boolean;
  initializationError: string | null;
  sessions: Record<string, SessionTypes.Struct>;
  pendingProposal: SessionProposal | null;
  pendingRequest: SessionRequest | null;
  pairingUri: string | null;
  pairingTopic: string | null;
  pair: (uri: string) => Promise<void>;
  generatePairingUri: () => Promise<string>;
  cancelPairing: () => Promise<void>;
  approve: (accounts: string[], chains: string[]) => Promise<SessionTypes.Struct | null>;
  reject: (reason: string) => Promise<void>;
  disconnect: (topic: string) => Promise<void>;
  respondToRequest: (requestId: string, topic: string, response: any) => Promise<void>;
  rejectRequest: (requestId: string, topic: string, error: { code: number; message: string }) => Promise<void>;
  isConnected: (topic: string) => boolean;
  error: string | null;
  clearError: () => void;
}

export function useWalletConnect(): UseWalletConnectReturn {
  const [initializing, setInitializing] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Record<string, SessionTypes.Struct>>({});
  const [pendingProposal, setPendingProposal] = useState<SessionProposal | null>(null);
  const [pendingRequest, setPendingRequest] = useState<SessionRequest | null>(null);
  const [pairingUri, setPairingUri] = useState<string | null>(null);
  const [pairingTopic, setPairingTopic] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initWalletConnect = async () => {
      setInitializing(true);
      setInitializationError(null);
      try {
        await walletConnectService.initialize();
        if (!isMounted) return;
        setInitialized(walletConnectService.isInitialized());
        setSessions(walletConnectService.getSessions());
        setLastError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!isMounted) return;
        setInitializationError(message);
        setInitialized(false);
        setLastError(message);
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    };

    initWalletConnect();

    const handleProposal = (proposal: SessionProposal) => {
      if (!isMounted) return;
      setPendingProposal(proposal);
      setPairingUri(null);
      setPairingTopic(null);
    };

    const handleRequest = (request: SessionRequest) => {
      if (!isMounted) return;
      setPendingRequest(request);
    };

    const handleSessionChange = () => {
      if (!isMounted) return;
      setSessions(walletConnectService.getSessions());
    };

    const handlePairingCreated = (pairing: PairingInfo) => {
      if (!isMounted) return;
      setPairingUri(pairing.uri);
      setPairingTopic(pairing.topic);
    };

    const handlePairingClosed = () => {
      if (!isMounted) return;
      setPairingUri(null);
      setPairingTopic(null);
    };

    walletConnectService.on('session_proposal', handleProposal);
    walletConnectService.on('session_request', handleRequest);
    walletConnectService.on('session_delete', handleSessionChange);
    walletConnectService.on('session_created', handleSessionChange);
    walletConnectService.on('session_update', handleSessionChange);
    walletConnectService.on('pairing_created', handlePairingCreated);
    walletConnectService.on('pairing_closed', handlePairingClosed);

    return () => {
      isMounted = false;
      walletConnectService.off('session_proposal', handleProposal);
      walletConnectService.off('session_request', handleRequest);
      walletConnectService.off('session_delete', handleSessionChange);
      walletConnectService.off('session_created', handleSessionChange);
      walletConnectService.off('session_update', handleSessionChange);
      walletConnectService.off('pairing_created', handlePairingCreated);
      walletConnectService.off('pairing_closed', handlePairingClosed);
    };
  }, []);

  const pair = useCallback(async (uri: string) => {
    setLastError(null);
    setPairingUri(null);
    setPairingTopic(null);
    try {
      await walletConnectService.pairWithUri(uri);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLastError(message);
      throw new Error(`Failed to pair: ${message}`);
    }
  }, []);

  const generatePairingUri = useCallback(async () => {
    setLastError(null);
    try {
      const pairing = await walletConnectService.createPairingUri();
      setPairingUri(pairing.uri);
      setPairingTopic(pairing.topic);
      return pairing.uri;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLastError(message);
      throw new Error(`Failed to create pairing URI: ${message}`);
    }
  }, []);

  const cancelPairing = useCallback(async () => {
    setLastError(null);
    try {
      await walletConnectService.cancelPairing(pairingTopic || undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLastError(message);
      throw new Error(`Failed to cancel pairing: ${message}`);
    } finally {
      setPairingUri(null);
      setPairingTopic(null);
    }
  }, [pairingTopic]);

  const approve = useCallback(async (accounts: string[], chains: string[]) => {
    if (!pendingProposal) {
      throw new Error('No pending proposal to approve');
    }

    setLastError(null);

    try {
      const session = await walletConnectService.approveSession(
        pendingProposal.id,
        accounts,
        chains
      );
      setSessions(walletConnectService.getSessions());
      setPendingProposal(null);
      setPairingUri(null);
      setPairingTopic(null);
      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLastError(message);
      throw new Error(`Failed to approve session: ${message}`);
    }
  }, [pendingProposal]);

  const reject = useCallback(async (reason: string) => {
    if (!pendingProposal) {
      throw new Error('No pending proposal to reject');
    }

    setLastError(null);

    try {
      await walletConnectService.rejectSession(pendingProposal.id, reason);
      setPendingProposal(null);
      setPairingUri(null);
      setPairingTopic(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLastError(message);
      throw new Error(`Failed to reject session: ${message}`);
    }
  }, [pendingProposal]);

  const disconnect = useCallback(async (topic: string) => {
    setLastError(null);
    try {
      await walletConnectService.disconnectSession(topic);
      setSessions(walletConnectService.getSessions());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLastError(message);
      throw new Error(`Failed to disconnect: ${message}`);
    }
  }, []);

  const respondToRequest = useCallback(async (requestId: string, topic: string, response: any) => {
    setLastError(null);
    try {
      await walletConnectService.respondToSessionRequest(requestId, topic, response);
      setPendingRequest(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLastError(message);
      throw new Error(`Failed to respond to request: ${message}`);
    }
  }, []);

  const rejectRequest = useCallback(async (
    requestId: string,
    topic: string,
    error: { code: number; message: string }
  ) => {
    setLastError(null);
    try {
      await walletConnectService.rejectSessionRequest(requestId, topic, error);
      setPendingRequest(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setLastError(message);
      throw new Error(`Failed to reject request: ${message}`);
    }
  }, []);

  const isConnected = useCallback((topic: string) => {
    return topic in sessions;
  }, [sessions]);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  return {
    initializing,
    initialized,
    initializationError,
    sessions,
    pendingProposal,
    pendingRequest,
    pairingUri,
    pairingTopic,
    pair,
    generatePairingUri,
    cancelPairing,
    approve,
    reject,
    disconnect,
    respondToRequest,
    rejectRequest,
    isConnected,
    error: lastError,
    clearError,
  };
}
