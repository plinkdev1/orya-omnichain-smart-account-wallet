import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { CreditCard, Globe, Zap, ChevronRight } from 'lucide-react-native';
import { useOnboardingStore } from '../../../lib/onboardingStore';

export default function CardSetupScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { setStep, completeStep } = useOnboardingStore();
  const [setupLoading, setSetupLoading] = useState(false);

  const handleCardSetup = async () => {
    try {
      setSetupLoading(true);
      setStep(2);

      await new Promise((resolve) => setTimeout(resolve, 800));

      completeStep(2);

      router.push('/onboarding/normie/biometric-setup');
    } catch (err) {
      console.error('Card setup error:', err);
      setSetupLoading(false);
    }
  };

  const handleSkip = () => {
    setStep(2);
    completeStep(2);
    router.push('/onboarding/normie/biometric-setup');
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-orya-ocean' : 'bg-orya-cream'}`}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-6 py-8 flex-1">
          <View className="mb-8">
            <View className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orya-sea-blue/20 to-orya-neon-gold/20 items-center justify-center mb-6">
              <CreditCard size={40} color="#4DA2FF" />
            </View>
            <Text className="text-3xl font-bold text-orya-charcoal dark:text-white mb-3">
              Ready to spend?
            </Text>
            <Text className="text-base text-gray-600 dark:text-gray-400">
              Set up your ORŸA card for instant payments anywhere
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
              <View className="flex-row items-center gap-3 mb-2">
                <Globe size={20} color="#FFD700" />
                <Text className="font-semibold text-orya-charcoal dark:text-white">
                  30+ Countries
                </Text>
              </View>
              <Text className="text-sm text-gray-600 dark:text-gray-400 ml-8">
                Spend in any currency, anywhere
              </Text>
            </View>

            <View
              className={`p-4 rounded-2xl border-2 ${
                isDark
                  ? 'bg-orya-ocean/50 border-orya-sea-blue/20'
                  : 'bg-white border-orya-sea-blue/10'
              }`}
            >
              <View className="flex-row items-center gap-3 mb-2">
                <Zap size={20} color="#4DA2FF" />
                <Text className="font-semibold text-orya-charcoal dark:text-white">
                  Instant Issuance
                </Text>
              </View>
              <Text className="text-sm text-gray-600 dark:text-gray-400 ml-8">
                Virtual card ready to use immediately
              </Text>
            </View>
          </View>

          <View className="gap-3 mt-auto">
            <TouchableOpacity
              onPress={handleCardSetup}
              disabled={setupLoading}
              className="bg-gradient-to-r from-orya-sea-blue to-orya-sea-blue/80 rounded-2xl py-4 flex-row items-center justify-center gap-2"
            >
              {setupLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Text className="text-white font-bold text-center flex-1">
                    Set up card now
                  </Text>
                  <ChevronRight size={20} color="white" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSkip}
              disabled={setupLoading}
              className="py-4 rounded-2xl border-2 border-orya-sea-blue/30"
            >
              <Text className="text-orya-sea-blue font-semibold text-center">
                I'll set up later
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mt-6 pt-4">
            <Text className="text-xs text-gray-600 dark:text-gray-400 text-center">
              Card setup is optional. You can use your wallet without a card.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
