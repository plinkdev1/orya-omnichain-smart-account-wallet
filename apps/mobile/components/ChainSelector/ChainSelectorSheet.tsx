/**
 * Chain Selector Sheet Component (Mobile)
 * Bottom sheet showing all available chains with health status
 * React Native version for Expo
 */

import React, { useEffect } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAvailableChains, useChainStore, useSwitchChain } from '../../lib/stores/useChainStore';

interface ChainSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function ChainSelectorSheet({ visible, onClose }: ChainSelectorSheetProps) {
  const chains = useAvailableChains();
  const currentChainId = useChainStore((state) => state.currentChainId);
  const chainHealth = useChainStore((state) => state.chainHealth);
  const switchChain = useSwitchChain();
  const checkAllChainsHealth = useChainStore((state) => state.checkAllChainsHealth);

  // Check chain health when sheet opens
  useEffect(() => {
    if (visible) {
      checkAllChainsHealth();
    }
  }, [visible]);

  const handleChainSwitch = (chainId: any) => {
    switchChain(chainId);
    onClose();
  };

  const healthColors = {
    healthy: '#10B981',
    degraded: '#F59E0B',
    offline: '#EF4444',
  };

  const healthLabels = {
    healthy: 'Healthy',
    degraded: 'Slow',
    offline: 'Offline',
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      accessibilityLabel="Chain selector modal">
      {/* Overlay */}
      <Pressable
        style={styles.overlay}
        onPress={onClose}
        accessible={false}
      />

      {/* Sheet Content */}
      <View style={styles.sheetContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Blockchain</Text>
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Close chain selector">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        {/* Chain List */}
        <ScrollView
          style={styles.chainList}
          showsVerticalScrollIndicator={false}
          scrollIndicatorInsets={{ right: 1 }}>
          {chains.map((chain) => {
            const health = chainHealth[chain.id] || { status: 'healthy' };
            const isSelected = chain.id === currentChainId;

            return (
              <Pressable
                key={chain.id}
                onPress={() => handleChainSwitch(chain.id)}
                style={[
                  styles.chainItem,
                  isSelected && styles.chainItemSelected,
                ]}
                accessibilityLabel={`${chain.name} - ${health.status}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}>
                {/* Chain Icon */}
                <Image
                  source={{ uri: chain.icon }}
                  style={styles.chainIcon}
                  defaultSource={require('../../assets/icons/chain-default.png')}
                />

                {/* Chain Info */}
                <View style={styles.chainInfo}>
                  <View style={styles.chainNameRow}>
                    <Text
                      style={[
                        styles.chainName,
                        isSelected && styles.chainNameSelected,
                      ]}>
                      {chain.name}
                    </Text>
                    {chain.isTestnet && (
                      <View style={styles.testnetTag}>
                        <Text style={styles.testnetTagText}>TESTNET</Text>
                      </View>
                    )}
                  </View>

                  {/* Health Status Row */}
                  <View style={styles.healthRow}>
                    <View
                      style={[
                        styles.healthDot,
                        { backgroundColor: healthColors[health.status] },
                      ]}
                    />
                    <Text style={styles.healthText}>
                      {healthLabels[health.status]}
                      {health.latency && ` (${health.latency}ms)`}
                    </Text>
                  </View>
                </View>

                {/* Selection Indicator */}
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Switching chains updates all wallet and trading features
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F8F6F1',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 20,
    color: '#666',
  },
  chainList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  chainItemSelected: {
    backgroundColor: '#F0F4FF',
    borderColor: '#4DA2FF',
    borderWidth: 2,
  },
  chainIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chainInfo: {
    flex: 1,
  },
  chainNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  chainName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 8,
  },
  chainNameSelected: {
    color: '#4DA2FF',
  },
  testnetTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#E0E7FF',
    borderRadius: 4,
  },
  testnetTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4DA2FF',
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  healthText: {
    fontSize: 12,
    color: '#666',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4DA2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});