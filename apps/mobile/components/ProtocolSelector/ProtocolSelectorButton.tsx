import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Protocol, FeatureType, ChainId } from '@orya/wallet-core';
import { useProtocolSelection } from '@orya/wallet-core';
import ProtocolSelectorModal from './ProtocolSelectorModal';

const { width } = Dimensions.get('window');

interface ProtocolSelectorButtonProps {
  chainId: ChainId;
  feature: FeatureType;
  availableProtocols: Protocol[];
  label?: string;
  compact?: boolean;
  onSelect?: (protocolId: string) => void;
}

export default function ProtocolSelectorButton({
  chainId,
  feature,
  availableProtocols,
  label = 'Protocol',
  compact = false,
  onSelect,
}: ProtocolSelectorButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { selectedProtocol } = useProtocolSelection(
    chainId,
    feature,
    availableProtocols
  );

  const handleSelect = (protocolId: string) => {
    onSelect?.(protocolId);
  };

  if (compact) {
    return (
      <>
        <TouchableOpacity
          onPress={() => setIsModalOpen(true)}
          style={styles.compactButton}
        >
          <LinearGradient
            colors={['#8B5CF6', '#3B82F6']}
            style={styles.compactLogo}
          >
            <Text style={styles.logoText}>{selectedProtocol?.logo || '⚙️'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <ProtocolSelectorModal
          visible={isModalOpen}
          chainId={chainId}
          feature={feature}
          availableProtocols={availableProtocols}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleSelect}
        />
      </>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          onPress={() => setIsModalOpen(true)}
          style={styles.button}
        >
          {selectedProtocol ? (
            <>
              <LinearGradient
                colors={['#8B5CF6', '#3B82F6']}
                style={styles.logo}
              >
                <Text style={styles.logoText}>{selectedProtocol.logo}</Text>
              </LinearGradient>
              <View style={styles.content}>
                <Text style={styles.protocolName}>{selectedProtocol.name}</Text>
                <Text style={styles.protocolType}>{selectedProtocol.type}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.placeholder}>Select a protocol</Text>
          )}
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {selectedProtocol && (
          <View style={styles.stats}>
            {selectedProtocol.apy !== undefined && (
              <View style={styles.stat}>
                <Text style={styles.statLabel}>APY</Text>
                <Text style={styles.statValue}>{selectedProtocol.apy}%</Text>
              </View>
            )}
            <View style={styles.stat}>
              <Text style={styles.statLabel}>TVL</Text>
              <Text style={styles.statValue}>{selectedProtocol.tvl}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Fee</Text>
              <Text style={styles.statValue}>{selectedProtocol.fee}</Text>
            </View>
            {selectedProtocol.isAudited && (
              <View style={styles.stat}>
                <Text style={styles.statLabel}>✓ Audited</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <ProtocolSelectorModal
        visible={isModalOpen}
        chainId={chainId}
        feature={feature}
        availableProtocols={availableProtocols}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  compactButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  compactLogo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  protocolName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  protocolType: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  placeholder: {
    flex: 1,
    fontSize: 14,
    color: '#9CA3AF',
  },
  chevron: {
    fontSize: 24,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  stat: {
    flex: 1,
    backgroundColor: '#2D3748',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
