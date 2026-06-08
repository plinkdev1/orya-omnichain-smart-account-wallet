import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { Protocol, FeatureType, ChainId } from '@orya/wallet-core';
import { getSUIProtocolsByFeature, getDefaultSUIProtocol } from '@orya/wallet-core/data/sui-protocols';
import { ProtocolSelectorButton } from '@/components/ProtocolSelector';

interface SUISwapExampleProps {
  defaultChainId?: ChainId;
  defaultFeature?: FeatureType;
}

export default function SUISwapExample({
  defaultChainId = 'sui',
  defaultFeature = 'swap',
}: SUISwapExampleProps) {
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>();
  const [fromAmount, setFromAmount] = useState('1');
  const [toAmount, setToAmount] = useState('');

  const availableProtocols = getSUIProtocolsByFeature(defaultFeature);
  const defaultProtocol = getDefaultSUIProtocol(defaultFeature);
  const selectedProtocol = availableProtocols.find(
    p => p.id === (selectedProtocolId || defaultProtocol?.id)
  );

  const handleSwap = async () => {
    if (!selectedProtocol) return;

    console.log(`Swapping ${fromAmount} SUI using ${selectedProtocol.name}`);

    setTimeout(() => {
      const mockOutput = parseFloat(fromAmount) * 2.5;
      setToAmount(mockOutput.toFixed(6));
    }, 1000);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Swap on SUI</Text>
          <Text style={styles.subtitle}>
            Exchange tokens using your preferred protocol
          </Text>
        </View>

        {/* Protocol Selector */}
        <View style={styles.selectorContainer}>
          <ProtocolSelectorButton
            chainId={defaultChainId}
            feature={defaultFeature}
            availableProtocols={availableProtocols}
            label="Swap Protocol"
            onSelect={setSelectedProtocolId}
          />
        </View>

        {/* Protocol Details */}
        {selectedProtocol && (
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Provider</Text>
              <Text style={styles.detailValue}>{selectedProtocol.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fee</Text>
              <Text style={styles.detailValue}>{selectedProtocol.fee}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Security Rating</Text>
              <View style={styles.securityBadge}>
                <Text style={styles.detailValue}>
                  {selectedProtocol.securityRating}/100
                </Text>
                {selectedProtocol.isAudited && (
                  <Text style={styles.auditedBadge}>Audited</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Swap Form */}
        <View style={styles.formContainer}>
          {/* From */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>From</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={fromAmount}
                onChangeText={setFromAmount}
                placeholder="0.00"
                placeholderTextColor="#cbd5e1"
                keyboardType="decimal-pad"
              />
              <Text style={styles.token}>SUI</Text>
            </View>
          </View>

          {/* Swap Arrow */}
          <TouchableOpacity
            style={styles.swapButton}
            onPress={() => {
              setFromAmount(toAmount);
              setToAmount(fromAmount);
            }}
          >
            <Text style={styles.swapArrow}>⇅</Text>
          </TouchableOpacity>

          {/* To */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>To (Estimated)</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={toAmount}
                onChangeText={setToAmount}
                placeholder="0.00"
                placeholderTextColor="#cbd5e1"
                keyboardType="decimal-pad"
                editable={false}
              />
              <Text style={styles.token}>USDC</Text>
            </View>
          </View>
        </View>

        {/* Swap Button */}
        <TouchableOpacity
          style={[
            styles.swapActionButton,
            (!selectedProtocol || !fromAmount) && styles.swapActionButtonDisabled,
          ]}
          onPress={handleSwap}
          disabled={!selectedProtocol || !fromAmount}
        >
          <Text style={styles.swapActionButtonText}>
            {selectedProtocol ? 'Swap' : 'Select Protocol'}
          </Text>
        </TouchableOpacity>

        {/* Info Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This example demonstrates protocol selection with {availableProtocols.length} SUI protocols
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  card: {
    margin: 16,
    padding: 24,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  selectorContainer: {
    marginBottom: 24,
  },
  detailsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  auditedBadge: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 18,
  },
  token: {
    color: '#94a3b8',
    fontWeight: '600',
    marginLeft: 8,
  },
  swapButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    marginVertical: 12,
  },
  swapArrow: {
    fontSize: 20,
  },
  swapActionButton: {
    backgroundColor: '#a855f7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  swapActionButtonDisabled: {
    backgroundColor: '#475569',
  },
  swapActionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
