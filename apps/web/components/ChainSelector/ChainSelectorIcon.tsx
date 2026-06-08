'use client';

/**
 * Chain Selector Icon Component (Web)
 * Displays current chain icon in header/top-right with health status
 * Next.js version for PWA
 */

import Image from 'next/image';
import { useState } from 'react';
import { useChainStore, useCurrentChain } from '../../lib/stores/useChainStore';
import styles from './ChainSelector.module.css';
import ChainSelectorModal from './ChainSelectorModal';

interface ChainSelectorIconProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

export default function ChainSelectorIcon({
  size = 'medium',
  showLabel = false,
  className = '',
}: ChainSelectorIconProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const currentChain = useCurrentChain();
  const chainHealth = useChainStore((state) => state.chainHealth);

  if (!currentChain) {
    return null;
  }

  const health = chainHealth[currentChain.id] || { status: 'healthy' };

  const sizeClasses = {
    small: styles.iconSmall,
    medium: styles.iconMedium,
    large: styles.iconLarge,
  };

  const healthColors = {
    healthy: '#10B981',
    degraded: '#F59E0B',
    offline: '#EF4444',
  };

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className={`${styles.chainIconButton} ${sizeClasses[size]} ${className}`}
        aria-label={`Current chain: ${currentChain.name}`}
        aria-haspopup="dialog"
        title={`Switch to another chain (Currently on ${currentChain.name})`}>
        <div className={styles.iconContainer}>
          <Image
            src={currentChain.icon}
            alt={currentChain.name}
            width={40}
            height={40}
            className={styles.chainImage}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.src = '/icons/chains/default.svg';
            }}
          />

          {/* Health Status Badge */}
          <div
            className={styles.healthBadge}
            style={{ backgroundColor: healthColors[health.status] }}
            title={`Chain status: ${health.status}${health.latency ? ` (${health.latency}ms)` : ''}`}
            aria-label={`Chain health: ${health.status}`}
          />

          {/* Testnet Badge */}
          {currentChain.isTestnet && <div className={styles.testnetBadge}>TEST</div>}
        </div>

        {showLabel && <span className={styles.chainLabel}>{currentChain.symbol}</span>}
      </button>

      {/* Chain Selector Modal */}
      <ChainSelectorModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}