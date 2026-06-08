/**
 * Chain Selector Icon Component (Mobile)
 * Displays current chain icon in header/top-right with health status
 * React Native version for Expo
 */

import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useChainStore, useCurrentChain } from '../../lib/stores/useChainStore';
import ChainSelectorSheet from './ChainSelectorSheet';

interface ChainSelectorIconProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export default function ChainSelectorIcon({ size = 'medium', showLabel = false }: ChainSelectorIconProps) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const currentChain = useCurrentChain();
  const chainHealth = useChainStore((state) => state.chainHealth);

  if (!currentChain) {
    return null;
  }

  const health = chainHealth[currentChain.id] || { status: 'healthy' };
  const sizeMap = {
    small: 24,
    medium: 32,
    large: 40,
  };
  const iconSize = sizeMap[size];
  const badgeSize = iconSize * 0.4;

  // Determine health badge color
  const healthColors = {
    healthy: '#10B981', // Green
    degraded: '#F59E0B', // Orange
    offline: '#EF4444', // Red
  };

  return (
    <>
      <Pressable
        onPress={() => setSheetVisible(true)}
        style={[
          styles.container,
          {
            width: iconSize + 8,
            height: iconSize + 8,
          },
        ]}
        accessibilityLabel={`Current chain: ${currentChain.name}`}
        accessibilityHint="Double tap to change chain"
        accessibilityRole="button">
        <View
          style={[
            styles.iconContainer,
            {
              width: iconSize,
              height: iconSize,
            },
          ]}>
          <Image
            source={{ uri: currentChain.icon }}
            style={{
              width: iconSize,
              height: iconSize,
              borderRadius: iconSize / 2,
            }}
            defaultSource={require('../../assets/icons/chain-default.png')}
          />

          {/* Health Status Badge */}
          <View
            style={[
              styles.healthBadge,
              {
                width: badgeSize,
                height: badgeSize,
                borderRadius: badgeSize / 2,
                backgroundColor: healthColors[health.status],
                borderWidth: 2,
                borderColor: '#fff',
                bottom: -2,
                right: -2,
              },
            ]}
            accessibilityLabel={`Chain status: ${health.status}`}
          />

          {/* Testnet Badge */}
          {currentChain.isTestnet && (
            <View
              style={[
                styles.testnetBadge,
                {
                  height: badgeSize * 0.8,
                  paddingHorizontal: badgeSize * 0.3,
                },
              ]}>
              <Text style={styles.testnetText}>TEST</Text>
            </View>
          )}
        </View>
      </Pressable>

      {showLabel && (
        <Text
          style={[
            styles.chainLabel,
            {
              marginTop: size === 'small' ? 4 : 8,
            },
          ]}>
          {currentChain.symbol}
        </Text>
      )}

      {/* Chain Selector Sheet/Modal */}
      <ChainSelectorSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </>
  );
}

import { Text } from 'react-native';

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  healthBadge: {
    position: 'absolute',
  },
  testnetBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#4DA2FF',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testnetText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: 'bold',
  },
  chainLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
});