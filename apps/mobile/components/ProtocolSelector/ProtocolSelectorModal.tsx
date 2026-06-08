import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Switch,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import type { Protocol, FeatureType, ChainId } from '@orya/wallet-core';
import { useProtocolSelection } from '@orya/wallet-core';

const { width, height } = Dimensions.get('window');

interface ProtocolSelectorModalProps {
  visible: boolean;
  chainId: ChainId;
  feature: FeatureType;
  availableProtocols: Protocol[];
  onClose: () => void;
  onSelect: (protocolId: string) => void;
}

export default function ProtocolSelectorModal({
  visible,
  chainId,
  feature,
  availableProtocols,
  onClose,
  onSelect,
}: ProtocolSelectorModalProps) {
  const [compareMode, setCompareMode] = useState(false);
  const { selectedProtocol, selectProtocol, loading, error, setAvailableProtocols } =
    useProtocolSelection(chainId, feature, availableProtocols);

  useEffect(() => {
    setAvailableProtocols(availableProtocols);
  }, [availableProtocols, setAvailableProtocols]);

  const handleSelect = async (protocolId: string) => {
    try {
      await selectProtocol(protocolId);
      onSelect(protocolId);
      onClose();
    } catch (err) {
      console.error('Failed to select protocol:', err);
    }
  };

  const ProtocolCard = ({ protocol }: { protocol: Protocol }) => (
    <TouchableOpacity
      style={[
        styles.protocolCard,
        protocol.id === selectedProtocol?.id && styles.protocolCardSelected,
      ]}
      onPress={() => handleSelect(protocol.id)}
      activeOpacity={0.7}
    >
      <View style={styles.protocolHeader}>
        <View style={styles.protocolInfo}>
          <LinearGradient
            colors={['#8B5CF6', '#3B82F6']}
            style={styles.protocolLogo}
          >
            <Text style={styles.protocolLogoText}>{protocol.logo}</Text>
          </LinearGradient>

          <View style={styles.protocolDetails}>
            <View style={styles.protocolTitleRow}>
              <Text style={styles.protocolName}>{protocol.name}</Text>
              {protocol.id === selectedProtocol?.id && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.protocolDescription}>{protocol.description}</Text>
            <View style={styles.protocolTags}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{protocol.type}</Text>
              </View>
              {protocol.isAudited && (
                <View style={[styles.tag, styles.tagAudited]}>
                  <Text style={styles.tagText}>✓ Audited</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>APY</Text>
          <Text style={styles.statValue}>{protocol.apy || 'N/A'}%</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>TVL</Text>
          <Text style={styles.statValue}>{protocol.tvl}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Fee</Text>
          <Text style={styles.statValue}>{protocol.fee}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Security</Text>
          <Text style={styles.statValue}>{protocol.securityRating}</Text>
        </View>
      </View>

      {protocol.isAudited && (
        <View style={styles.auditorsRow}>
          <Text style={styles.auditorsLabel}>Audited by:</Text>
          <Text style={styles.auditorsText}>{protocol.auditors.join(', ')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const ComparisonTable = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.comparisonTable}>
        <View style={styles.comparisonHeader}>
          <Text style={[styles.comparisonHeaderCell, { width: 120 }]}>Protocol</Text>
          <Text style={[styles.comparisonHeaderCell, { width: 70 }]}>APY</Text>
          <Text style={[styles.comparisonHeaderCell, { width: 70 }]}>TVL</Text>
          <Text style={[styles.comparisonHeaderCell, { width: 70 }]}>Fee</Text>
          <Text style={[styles.comparisonHeaderCell, { width: 80 }]}>Security</Text>
        </View>

        {availableProtocols.map((protocol) => (
          <TouchableOpacity
            key={protocol.id}
            style={[
              styles.comparisonRow,
              protocol.id === selectedProtocol?.id && styles.comparisonRowSelected,
            ]}
            onPress={() => handleSelect(protocol.id)}
          >
            <View style={[styles.comparisonProtocolCell, { width: 120 }]}>
              <Text style={styles.protocolLogoText}>{protocol.logo}</Text>
              <Text style={styles.comparisonProtocolName}>{protocol.name}</Text>
            </View>
            <Text style={[styles.comparisonCell, { width: 70 }]}>{protocol.apy || 'N/A'}%</Text>
            <Text style={[styles.comparisonCell, { width: 70 }]}>{protocol.tvl}</Text>
            <Text style={[styles.comparisonCell, { width: 70 }]}>{protocol.fee}</Text>
            <Text style={[styles.comparisonCell, { width: 80 }]}>{protocol.securityRating}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <BlurView intensity={80} style={styles.modalOverlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Select Protocol</Text>
                <Text style={styles.headerSubtitle}>
                  {feature} on {chainId}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.compareModeRow}>
              <Text style={styles.compareModeLabel}>Compare Mode</Text>
              <Switch
                value={compareMode}
                onValueChange={setCompareMode}
                trackColor={{ false: '#374151', true: '#8B5CF6' }}
                thumbColor={compareMode ? '#fff' : '#9CA3AF'}
              />
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.loadingText}>Loading protocols...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
              >
                {compareMode ? (
                  <ComparisonTable />
                ) : (
                  <View style={styles.protocolList}>
                    {availableProtocols.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No protocols available</Text>
                      </View>
                    ) : (
                      availableProtocols.map((protocol) => (
                        <ProtocolCard key={protocol.id} protocol={protocol} />
                      ))
                    )}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flex: 1,
    maxHeight: height * 0.9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  compareModeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  compareModeLabel: {
    color: '#D1D5DB',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  protocolList: {
    padding: 16,
  },
  protocolCard: {
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  protocolCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#4C1D95',
  },
  protocolHeader: {
    marginBottom: 12,
  },
  protocolInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  protocolLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  protocolLogoText: {
    fontSize: 28,
  },
  protocolDetails: {
    flex: 1,
  },
  protocolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  protocolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  protocolDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  protocolTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#4B5563',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagAudited: {
    backgroundColor: '#065F46',
  },
  tagText: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  auditorsRow: {
    borderTopWidth: 1,
    borderTopColor: '#4B5563',
    paddingTop: 12,
  },
  auditorsLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  auditorsText: {
    fontSize: 12,
    color: '#10B981',
  },
  comparisonTable: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
    margin: 16,
  },
  comparisonHeader: {
    flexDirection: 'row',
    backgroundColor: '#2D3748',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  comparisonHeaderCell: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
    paddingHorizontal: 4,
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  comparisonRowSelected: {
    backgroundColor: '#4C1D95',
  },
  comparisonProtocolCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  comparisonProtocolName: {
    fontSize: 12,
    color: '#D1D5DB',
    marginLeft: 4,
  },
  comparisonCell: {
    fontSize: 12,
    color: '#D1D5DB',
    paddingHorizontal: 4,
  },
});
