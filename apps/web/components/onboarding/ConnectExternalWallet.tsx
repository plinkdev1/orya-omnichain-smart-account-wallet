'use client';

import { useEffect, useRef, useState } from 'react';
import { useWalletConnect } from '@orya/wallet-core/hooks';
import { useSelector } from 'react-redux';
import type { RootState } from '@orya/wallet-core/store';
import type { SessionTypes } from '@walletconnect/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import QRCode from 'qrcode.react';

interface ConnectExternalWalletProps {
  onConnect?: (session: any) => void;
  onError?: (error: string) => void;
}

export function ConnectExternalWallet({
  onConnect,
  onError,
}: ConnectExternalWalletProps) {
  const [uri, setUri] = useState('');
  const [qrVisible, setQrVisible] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<'pair' | 'approve' | 'reject' | 'generate' | 'cancel' | 'disconnect' | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    initializing,
    initialized,
    initializationError,
    pairingUri,
    pairingTopic,
    pair,
    generatePairingUri,
    cancelPairing,
    pendingProposal,
    approve,
    reject,
    disconnect,
    sessions,
    error: walletConnectError,
    clearError,
  } = useWalletConnect();

  const selectedWallet = useSelector((state: RootState) => state.wallet?.selectedWallet);
  const activeSessions = Object.values(sessions || {}) as SessionTypes.Struct[];
  const displayedError = localError || walletConnectError || initializationError;
  const isBusy = loadingAction !== null;

  const handleConnect = async () => {
    if (!uri.trim()) {
      setLocalError('Please enter a WalletConnect URI');
      onError?.('Please enter a WalletConnect URI');
      return;
    }

    if (!uri.startsWith('wc:')) {
      const message = 'Invalid WalletConnect URI. Must start with "wc:"';
      setLocalError(message);
      onError?.(message);
      return;
    }

    setLoadingAction('pair');
    setLocalError(null);
    clearError();

    try {
      await pair(uri.trim());
      setUri('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setLocalError(message);
      onError?.(message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApprove = async () => {
    if (!selectedWallet) {
      const message = 'No wallet selected';
      setLocalError(message);
      onError?.(message);
      return;
    }

    setLoadingAction('approve');
    setLocalError(null);
    clearError();

    try {
      const accounts = [selectedWallet.address];
      const chains = ['1'];
      const session = await approve(accounts, chains);
      if (session) {
        onConnect?.(session);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve connection';
      setLocalError(message);
      onError?.(message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async () => {
    setLoadingAction('reject');
    setLocalError(null);
    clearError();

    try {
      await reject('User rejected the connection request');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject connection';
      setLocalError(message);
      onError?.(message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGenerateQr = async () => {
    setLoadingAction('generate');
    setLocalError(null);
    clearError();

    try {
      if (pairingUri) {
        await cancelPairing();
      }
      await generatePairingUri();
      setQrVisible(true);
      setCopied(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create pairing QR';
      setLocalError(message);
      onError?.(message);
      setQrVisible(false);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCancelQr = async () => {
    if (!pairingUri && !pairingTopic) {
      setQrVisible(false);
      return;
    }

    setLoadingAction('cancel');
    setLocalError(null);
    clearError();

    try {
      await cancelPairing();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel pairing';
      setLocalError(message);
      onError?.(message);
    } finally {
      setLoadingAction(null);
      setQrVisible(false);
    }
  };

  const handleCopyUri = async () => {
    if (!pairingUri) {
      return;
    }

    try {
      await navigator.clipboard.writeText(pairingUri);
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      const message = 'Unable to copy WalletConnect URI';
      setLocalError(message);
      onError?.(message);
    }
  };

  const handleOpenInWallet = () => {
    if (!pairingUri || typeof window === 'undefined') {
      return;
    }
    window.open(pairingUri, '_blank', 'noopener');
  };

  const handleDisconnectSession = async (topic: string) => {
    setLoadingAction('disconnect');
    setLocalError(null);
    clearError();

    try {
      await disconnect(topic);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disconnect session';
      setLocalError(message);
      onError?.(message);
    } finally {
      setLoadingAction(null);
    }
  };

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!pairingUri) {
      setQrVisible(false);
    }
  }, [pairingUri]);

  useEffect(() => {
    if (pendingProposal) {
      setQrVisible(false);
    }
  }, [pendingProposal]);

  useEffect(() => {
    if (displayedError) {
      onError?.(displayedError);
    }
  }, [displayedError, onError]);

  if (initializing) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Initializing WalletConnect...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold">Connect External Wallet</h2>
        {!initialized && (
          <span className="text-xs text-muted-foreground">WalletConnect not fully initialized</span>
        )}
      </div>

      {displayedError && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded border border-destructive/20">
          <p className="text-sm">{displayedError}</p>
        </div>
      )}

      {!pendingProposal ? (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium">WalletConnect URI</label>
            <Input
              type="text"
              placeholder="wc:..."
              value={uri}
              onChange={(e) => {
                setUri(e.target.value);
                setLocalError(null);
                clearError();
              }}
              disabled={!initialized || isBusy}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Paste the connection URI from your wallet app
            </p>
          </div>

          <Button
            onClick={handleConnect}
            disabled={!initialized || isBusy || !uri.trim()}
            className="w-full"
          >
            {loadingAction === 'pair' ? 'Connecting...' : 'Connect Wallet'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            onClick={() => {
              if (qrVisible) {
                handleCancelQr();
              } else {
                handleGenerateQr();
              }
            }}
            disabled={!initialized || isBusy}
            variant="outline"
            className="w-full"
          >
            {loadingAction === 'generate'
              ? 'Generating QR...'
              : qrVisible && pairingUri
                ? 'Hide WalletConnect QR'
                : pairingUri
                  ? 'Refresh WalletConnect QR'
                  : 'Generate WalletConnect QR'}
          </Button>

          {pairingUri && qrVisible && (
            <div className="rounded border border-muted bg-muted/30 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded bg-background p-4 shadow-sm">
                    <QRCode value={pairingUri} size={192} />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Scan this code with your WalletConnect compatible wallet or share the URI below.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-48">
                  <Button onClick={handleCopyUri} variant="outline" disabled={loadingAction !== null}>
                    {copied ? 'Copied' : 'Copy URI'}
                  </Button>
                  <Button onClick={handleOpenInWallet} disabled={loadingAction !== null}>
                    Open in Wallet
                  </Button>
                  <Button onClick={handleCancelQr} variant="ghost" disabled={loadingAction !== null}>
                    Cancel Pairing
                  </Button>
                </div>
              </div>
              <div className="mt-3 rounded bg-background/60 p-3">
                <p className="truncate font-mono text-[11px] text-muted-foreground">{pairingUri}</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4 rounded border border-primary/20 bg-primary/5 p-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Connection Request</h3>
            <p className="text-sm text-muted-foreground">
              {pendingProposal.proposer.metadata.name} wants to connect to your wallet
            </p>
          </div>

          {pendingProposal.proposer.metadata.description && (
            <div className="text-sm text-muted-foreground">
              {pendingProposal.proposer.metadata.description}
            </div>
          )}

          {selectedWallet && (
            <div className="rounded bg-muted p-3 text-sm">
              <p className="mb-1 text-muted-foreground">Wallet to connect</p>
              <p className="font-mono text-xs">{selectedWallet.address}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleApprove}
              disabled={!initialized || isBusy || !selectedWallet}
              className="w-full"
            >
              {loadingAction === 'approve' ? 'Approving...' : 'Approve'}
            </Button>
            <Button
              onClick={handleReject}
              disabled={!initialized || isBusy}
              variant="outline"
              className="w-full"
            >
              {loadingAction === 'reject' ? 'Rejecting...' : 'Reject'}
            </Button>
          </div>
        </div>
      )}

      {activeSessions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Active Connections</h3>
          <div className="space-y-2">
            {activeSessions.map((session: any) => (
              <div key={session.topic} className="rounded border border-muted bg-background/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {session.peer?.metadata?.name || 'Wallet'}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      {session.topic}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnectSession(session.topic)}
                    disabled={loadingAction !== null}
                  >
                    {loadingAction === 'disconnect' ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
