/**
 * Web App Vault Landing Page
 * 
 * Feature parity with mobile implementation
 * Segmentation logic for NORMIE, CRYPTO_NATIVE, and INSTITUTIONAL users
 * Desktop layout with inline upgrade message for NORMIE segment
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Send, ArrowUpDown, Repeat, Share2, Zap, Gift, MoreHorizontal, Check, TrendingUp, Lock } from 'lucide-react';
import { useCopy } from '../../hooks/useCopy';
import { useWallet } from '../../hooks/useWallet';
import { useWalletCapabilities } from '@orya/wallet-core/hooks';
import { useUserStore } from '../../lib/stores/useUserStore';
import { UserSegment } from '@orya/shared-types';
import { SUIBalanceCard } from '../../components/vault/SUIBalanceCard';

interface VaultAction {
  id: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  enabled: boolean;
  tooltip?: string;
}

export default function VaultPage() {
  const { portfolio, loading, error, connectWallet } = useWallet();
  const { profile, isSegment } = useUserStore();
  const capabilities = useWalletCapabilities();
  const copy = useCopy();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const segment = profile?.userSegment || UserSegment.NORMIE;

  const getVaultActions = (): VaultAction[] => {
    const baseActions: VaultAction[] = [
      {
        id: 'send',
        icon: Send,
        label: 'Send',
        enabled: true,
      },
      {
        id: 'receive',
        icon: ArrowUpDown,
        label: 'Receive',
        enabled: true,
      },
    ];

    if (segment === UserSegment.NORMIE) {
      return [
        ...baseActions,
        {
          id: 'pay',
          icon: Gift,
          label: 'Pay',
          enabled: true,
        },
        {
          id: 'card',
          icon: Zap,
          label: 'Card',
          enabled: true,
        },
        {
          id: 'swap',
          icon: Repeat,
          label: 'Swap',
          enabled: false,
          tooltip: 'Upgrade to unlock',
        },
        {
          id: 'bridge',
          icon: Share2,
          label: 'Bridge',
          enabled: false,
          tooltip: 'Upgrade to unlock',
        },
        {
          id: 'more',
          icon: MoreHorizontal,
          label: 'More',
          enabled: true,
        },
      ];
    }

    if (segment === UserSegment.CRYPTO_NATIVE) {
      return [
        ...baseActions,
        {
          id: 'swap',
          icon: Repeat,
          label: 'Swap',
          enabled: true,
        },
        {
          id: 'bridge',
          icon: Share2,
          label: 'Bridge',
          enabled: true,
        },
        {
          id: 'stake',
          icon: Zap,
          label: 'Stake',
          enabled: true,
        },
        {
          id: 'nft',
          icon: Gift,
          label: 'NFT',
          enabled: true,
        },
        {
          id: 'more',
          icon: MoreHorizontal,
          label: 'More',
          enabled: true,
        },
      ];
    }

    if (segment === UserSegment.INSTITUTIONAL) {
      return [
        ...baseActions,
        {
          id: 'swap',
          icon: Repeat,
          label: 'Swap',
          enabled: true,
        },
        {
          id: 'bridge',
          icon: Share2,
          label: 'Bridge',
          enabled: true,
        },
        {
          id: 'stake',
          icon: Zap,
          label: 'Stake',
          enabled: true,
        },
        {
          id: 'nft',
          icon: Gift,
          label: 'NFT',
          enabled: true,
        },
        {
          id: 'approvals',
          icon: Check,
          label: 'Approvals',
          enabled: true,
        },
        {
          id: 'analytics',
          icon: TrendingUp,
          label: 'Analytics',
          enabled: true,
        },
        {
          id: 'more',
          icon: MoreHorizontal,
          label: 'More',
          enabled: true,
        },
      ];
    }

    return baseActions;
  };

  const actions = getVaultActions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
          <p className="text-muted-foreground">{copy.common?.loading || "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 pt-8 pb-24">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{copy.vault?.title || "Vault"}</h1>
          <p className="text-muted-foreground">{copy.vault?.subtitle || "Portfolio overview and account management"}</p>
        </div>
        <button
          onClick={() => connectWallet('privy')}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-2xl hover:opacity-90 transition-opacity"
        >
          {copy.actions?.connectWallet || 'Connect Wallet'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <SUIBalanceCard />
      </div>

      {portfolio.wallets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{copy.vault?.noWalletsConnected || "No wallets connected"}</p>
          <button
            onClick={() => connectWallet('privy')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-2xl hover:opacity-90 transition-opacity"
          >
            {copy.actions?.connectFirstWallet || "Connect Your First Wallet"}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 mb-8">
          {portfolio.wallets.map((wallet) => (
            <div
              key={wallet.address}
              className="p-4 bg-white dark:bg-orya-ocean/80 border border-orya-sea-blue/30 dark:border-orya-sea-blue/50 rounded-2xl"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{wallet.name || copy.wallet?.defaultLabel || 'Wallet'}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{wallet.address}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs font-medium">
                  {wallet.chain}
                </span>
              </div>

              {wallet.balance && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{copy.vault?.balance || "Balance"}</p>
                  <p className="text-xl font-bold text-orya-charcoal dark:text-white">
                    {wallet.balance.formatted} {wallet.balance.symbol}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-orya-ocean/80 rounded-2xl p-6 border border-orya-sea-blue/30 dark:border-orya-sea-blue/50">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {segment === UserSegment.NORMIE
            ? 'Quick Actions'
            : segment === UserSegment.CRYPTO_NATIVE
              ? 'Trading & Assets'
              : 'Suite Controls'}
        </h2>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {actions.map((action) => {
            const IconComponent = action.icon;
            const isDisabled = !action.enabled;

            return (
              <button
                key={action.id}
                disabled={isDisabled}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                  isDisabled
                    ? 'bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 opacity-60 cursor-not-allowed'
                    : 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-400'
                }`}
                title={action.tooltip}
              >
                <div className="relative mb-2">
                  <IconComponent
                    size={20}
                    className={isDisabled ? 'text-gray-400' : 'text-blue-600 dark:text-blue-400'}
                  />
                  {isDisabled && (
                    <Lock
                      size={10}
                      className="absolute -right-2 -bottom-2 text-red-500"
                    />
                  )}
                </div>
                <span className={`text-xs font-semibold text-center leading-tight ${
                  isDisabled
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-blue-900 dark:text-blue-200'
                }`}>
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>

        {segment === UserSegment.NORMIE && (
          <div className="space-y-3 pt-2">
            <button
              onClick={() => setShowUpgradePrompt(!showUpgradePrompt)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              🚀 Upgrade to Web3
            </button>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                💡 Unlock Swap, Bridge, Staking, NFTs & more
              </p>
            </div>

            {showUpgradePrompt && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-700 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                  Upgrade your account to unlock advanced trading features, multi-chain bridging, staking, NFT management, and more. Your current plan includes basic payments and card features.
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-colors">
                    Learn More
                  </button>
                  <button
                    onClick={() => setShowUpgradePrompt(false)}
                    className="px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

