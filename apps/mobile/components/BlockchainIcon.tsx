/**
 * BlockchainIcon Component (React Native)
 * Renders blockchain icons from the manifest with fallback support
 * Optimized for mobile/Expo with NativeWind and React Native Image
 */

import { useTailwind } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';

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
  style?: object;
}

// Icon manifest - loaded once at module initialization
let iconManifest: Record<string, IconEntry> | null = null;

/**
 * Load icon manifest from local storage or fetch from web
 */
async function loadManifest(): Promise<Record<string, IconEntry>> {
  if (iconManifest) return iconManifest;

  try {
    // Try to load from web asset first
    const manifestPath = require('../assets/icons/manifest.json');
    if (manifestPath) {
      iconManifest = manifestPath;
      return iconManifest;
    }
  } catch (error) {
    // Fallback: try to fetch if running in web/expo-web
    console.warn('Manifest not found in assets');
  }

  return {};
}

/**
 * Get the icon path for a blockchain (mobile-optimized)
 * Returns PNG or SVG path based on availability
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

  // For mobile, prefer PNG when available
  if (size && entry.png?.[size] && !preferSvg) {
    return entry.png[size];
  }

  if (preferSvg || !entry.png?.[size]) {
    return entry.filename;
  }

  return entry.filename;
}

/**
 * BlockchainIcon Component (React Native)
 * Renders a blockchain icon with multiple format support
 */
export const BlockchainIcon: React.FC<BlockchainIconProps> = ({
  chainName,
  size = 32,
  alt,
  className = '',
  preferSvg = false,
  style
}) => {
  const tw = useTailwind();
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
        path = entry.filename;
      } else if (size && entry.png?.[size]) {
        path = entry.png[size];
      } else {
        path = entry.filename;
      }

      setIconPath(path);
      setIsLoading(false);
    })();
  }, [chainName, size, preferSvg]);

  if (isLoading) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#e5e7eb',
          },
          style,
        ]}
      />
    );
  }

  if (hasError || !iconPath) {
    // Fallback: render colored circle with first letter
    const letter = chainName[0].toUpperCase();
    const colors = [
      '#FFD700', // Gold
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#FFA07A', // Light Salmon
      '#98D8C8', // Mint
    ];
    const colorIndex = chainName.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];

    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bgColor,
            justifyContent: 'center',
            alignItems: 'center',
          },
          style,
        ]}
      >
        <Text
          style={{
            fontSize: size * 0.6,
            fontWeight: 'bold',
            color: '#fff',
          }}
        >
          {letter}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: iconPath }}
      style={[
        {
          width: size,
          height: size,
          resizeMode: 'contain',
        },
        style,
      ]}
      alt={alt || `${chainName} icon`}
    />
  );
};

/**
 * BlockchainIconGrid Component (React Native)
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
  cols = 2,
  className = '',
}) => {
  const tw = useTailwind();

  return (
    <View className={`flex flex-wrap gap-4 ${className}`}>
      {chains.map((chain) => (
        <View
          key={chain}
          className="flex flex-col items-center gap-2"
          style={{
            width: `${100 / cols}%`,
            alignItems: 'center',
          }}
        >
          <BlockchainIcon chainName={chain} size={size} />
          <Text className="text-xs text-center">{chain}</Text>
        </View>
      ))}
    </View>
  );
};

/**
 * Hook to load and access the icon manifest (Mobile)
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