import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native'
import { Star, X } from 'lucide-react-native'
import { UserSegment } from '@orya/shared-types'

interface UnlockPromptProps {
  visible: boolean
  segment: UserSegment
  onDismiss: () => void
  onUpgrade?: () => void
}

const SEGMENT_CONFIG = {
  [UserSegment.NORMIE]: {
    icon: Star,
    title: '🚀 Unlock Crypto Features',
    description:
      'Upgrade your account to access advanced trading features like Swap, Bridge, and Staking.',
    features: [
      'Swap tokens across chains',
      'Bridge assets to other networks',
      'Earn through staking',
      'Full DeFi access',
    ],
    ctaText: 'Upgrade Account',
    color: '#3B82F6',
  },
  [UserSegment.CRYPTO_NATIVE]: {
    icon: Star,
    title: '✨ Your SUI Wallet Ready',
    description:
      "You've unlocked the full power of crypto. All features are now available on your SUI wallet.",
    features: [
      'Full token swap access',
      'Cross-chain bridging',
      'Staking and yield farming',
      'NFT management',
    ],
    ctaText: 'Get Started',
    color: '#06B6D4',
  },
  [UserSegment.INSTITUTIONAL]: {
    icon: Star,
    title: '🏢 Suite Activated',
    description:
      'Your institutional suite is fully configured with enterprise-grade features and analytics.',
    features: [
      'Multi-signature approvals',
      'Advanced analytics',
      'Audit logs',
      'Risk management tools',
    ],
    ctaText: 'Explore Suite',
    color: '#8B5CF6',
  },
}

export function UnlockPrompt({
  visible,
  segment,
  onDismiss,
  onUpgrade,
}: UnlockPromptProps) {
  const [slideAnim] = useState(new Animated.Value(1))
  const config = SEGMENT_CONFIG[segment]

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 12,
        bounciness: 8,
      }).start()
    }
  }, [visible])

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss()
    })
  }

  const slideTransform = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 500],
  })

  const IconComponent = config.icon

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.container}>
        <View style={styles.backdrop} />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideTransform }],
            },
          ]}
        >
          <View
            style={[
              styles.modal,
              { borderTopColor: config.color },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={handleDismiss}
                  style={styles.closeButton}
                >
                  <X size={24} color="#6b7280" />
                </TouchableOpacity>

                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${config.color}20` },
                  ]}
                >
                  <IconComponent size={32} color={config.color} />
                </View>

                <Text style={styles.title}>{config.title}</Text>
              </View>

              <Text style={styles.description}>{config.description}</Text>

              <View style={styles.features}>
                {config.features.map((feature, index) => (
                  <View key={index} style={styles.feature}>
                    <View
                      style={[
                        styles.featureDot,
                        { backgroundColor: config.color },
                      ]}
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: config.color },
                ]}
                onPress={() => {
                  onUpgrade?.()
                  handleDismiss()
                }}
              >
                <Text style={styles.primaryButtonText}>
                  {config.ctaText}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleDismiss}
              >
                <Text style={styles.secondaryButtonText}>Maybe Later</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  content: {
    padding: 24,
    paddingTop: 16,
  },
  header: {
    marginBottom: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 20,
  },
  features: {
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
    flexShrink: 0,
  },
  featureText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    flex: 1,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
})
