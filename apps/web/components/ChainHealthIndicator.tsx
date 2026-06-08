'use client';

/**
 * Chain Health Indicator Component
 * Displays real-time chain health status with color-coded indicators
 * Supports mainnet, testnet, and devnet environments
 */

import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCurrentChain } from '@/lib/stores/useChainStore';
import { chainHealthService, type HealthMetrics } from '@orya/wallet-core';

type HealthStatus = 'healthy' | 'degraded' | 'offline' | 'devnet';

interface StatusConfig {
  color: string;
  bgColor: string;
  label: string;
  emoji: string;
  description: string;
}

const STATUS_CONFIG: Record<HealthStatus, StatusConfig> = {
  healthy: {
    color: '#10B981',
    bgColor: 'bg-emerald-500',
    label: 'Healthy',
    emoji: '🟢',
    description: 'Network fully operational',
  },
  degraded: {
    color: '#F59E0B',
    bgColor: 'bg-amber-500',
    label: 'Degraded',
    emoji: '🟡',
    description: 'Performance degraded, transactions may be slow',
  },
  offline: {
    color: '#EF4444',
    bgColor: 'bg-red-500',
    label: 'Offline',
    emoji: '🔴',
    description: 'Network unavailable or RPC unresponsive',
  },
  devnet: {
    color: '#3B82F6',
    bgColor: 'bg-blue-500',
    label: 'Devnet',
    emoji: '🔵',
    description: 'Connected to development/test network',
  },
};

export function ChainHealthIndicator() {
  const currentChain = useCurrentChain();
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!currentChain) return;

    const unsubscribe = chainHealthService.subscribe((updatedMetrics) => {
      if (updatedMetrics.chain === currentChain.id) {
        setMetrics(updatedMetrics);
        setIsLoading(false);
      }
    });

    // Get current metrics if available
    const currentMetrics = chainHealthService.getMetrics(currentChain.id);
    if (currentMetrics) {
      setMetrics(currentMetrics);
      setIsLoading(false);
    }

    // Check health immediately if not loaded
    if (!currentMetrics) {
      chainHealthService.checkChainHealth(currentChain.id).catch(console.error);
    }

    return unsubscribe;
  }, [currentChain]);

  if (!currentChain || isLoading || !metrics) {
    return (
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary/50 animate-pulse">
        <div className="w-3 h-3 rounded-full bg-secondary" />
      </div>
    );
  }

  const config = STATUS_CONFIG[metrics.status];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-secondary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label={`Chain health: ${config.label}`}
          title={config.description}
        >
          <div
            className="w-4 h-4 rounded-full animate-pulse"
            style={{ backgroundColor: config.color }}
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div
              className="text-2xl"
              aria-hidden="true"
            >
              {config.emoji}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                {currentChain.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {config.label} — {config.description}
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground font-medium mb-1">
                Latency
              </p>
              <p className="text-sm font-semibold text-foreground">
                {metrics.response_time_ms}ms
              </p>
            </div>

            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground font-medium mb-1">
                Success Rate
              </p>
              <p className="text-sm font-semibold text-foreground">
                {metrics.success_rate}%
              </p>
            </div>

            {metrics.block_lag > 0 && (
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Block Lag
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {metrics.block_lag} blocks
                </p>
              </div>
            )}

            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground font-medium mb-1">
                Last Check
              </p>
              <p className="text-sm font-semibold text-foreground">
                {formatTimeAgo(metrics.last_checked)}
              </p>
            </div>
          </div>

          {/* Network Info */}
          <div className="border-t border-border/50 pt-3 text-xs text-muted-foreground space-y-1">
            <p>
              <span className="font-medium">Endpoint:</span>{' '}
              <code className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded break-all">
                {truncateUrl(metrics.endpoint)}
              </code>
            </p>
            {currentChain.isTestnet && (
              <p className="text-blue-600 dark:text-blue-400 font-medium">
                ℹ️ Testnet Environment
              </p>
            )}
          </div>

          {/* Action */}
          {metrics.status === 'offline' && (
            <button
              onClick={() => {
                chainHealthService.checkChainHealth(currentChain.id).catch(console.error);
              }}
              className="w-full px-3 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
            >
              Retry Check
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) {
    return 'just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncateUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const path = urlObj.pathname.slice(0, 20);
    return domain + (path ? path + '...' : '');
  } catch {
    return url.slice(0, 30) + (url.length > 30 ? '...' : '');
  }
}
