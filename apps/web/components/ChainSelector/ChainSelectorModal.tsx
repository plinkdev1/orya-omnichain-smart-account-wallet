'use client';

/**
 * Chain Selector Modal Component (Web)
 * Enhanced with search, favorites, and recently used chains
 * Next.js version for PWA
 */

import { Search, Star } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useAvailableChains, useChainStore, useSwitchChain } from '../../lib/stores/useChainStore';
import styles from './ChainSelector.module.css';

interface ChainSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChainSelectorModal({ open, onOpenChange }: ChainSelectorModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
  const chains = useAvailableChains();
  const currentChainId = useChainStore((state) => state.currentChainId);
  const chainHealth = useChainStore((state) => state.chainHealth);
  const switchChain = useSwitchChain();
  const checkAllChainsHealth = useChainStore((state) => state.checkAllChainsHealth);

  const healthColors = {
    healthy: '#10B981',
    degraded: '#F59E0B',
    offline: '#EF4444',
    devnet: '#3B82F6',
  };

  const healthLabels = {
    healthy: 'Healthy',
    degraded: 'Slow',
    offline: 'Offline',
    devnet: 'Devnet',
  };

  // Load favorites and recently used from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('orya-chain-favorites');
    if (savedFavorites) {
      try {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      } catch {
        // Ignore parse errors
      }
    }

    const savedRecent = localStorage.getItem('orya-chain-recent');
    if (savedRecent) {
      try {
        setRecentlyUsed(JSON.parse(savedRecent));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Check chain health when modal opens
  useEffect(() => {
    if (open) {
      setIsClosing(false);
      checkAllChainsHealth();
    }
  }, [open, checkAllChainsHealth]);

  // Handle keyboard escape
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onOpenChange(false);
    }, 300);
  };

  const handleChainSwitch = (chainId: string) => {
    switchChain(chainId);
    
    // Add to recently used
    const updated = [chainId, ...recentlyUsed.filter(id => id !== chainId)].slice(0, 5);
    setRecentlyUsed(updated);
    localStorage.setItem('orya-chain-recent', JSON.stringify(updated));
    
    handleClose();
  };

  const toggleFavorite = (chainId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(chainId)) {
      newFavorites.delete(chainId);
    } else {
      newFavorites.add(chainId);
    }
    setFavorites(newFavorites);
    localStorage.setItem('orya-chain-favorites', JSON.stringify(Array.from(newFavorites)));
  };

  // Filter and sort chains
  const filteredChains = useMemo(() => {
    let filtered = chains.filter((chain) =>
      chain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chain.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort: favorites first, then recently used, then by name
    filtered.sort((a, b) => {
      const aIsFavorite = favorites.has(a.id);
      const bIsFavorite = favorites.has(b.id);
      
      if (aIsFavorite !== bIsFavorite) {
        return aIsFavorite ? -1 : 1;
      }

      const aIsRecent = recentlyUsed.includes(a.id);
      const bIsRecent = recentlyUsed.includes(b.id);
      
      if (aIsRecent !== bIsRecent) {
        return aIsRecent ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [chains, searchQuery, favorites, recentlyUsed]);

  if (!open && !isClosing) {
    return null;
  }

  return (
    <div
      className={`${styles.modal} ${isClosing ? styles.closed : ''}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chain-selector-title">
      {/* Content container - prevents closing when clicking inside */}
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 id="chain-selector-title" className={styles.modalTitle}>
            Select Blockchain
          </h2>
          <button
            onClick={handleClose}
            className={styles.closeButton}
            aria-label="Close chain selector"
            type="button">
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e5e5' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#999',
              }}
            />
            <input
              type="text"
              placeholder="Search chains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* Chain List */}
        <div className={styles.chainList} role="listbox">
          {filteredChains.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#999' }}>
              <p style={{ margin: 0, fontSize: '14px' }}>No chains found</p>
            </div>
          ) : (
            filteredChains.map((chain) => {
              const health = chainHealth[chain.id] || { status: 'healthy' };
              const isSelected = chain.id === currentChainId;
              const isFavorite = favorites.has(chain.id);

              return (
                <button
                  key={chain.id}
                  onClick={() => handleChainSwitch(chain.id)}
                  className={`${styles.chainItem} ${isSelected ? styles.selected : ''}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-label={`${chain.name} - ${healthLabels[health.status as keyof typeof healthLabels]}${health.latency ? ` ${health.latency}ms` : ''}`}
                  type="button">
                  {/* Chain Icon */}
                  <Image
                    src={chain.icon}
                    alt={chain.name}
                    width={40}
                    height={40}
                    className={styles.chainItemIcon}
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.src = '/icons/chains/default.svg';
                    }}
                  />

                  {/* Chain Info */}
                  <div className={styles.chainInfo}>
                    <div className={styles.chainNameRow}>
                      <span className={styles.chainName}>{chain.name}</span>
                      {chain.isTestnet && <span className={styles.testnetTag}>TESTNET</span>}
                    </div>

                    {/* Health Status Row */}
                    <div className={styles.healthRow}>
                      <div
                        className={styles.healthDot}
                        style={{ backgroundColor: healthColors[health.status as keyof typeof healthColors] }}
                        aria-hidden="true"
                      />
                      <span className={styles.healthText}>
                        {healthLabels[health.status as keyof typeof healthLabels]}
                        {health.latency && ` (${health.latency}ms)`}
                      </span>
                    </div>
                  </div>

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => toggleFavorite(chain.id, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isFavorite ? '#F59E0B' : '#ccc',
                      marginRight: '8px',
                    }}
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    type="button">
                    <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className={styles.selectedIndicator} aria-hidden="true">
                      ✓
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <p className={styles.footerText}>
            Switching chains updates all wallet and trading features
          </p>
        </div>
      </div>
    </div>
  );
}