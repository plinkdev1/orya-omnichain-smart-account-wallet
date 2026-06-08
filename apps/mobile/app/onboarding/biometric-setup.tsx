import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { Fingerprint, ChevronRight } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useOnboardingStore } from '../../lib/onboardingStore';

export default function BiometricSetupScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { setStep, completeStep } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleEnableBiometric = async () => {
    try {
      setIsLoading(true);
      setStep(3);

      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        Alert.alert(
          'Not Supported',
          'Biometric authentication is not available on this device.'
        );
        setIsLoading(false);
        completeStep(3);
        router.push('/vault');
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert(
          'No Biometrics Enrolled',
          'Please set up biometric authentication in your device settings first.'
        );
        setIsLoading(false);
        completeStep(3);
        router.push('/vault');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        fallbackLabel: 'Use device passcode',
      });

      if (result.success) {
        completeStep(3);
        router.push('/vault');
      } else {
        setIsLoading(false);
        Alert.alert(
          'Biometric Setup Failed',
          'Could not enable biometric authentication. Please try again.'
        );
      }
    } catch (err) {
      console.error('Biometric setup error:', err);
      setIsLoading(false);
      Alert.alert('Error', 'An error occurred during biometric setup.');
    }
  };

  const handleSkip = () => {
    setStep(3);
    completeStep(3);
    router.push('/vault');
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-orya-ocean' : 'bg-orya-cream'}`}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-6 py-8 flex-1">
          <View className="mb-8">
            <View className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orya-sea-blue/20 to-orya-neon-gold/20 items-center justify-center mb-6">
              <Fingerprint size={40} color="#4DA2FF" />
            </View>
            <Text className="text-3xl font-bold text-orya-charcoal dark:text-white mb-3">
              Secure your wallet
            </Text>
            <Text className="text-base text-gray-600 dark:text-gray-400">
              Unlock with biometric, no password needed
            </Text>
          </View>

          <View className="gap-4 mb-8 flex-1">
            <View
              className={`p-4 rounded-2xl border-2 ${
                isDark
                  ? 'bg-orya-ocean/50 border-orya-sea-blue/20'
                  : 'bg-white border-orya-sea-blue/10'
              }`}
            >
              <Text className="text-sm font-semibold text-orya-charcoal dark:text-white mb-2">
                ✓ Lightning-fast access
              </Text>
              <Text className="text-xs text-gray-600 dark:text-gray-400">
                Open your wallet instantly with your fingerprint or face
              </Text>
            </View>

            <View
              className={`p-4 rounded-2xl border-2 ${
                isDark
                  ? 'bg-orya-ocean/50 border-orya-sea-blue/20'
                  : 'bg-white border-orya-sea-blue/10'
              }`}
            >
              <Text className="text-sm font-semibold text-orya-charcoal dark:text-white mb-2">
                ✓ Military-grade security
              </Text>
              <Text className="text-xs text-gray-600 dark:text-gray-400">
                Your biometric data never leaves your device
              </Text>
            </View>

            <View
              className={`p-4 rounded-2xl border-2 ${
                isDark
                  ? 'bg-orya-ocean/50 border-orya-sea-blue/20'
                  : 'bg-white border-orya-sea-blue/10'
              }`}
            >
              <Text className="text-sm font-semibold text-orya-charcoal dark:text-white mb-2">
                ✓ Extra protection
              </Text>
              <Text className="text-xs text-gray-600 dark:text-gray-400">
                Requires authentication for sensitive transactions
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="px-6 py-6 gap-3">
        <TouchableOpacity
          onPress={handleEnableBiometric}
          disabled={isLoading}
          className="flex-row items-center justify-center bg-gradient-to-r from-orya-sea-blue to-orya-sea-blue/80 rounded-2xl py-4 shadow-lg disabled:opacity-50"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white font-bold text-center flex-1">
                Enable Now
              </Text>
              <ChevronRight size={20} color="white" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSkip}
          disabled={isLoading}
          className="py-3 rounded-2xl border border-orya-sea-blue/30 disabled:opacity-50"
        >
          <Text className="text-center text-orya-sea-blue font-semibold">
            Maybe Later
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
