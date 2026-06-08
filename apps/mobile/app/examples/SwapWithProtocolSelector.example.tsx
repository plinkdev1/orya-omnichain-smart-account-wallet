/**
 * Example: Swap Screen with Protocol Selector (Mobile)
 * 
 * This example shows how to integrate the ProtocolSelector component
 * into a mobile feature screen like Swap, Staking, or Yields.
 * 
 * Key patterns:
 * 1. Import the ProtocolSelectorButton component
 * 2. Use the component to let users select protocols
 * 3. Store the selected protocol in your screen state
 * 4. Pass available protocols specific to that feature/chain
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Protocol, ChainId, FeatureType } from '@orya/wallet-core';
import { ProtocolSelectorButton } from '../components/ProtocolSelector';

// Mock data - replace with actual protocol data from your API
const SWAP_PROTOCOLS: Protocol[] = [
  {
    id: 'sui-aftermath-swap',
    name: 'Aftermath Finance',
    logo: '🌊',
    apy: 8.5,
    tvl: '$3.5M',
    fee: '0.3%',
    isAudited: true,
    auditors: ['CertiK', 'MoveBit'],
    securityRating: 92,
    isPreferred: true,
    type: 'aggregator',
    description: 'DEX aggregator with best price routing',
    chain: 'sui' as ChainId,
    features: ['swap'],
  },
  {
    id: 'sui-cetus-swap',
    name: 'Cetus Protocol',
    logo: '🐋',
    apy: 9.2,
    tvl: '$7.0M',
    fee: '0.35%',
    isAudited: true,
    auditors: ['MoveBit', 'OtterSec'],
    securityRating: 90,
    isPreferred: false,
    type: 'dex',
    description: 'Concentrated liquidity DEX on SUI',
    chain: 'sui' as ChainId,
    features: ['swap'],
  },
  {
    id: 'sui-deepbook-swap',
    name: 'DeepBook',
    logo: '📖',
    apy: 7.8,
    tvl: '$5.2M',
    fee: '0.25%',
    isAudited: true,
    auditors: ['Trail of Bits'],
    securityRating: 88,
    isPreferred: false,
    type: 'orderbook',
    description: 'Native SUI orderbook protocol',
    chain: 'sui' as ChainId,
    features: ['swap'],
  },
];

export default function SwapWithProtocolSelector() {
  const [selectedProtocolId, setSelectedProtocolId] = useState<string | undefined>(
    SWAP_PROTOCOLS[0]?.id
  );
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromToken, setFromToken] = useState('SUI');
  const [toToken, setToToken] = useState('USDC');

  const chainId = 'sui' as ChainId;
  const feature = 'swap' as FeatureType;

  const selectedProtocol = SWAP_PROTOCOLS.find((p) => p.id === selectedProtocolId);

  const handleSwap = async () => {
    if (!fromAmount || !toAmount || !selectedProtocol) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    console.log('Executing swap with protocol:', {
      protocol: selectedProtocol.name,
      from: fromAmount,
      fromToken,
      to: toAmount,
      toToken,
    });

    try {
      Alert.alert('Success', `Swap executed using ${selectedProtocol.name}`);
    } catch (error) {
      console.error('Swap failed:', error);
      Alert.alert('Error', 'Swap failed. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Swap</Text>
        <Text style={styles.subtitle}>Exchange tokens across supported protocols</Text>
      </View>

      {/* Protocol Selector */}
      <View style={styles.section}>
        <ProtocolSelectorButton
          chainId={chainId}
          feature={feature}
          availableProtocols={SWAP_PROTOCOLS}
          label="Swap Protocol"
          onSelect={setSelectedProtocolId}
        />

        {selectedProtocol && (
          <LinearGradient
            colors={['#2D3748', '#1F2937']}
            style={styles.protocolInfo}
          >
            <View style={styles.protocolInfoRow}>
              <View>
                <Text style={styles.protocolInfoLabel}>Fee</Text>
                <Text style={styles.protocolInfoValue}>{selectedProtocol.fee}</Text>
              </View>
              <View>
                <Text style={styles.protocolInfoLabel}>Security</Text>
                <Text style={[styles.protocolInfoValue, styles.protocolInfoGreen]}>
                  {selectedProtocol.securityRating}/100
                </Text>
              </View>
            </View>
          </LinearGradient>
        )}
      </View>

      {/* Swap Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Swap Details</Text>

        <View style={styles.tokenInput}>
          <Text style={styles.label}>From</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              value={fromAmount}
              onChangeText={setFromAmount}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity style={styles.tokenSelector}>
              <Text style={styles.tokenSelectorText}>{fromToken}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.swapButton}>
          <Text style={styles.swapButtonText}>⇅</Text>
        </TouchableOpacity>

        <View style={styles.tokenInput}>
          <Text style={styles.label}>To</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              value={toAmount}
              onChangeText={setToAmount}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity style={styles.tokenSelector}>
              <Text style={styles.tokenSelectorText}>{toToken}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSwap}
          style={styles.submitButton}
        >
          <LinearGradient
            colors={['#8B5CF6', '#6D28D9']}
            style={styles.submitButtonGradient}
          >
            <Text style={styles.submitButtonText}>
              Swap with {selectedProtocol?.name || 'Protocol'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 Tip</Text>
        <Text style={styles.infoText}>
          Use the protocol selector to compare different DEXes and choose the best rates and security ratings for your swap.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  section: {
    padding: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  protocolInfo: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
  },
  protocolInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  protocolInfoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  protocolInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  protocolInfoGreen: {
    color: '#10B981',
  },
  tokenInput: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
  },
  tokenSelector: {
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
    minWidth: 80,
  },
  tokenSelectorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  swapButton: {
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  swapButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  submitButton: {
    marginTop: 16,
    overflow: 'hidden',
    borderRadius: 12,
  },
  submitButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    marginHorizontal: 16,
    backgroundColor: '#1E3A8A20',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 12,
    padding: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#93C5FD',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#BFDBFE',
    lineHeight: 18,
  },
});
