/**
 * BlockchainIcon Component
 * Renders blockchain icons from the manifest with fallback support
 */

import Image from 'next/image';
import React, { useEffect, useState } from 'react';

interface IconEntry {
  canonical_name: string;
  filename: string;
  sha256: string;
  source: string;
  source_repo: string;
  png?: {
    '32': string;
    '64': string;
    '128': string;
  };
}

type IconSize = 32 | 64 | 128;

interface BlockchainIconProps {
  chainName: string;
  size?: IconSize;
  alt?: string;
  className?: string;
  preferSvg?: boolean;
}

// Icon manifest - loaded once at module initialization
let iconManifest: Record<string, IconEntry> | null = null;

async function loadManifest(): Promise<Record<string, IconEntry>> {
  if (iconManifest) return iconManifest;

  try {
    const response = await fetch('/icons/manifest.json');
    if (!response.ok) {
      console.warn('Failed to load icon manifest:', response.statusText);
      return {};
    }
    iconManifest = await response.json();
    return iconManifest;
  } catch (error) {
    console.warn('Error loading icon manifest:', error);
    return {};
  }
}

/**
 * Get the icon path for a blockchain
 * Returns SVG path by default, PNG if available and requested
 */
export function getIconPath(
  chainName: string,
  size?: IconSize,
  preferSvg = false
): string | null {
  if (!iconManifest) return null;

  const normalizedName = chainName.toLowerCase();
  const entry = iconManifest[normalizedName];

  if (!entry) return null;

  if (preferSvg) {
    return `/icons/svg/${entry.filename}`;
  }

  // Try to use PNG if available and size is specified
  if (size && entry.png?.[size]) {
    return `/icons/${entry.png[size]}`;
  }

  // Fall back to SVG
  return `/icons/svg/${entry.filename}`;
}

/**
 * BlockchainIcon Component
 * Renders a blockchain icon with multiple format support
 */
export const BlockchainIcon: React.FC<BlockchainIconProps> = ({
  chainName,
  size = 32,
  alt,
  className = '',
  preferSvg = false
}) => {
  const [iconPath, setIconPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const manifest = await loadManifest();

      if (!manifest || Object.keys(manifest).length === 0) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      const normalizedName = chainName.toLowerCase();
      const entry = manifest[normalizedName];

      if (!entry) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      let path: string | null = null;

      if (preferSvg) {
        path = `/icons/svg/${entry.filename}`;
      } else if (size && entry.png?.[size]) {
        path = `/icons/${entry.png[size]}`;
      } else {
        path = `/icons/svg/${entry.filename}`;
      }

      setIconPath(path);
      setIsLoading(false);
    })();
  }, [chainName, size, preferSvg]);

  if (isLoading) {
    return (
      <div
        className={`bg-gray-200 rounded ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    );
  }

  if (hasError || !iconPath) {
    // Fallback: render colored circle with first letter
    const letter = chainName[0].toUpperCase();
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gray-300 text-white font-bold ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          fontSize: `${size * 0.6}px`,
        }}
      >
        {letter}
      </div>
    );
  }

  return (
    <Image
      src={iconPath}
      alt={alt || `${chainName} icon`}
      width={size}
      height={size}
      className={className}
      priority={false}
      unoptimized={iconPath.endsWith('.svg')} // Don't optimize SVGs
    />
  );
};

/**
 * BlockchainIconGrid Component
 * Displays multiple blockchain icons in a grid
 */
interface BlockchainIconGridProps {
  chains: string[];
  size?: IconSize;
  cols?: number;
  className?: string;
}

export const BlockchainIconGrid: React.FC<BlockchainIconGridProps> = ({
  chains,
  size = 64,
  cols = 4,
  className = ''
}) => {
  return (
    <div
      className={`grid gap-4 ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${size + 16}px, 1fr))`
      }}
    >
      {chains.map((chain) => (
        <div key={chain} className="flex flex-col items-center gap-2">
          <BlockchainIcon chainName={chain} size={size} />
          <span className="text-xs text-center">{chain}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Hook to load and access the icon manifest
 */
export function useBlockchainIcons() {
  const [manifest, setManifest] = useState<Record<string, IconEntry> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const m = await loadManifest();
      setManifest(m);
      setIsLoading(false);
    })();
  }, []);

  return {
    manifest,
    isLoading,
    getIcon: (chainName: string, size?: IconSize) =>
      getIconPath(chainName, size),
  };
}

export default BlockchainIcon;