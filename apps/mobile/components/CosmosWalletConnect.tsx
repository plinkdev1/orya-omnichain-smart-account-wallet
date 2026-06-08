import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { getProviderRegistry } from '@orya/wallet-core';
import type { CosmosStandardAdapter } from '@orya/wallet-core/src/standards/cosmos-standard';

interface CosmosWallet {
  name: string;
  logo: string;
  type: string;
}

interface CosmosWalletConnectProps {
  onConnect?: (account: any) => void;
  onError?: (error: Error) => void;
  chain?: string;
}

export const CosmosWalletConnect: React.FC<CosmosWalletConnectProps> = ({
  onConnect,
  onError,
  chain = 'cosmoshub-4',
}) => {
  const [wallets, setWallets] = useState<CosmosWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [adapter, setAdapter] = useState<CosmosStandardAdapter | null>(null);

  useEffect(() => {
    initializeProvider();
  }, []);

  const initializeProvider = async () => {
    try {
      const registry = getProviderRegistry();
      const provider = registry.getProvider('cosmos');
      
      if (provider) {
        setAdapter(provider.instance);
        
        const supported = [
          { name: 'Keplr', logo: '🔑', type: 'keplr' },
          { name: 'Leap', logo: '🦘', type: 'leap' },
          { name: 'Cosmostation', logo: '🌌', type: 'cosmostation' },
          { name: 'Wallet Connect', logo: '🔗', type: 'walletconnect' },
          { name: 'ORYA Native', logo: '⚡', type: 'orya' },
        ];
        setWallets(supported);
      }
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const connectWallet = async (walletType: string) => {
    if (!adapter) return;

    setLoading(true);
    try {
      const connection = await adapter.connect();
      setConnected(true);
      setSelectedAccount(adapter.account);
      setShowWalletModal(false);
      
      onConnect?.(adapter.account);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    if (!adapter) return;

    try {
      await adapter.disconnect();
      setConnected(false);
      setSelectedAccount(null);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (connected && selectedAccount) {
    return (
      <View style={styles.container}>
        <View style={styles.connectedCard}>
          <Text style={styles.connectedLabel}>Connected to Cosmos</Text>
          <Text style={styles.address} numberOfLines={1}>
            {selectedAccount.address}
          </Text>
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={disconnect}
          >
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.connectButton}
        onPress={() => setShowWalletModal(true)}
      >
        <Text style={styles.buttonText}>Connect Cosmos Wallet</Text>
      </TouchableOpacity>

      <Modal
        visible={showWalletModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowWalletModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Wallet</Text>

            <FlatList
              data={wallets}
              keyExtractor={(item) => item.type}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.walletOption}
                  onPress={() => connectWallet(item.type)}
                >
                  <Text style={styles.walletLogo}>{item.logo}</Text>
                  <Text style={styles.walletName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowWalletModal(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  connectButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectedCard: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0284c7',
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
  },
  connectedLabel: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  address: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  disconnectButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '50%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    color: '#000',
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  walletLogo: {
    fontSize: 24,
    marginRight: 12,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  closeButton: {
    backgroundColor: '#e5e7eb',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
  },
});
