import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Fingerprint } from 'lucide-react-native';

interface PasskeyPromptProps {
  userId: string;
  walletAddress: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function PasskeyPrompt({
  userId,
  walletAddress,
  onComplete,
  onSkip,
}: PasskeyPromptProps) {
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipCount, setSkipCount] = useState(0);
  const [biometricSupported, setBiometricSupported] = useState(false);

  useEffect(() => {
    initializeBiometric();
    loadSkipCount();
  }, []);

  const initializeBiometric = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricSupported(compatible && enrolled);
    } catch (err) {
      console.error('Biometric check error:', err);
      setBiometricSupported(false);
    }
  };

  const loadSkipCount = async () => {
    try {
      const count = await AsyncStorage.getItem('passkey_skip_count');
      const skipCount = count ? parseInt(count, 10) : 0;
      setSkipCount(skipCount);

      if (skipCount >= 10) {
        setVisible(false);
      }
    } catch (err) {
      console.error('Skip count error:', err);
    }
  };

  const setupPasskey = async () => {
    if (!biometricSupported) {
      Alert.alert(
        'Biometric Not Available',
        'Your device does not support biometric authentication. Please set up a supported authenticator.'
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Authenticate user
      const result = await LocalAuthentication.authenticateAsync({
        reason: 'Set up passkey for transaction approval',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        throw new Error('Biometric authentication failed');
      }

      // Request challenge from backend
      const challengeResponse = await fetch('/api/passkey/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, walletAddress }),
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to get challenge from server');
      }

      const { challenge } = await challengeResponse.json();

      // Register passkey with backend
      const registerResponse = await fetch('/api/passkey/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          walletAddress,
          credential: {
            id: `mobile-${userId}-${Date.now()}`,
            rawId: challenge,
            response: {
              clientDataJSON: challenge,
              attestationObject: challenge,
            },
          },
        }),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(
          errorData.message || 'Failed to register passkey on server'
        );
      }

      const result2 = await registerResponse.json();

      if (result2.success) {
        await AsyncStorage.removeItem('passkey_skip_count');
        setVisible(false);
        onComplete?.();

        Alert.alert(
          'Success',
          'Passkey set up successfully! Your biometric will be required to approve transactions.'
        );
      } else {
        throw new Error(result2.message || 'Registration failed');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to set up passkey';
      setError(message);
      console.error('[PasskeyPrompt] Setup error:', err);

      Alert.alert('Setup Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    const newCount = skipCount + 1;
    setSkipCount(newCount);

    try {
      await AsyncStorage.setItem(
        'passkey_skip_count',
        newCount.toString()
      );

      if (newCount >= 3) {
        Alert.alert(
          'Security Recommendation',
          'We strongly recommend setting up a Passkey for enhanced security. You can enable it anytime in Settings.'
        );
      }

      if (newCount >= 10) {
        setVisible(false);
      } else {
        setVisible(false);
      }

      onSkip?.();
    } catch (err) {
      console.error('Skip error:', err);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.container}>
        <View style={styles.backdrop} />
        <View style={styles.modal}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Fingerprint color="#C4A574" size={24} />
              </View>
              <Text style={styles.title}>🔐 Add Extra Security</Text>
            </View>

            {/* Description */}
            <Text style={styles.description}>
              Use your fingerprint or face to approve transactions. This adds an
              extra security layer (4th factor) beyond your 3 MPC shards.
            </Text>

            {/* Error */}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Benefits */}
            <View style={styles.benefits}>
              <View style={styles.benefit}>
                <Text style={styles.bulletPoint}>✓</Text>
                <Text style={styles.benefitText}>Biometric authentication</Text>
              </View>
              <View style={styles.benefit}>
                <Text style={styles.bulletPoint}>✓</Text>
                <Text style={styles.benefitText}>
                  Never leaves your device
                </Text>
              </View>
              <View style={styles.benefit}>
                <Text style={styles.bulletPoint}>✓</Text>
                <Text style={styles.benefitText}>Industry-standard WebAuthn</Text>
              </View>
            </View>

            {/* Buttons */}
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={setupPasskey}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#2a2a2a" size="small" />
              ) : (
                <>
                  <Fingerprint color="#2a2a2a" size={18} />
                  <Text style={styles.primaryButtonText}>Set Up Passkey</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleSkip}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Skip for Now</Text>
            </TouchableOpacity>

            {/* Footer */}
            <Text style={styles.footer}>
              You can enable this anytime in Settings
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '85%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(196, 165, 116, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2a2a2a',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  errorText: {
    fontSize: 12,
    color: '#991b1b',
  },
  benefits: {
    marginBottom: 24,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#C4A574',
    marginRight: 8,
    marginTop: 2,
  },
  benefitText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#C4A574',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2a2a2a',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2a2a2a',
  },
  footer: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
  },
});
