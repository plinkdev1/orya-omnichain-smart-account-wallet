import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { Mail, Apple, Chrome, Phone } from 'lucide-react-native';
import { useOnboardingStore } from '../../../lib/onboardingStore';
import SocialLoginButton from '../../../components/onboarding/SocialLoginButton';

let usePrivy: any;

try {
  const privyModule = require('@privy-io/react-auth');
  usePrivy = privyModule.usePrivy;
} catch (err) {
  console.warn('Privy not available in this environment. Using fallback.');
  usePrivy = () => ({
    login: async () => {
      throw new Error('Privy provider not configured. Please set up PrivyProvider.');
    },
  });
}

export default function SocialLoginScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const privyHooks = usePrivy?.();
  const login = privyHooks?.login;
  const { setAuthMethod, setLoading, setError, error: storeError } = useOnboardingStore();

  const [loadingMethod, setLoadingMethod] = useState<string | null>(null);
  const [buttonErrors, setButtonErrors] = useState<Record<string, string>>({});

  const handleLogin = async (method: 'google' | 'apple' | 'email' | 'phone') => {
    try {
      setLoadingMethod(method);
      setButtonErrors((prev) => ({ ...prev, [method]: '' }));
      setLoading(true);

      if (!login) {
        throw new Error('Login method not available. Privy provider may not be configured.');
      }

      await login({
        loginMethods: [method],
      });

      setAuthMethod(method);
      setLoading(false);
      setLoadingMethod(null);

      router.push('/onboarding/normie/card-setup');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : `${method} sign-in failed`;
      setButtonErrors((prev) => ({ ...prev, [method]: errorMessage }));
      setError(errorMessage);
      setLoading(false);
      setLoadingMethod(null);
    }
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-orya-ocean' : 'bg-orya-cream'}`}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-6 py-8 flex-1">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-orya-charcoal dark:text-white mb-3">
              Sign in to your ORŸA wallet
            </Text>
            <Text className="text-base text-gray-600 dark:text-gray-400">
              Fast, secure, and private. Choose your preferred method.
            </Text>
          </View>

          <View className="gap-3 flex-1">
            <SocialLoginButton
              label="Google"
              icon={Chrome}
              iconColor="#4DA2FF"
              onPress={() => handleLogin('google')}
              loading={loadingMethod === 'google'}
              error={buttonErrors.google}
            />

            <SocialLoginButton
              label="Apple"
              icon={Apple}
              iconColor={isDark ? '#FFD700' : '#000000'}
              onPress={() => handleLogin('apple')}
              loading={loadingMethod === 'apple'}
              error={buttonErrors.apple}
            />

            <SocialLoginButton
              label="Email"
              icon={Mail}
              iconColor="#FFD700"
              onPress={() => handleLogin('email')}
              loading={loadingMethod === 'email'}
              error={buttonErrors.email}
            />

            <SocialLoginButton
              label="Phone"
              icon={Phone}
              iconColor="#4DA2FF"
              onPress={() => handleLogin('phone')}
              loading={loadingMethod === 'phone'}
              error={buttonErrors.phone}
            />
          </View>

          {storeError && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
              <Text className="text-red-600 dark:text-red-400 text-sm">
                {storeError}
              </Text>
            </View>
          )}

          <View className="mt-6 pt-6 border-t border-orya-sea-blue/20">
            <Text className="text-xs text-gray-600 dark:text-gray-400 text-center mb-4">
              By signing in, you agree to our Terms of Service and Privacy
              Policy
            </Text>

            <TouchableOpacity
              onPress={() => router.back()}
              className="py-3"
            >
              <Text className="text-center text-orya-sea-blue font-semibold">
                Back
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
