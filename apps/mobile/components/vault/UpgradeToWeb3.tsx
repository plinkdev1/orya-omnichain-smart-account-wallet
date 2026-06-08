import React, { useState } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native'
import { X, Zap, Repeat, Share2, Gift, Grid3x3 } from 'lucide-react-native'
import { useUpgradeWallet } from '@orya/wallet-core'
import { useUserStore } from '../../lib/stores/useUserStore'
import { UserSegment } from '@orya/shared-types'

interface UpgradeToWeb3Props {
  visible: boolean
  onDismiss: () => void
  onSuccess?: () => void
  onRouteToPasskey?: () => void
}

const FEATURES = [
  { icon: Repeat, label: 'Swaps', description: 'Swap tokens across chains' },
  { icon: Share2, label: 'Bridges', description: 'Bridge assets to networks' },
  { icon: Zap, label: 'Staking', description: 'Earn through staking' },
  { icon: Gift, label: 'NFTs', description: 'Manage and trade NFTs' },
  { icon: Grid3x3, label: 'dApps', description: 'Access DeFi applications' },
  { icon: Repeat, label: 'Multisig', description: 'Multi-signature wallets' },
]

export function UpgradeToWeb3({
  visible,
  onDismiss,
  onSuccess,
  onRouteToPasskey,
}: UpgradeToWeb3Props) {
  const { upgrade, loading, error } = useUpgradeWallet()
  const { updateSegment } = useUserStore()
  const [showSuccess, setShowSuccess] = useState(false)

  const handleUpgrade = async () => {
    try {
      const result = await upgrade()
      updateSegment(UserSegment.CRYPTO_NATIVE)
      setShowSuccess(true)

      Alert.alert(
        'Success!',
        "You're ready to explore full Web3 features!",
        [
          {
            text: 'Set Up Passkey (Recommended)',
            onPress: () => {
              onDismiss()
              onRouteToPasskey?.()
            },
          },
          {
            text: 'Continue to Vault',
            onPress: () => {
              onDismiss()
              onSuccess?.()
            },
          },
        ]
      )
    } catch (err) {
      console.error('Upgrade failed:', err)
      Alert.alert(
        'Upgrade Failed',
        error || 'Unable to upgrade your wallet. Please try again.'
      )
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        <View style={styles.backdrop} />

        <ScrollView
          style={styles.modalContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modal}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={onDismiss}
                style={styles.closeButton}
                disabled={loading}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>

              <View style={styles.titleSection}>
                <Text style={styles.emoji}>🚀</Text>
                <Text style={styles.title}>Unlock Full Web3 Mode</Text>
              </View>

              <Text style={styles.description}>
                Get access to DeFi, NFTs, smart accounts, and more. Create your SUI
                wallet to start exploring the full power of crypto.
              </Text>
            </View>

            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>Unlock These Features:</Text>
              <View style={styles.featuresGrid}>
                {FEATURES.map((feature, index) => {
                  const IconComponent = feature.icon
                  return (
                    <View key={index} style={styles.featureCard}>
                      <View style={styles.featureIconContainer}>
                        <IconComponent size={20} color="#0284c7" />
                      </View>
                      <Text style={styles.featureLabel}>{feature.label}</Text>
                      <Text style={styles.featureDescription}>
                        {feature.description}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ✓ Keep your existing Human Network Wallet (HNW)
              </Text>
              <Text style={styles.infoText}>
                ✓ Your new SUI wallet will be added to your vault
              </Text>
              <Text style={styles.infoText}>
                ✓ No logout needed - seamless upgrade
              </Text>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleUpgrade}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.primaryButtonText}>
                    Setting up your Web3 wallet...
                  </Text>
                </>
              ) : (
                <Text style={styles.primaryButtonText}>Upgrade Now</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onDismiss}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Maybe Later</Text>
            </TouchableOpacity>

            <Text style={styles.footer}>
              You can upgrade anytime from Settings
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    maxHeight: '95%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    marginBottom: 24,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 12,
  },
  titleSection: {
    marginBottom: 12,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  featuresGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    justifyContent: 'flex-start',
    minHeight: 100,
  },
  featureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 11,
    color: '#0c7ca8',
    lineHeight: 15,
  },
  infoBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  infoText: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 6,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  errorText: {
    fontSize: 13,
    color: '#991b1b',
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fafbfc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  footer: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
  },
})
