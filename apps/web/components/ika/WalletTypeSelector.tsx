'use client';

import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWalletConnect } from '@orya/wallet-core/hooks';
import type { SessionTypes } from '@walletconnect/types';
import { ConnectExternalWallet } from '@/components/onboarding/ConnectExternalWallet';

export type WalletType = 'human-network' | 'standard' | 'enhanced';

interface WalletTypeSelectorProps {
  onSelect: (type: WalletType) => void;
}

export function WalletTypeSelector({ onSelect }: WalletTypeSelectorProps) {
  const [activeType, setActiveType] = useState<WalletType | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const { initializing, sessions, error: walletError, disconnect } = useWalletConnect();
  const activeSessions = useMemo(
    () => Object.values(sessions || {}) as SessionTypes.Struct[],
    [sessions],
  );
  const isDialogOpen = activeType !== null;
  const statusMessage = activeSessions.length > 0
    ? `${activeSessions.length} active connection${activeSessions.length > 1 ? 's' : ''}`
    : 'No active WalletConnect sessions';
  const dialogTitle = activeType === 'standard'
    ? 'Standard Secure Wallet'
    : activeType === 'enhanced'
      ? 'Enhanced Zero-Trust Wallet'
      : 'Beginner-Friendly Wallet';

  const handleOpenDialog = (type: WalletType) => {
    setDialogError(null);
    setActiveType(type);
  };

  const handleCloseDialog = () => {
    setDialogError(null);
    setActiveType(null);
  };

  const handleConnectSuccess = () => {
    if (activeType) {
      onSelect(activeType);
    }
    handleCloseDialog();
  };

  const handleDisconnectAll = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (activeSessions.length === 0) {
      return;
    }
    setDisconnecting(true);
    setDialogError(null);
    try {
      await Promise.all(activeSessions.map((session) => disconnect(session.topic)));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect sessions';
      setDialogError(message);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-deep-charcoal dark:text-bone-white">
          Choose Your Wallet Security Level
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Pick the security model that fits your needs. You can upgrade later.
        </p>
      </div>

      {walletError && (
        <div className="rounded border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {walletError}
        </div>
      )}

      <Card
        className="p-6 cursor-pointer hover:border-sui-blue hover:shadow-lg transition-all"
        onClick={() => onSelect('standard')}
      >
        <div className="flex items-start gap-4">
          <div className="text-5xl">🔐</div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2 text-deep-charcoal dark:text-bone-white">
              Standard Secure Wallet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Multi-Party Computation (MPC) security with recovery phrase backup. Perfect for
              most users.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                <div className="font-semibold text-green-800 dark:text-green-300 mb-1">
                  ✓ Easy Setup
                </div>
                <div className="text-sm text-green-700 dark:text-green-400">5 minutes to get started</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                <div className="font-semibold text-green-800 dark:text-green-300 mb-1">
                  ✓ MPC Security
                </div>
                <div className="text-sm text-green-700 dark:text-green-400">
                  Industry-standard protection
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                <div className="font-semibold text-green-800 dark:text-green-300 mb-1">
                  ✓ Recovery Options
                </div>
                <div className="text-sm text-green-700 dark:text-green-400">Backup phrase included</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                <div className="font-semibold text-green-800 dark:text-green-300 mb-1">
                  ✓ Multi-Chain
                </div>
                <div className="text-sm text-green-700 dark:text-green-400">Works across blockchains</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-semibold rounded">
                RECOMMENDED
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Best for holdings under $10,000
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">{statusMessage}</span>
              <div className="flex items-center gap-2">
                {activeSessions.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(event) => handleDisconnectAll(event)}
                    disabled={disconnecting}
                  >
                    {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenDialog('standard');
                  }}
                  disabled={initializing}
                >
                  Connect
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card
        className="p-6 cursor-pointer hover:border-neon-gold hover:shadow-lg transition-all border-2 border-neon-gold relative overflow-hidden"
        onClick={() => onSelect('enhanced')}
      >
        <div className="absolute top-0 right-0 bg-neon-gold text-deep-charcoal px-4 py-1 text-xs font-bold">
          PREMIUM
        </div>
        <div className="flex items-start gap-4">
          <div className="text-5xl">🛡️</div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2 text-deep-charcoal dark:text-bone-white">
              Enhanced Zero-Trust Wallet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Enterprise-grade security with IKA 2PC-MPC technology. Your private keys never
              exist in full, anywhere. Maximum protection for serious holdings.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                <div className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
                  ✓ Zero-Trust Architecture
                </div>
                <div className="text-sm text-yellow-800 dark:text-yellow-400">Keys never reconstructed</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                <div className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
                  ✓ Threshold Signatures
                </div>
                <div className="text-sm text-yellow-800 dark:text-yellow-400">2-of-2 distributed signing</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                <div className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
                  ✓ On-Chain Security
                </div>
                <div className="text-sm text-yellow-800 dark:text-yellow-400">Powered by Sui blockchain</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                <div className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
                  ✓ Institutional Grade
                </div>
                <div className="text-sm text-yellow-800 dark:text-yellow-400">Built for large portfolios</div>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-neon-gold p-3 mb-4">
              <p className="text-sm text-yellow-900 dark:text-yellow-300">
                <strong>Perfect for:</strong> Power users, institutions, portfolios over $10,000,
                Bitcoin staking, DeFi with large positions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-neon-gold text-deep-charcoal text-sm font-bold rounded">
                HIGHEST SECURITY
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Recommended for $10K+ holdings
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">{statusMessage}</span>
              <div className="flex items-center gap-2">
                {activeSessions.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(event) => handleDisconnectAll(event)}
                    disabled={disconnecting}
                  >
                    {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenDialog('enhanced');
                  }}
                  disabled={initializing}
                >
                  Connect
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card
        className="p-6 cursor-pointer hover:border-sui-blue hover:shadow-lg transition-all"
        onClick={() => onSelect('human-network')}
      >
        <div className="flex items-start gap-4">
          <div className="text-5xl">👤</div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2 text-deep-charcoal dark:text-bone-white">
              Beginner-Friendly Wallet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Social login with Google, Apple, or email. No complex setup. Perfect for crypto
              newcomers.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <div className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                  ✓ Social Login
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-400">Google, Apple, email</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <div className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                  ✓ No Recovery Phrase
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-400">Automatic backup</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <div className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                  ✓ 2-Minute Setup
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-400">Fastest onboarding</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <div className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                  ✓ User-Friendly
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-400">No crypto knowledge needed</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm font-semibold rounded">
                BEGINNER FRIENDLY
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Best for getting started quickly
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">WalletConnect optional</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenDialog('human-network');
                  }}
                  disabled={initializing}
                >
                  Connect Wallet
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
        <p>Not sure which to choose? Start with Standard and upgrade to Enhanced later.</p>
        <p className="mt-2">All wallet types support the same tokens and features.</p>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog();
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Use WalletConnect to authorize this wallet securely.
            </p>
          </DialogHeader>
          {dialogError && (
            <div className="mb-4 rounded border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {dialogError}
            </div>
          )}
          <ConnectExternalWallet
            key={activeType ?? 'wallet-connect-dialog'}
            onConnect={handleConnectSuccess}
            onError={setDialogError}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
