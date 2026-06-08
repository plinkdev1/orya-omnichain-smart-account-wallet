import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'nativewind';
import { CheckCircle2, Lock, BarChart3, Users, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { useOnboardingStore, UserSegment } from '../../../lib/onboardingStore';

interface FeatureItem {
  icon: any;
  title: string;
  description: string;
}

export default function InstitutionalSuiteConfirmScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { setLoading, completeStep, setUserSegment } = useOnboardingStore();

  const [isProcessing, setIsProcessing] = useState(false);

  const features: FeatureItem[] = [
    {
      icon: Lock,
      title: 'Multi-sig Treasury',
      description: 'Secure multi-signature approvals for all transactions',
    },
    {
      icon: BarChart3,
      title: 'Audit Logs',
      description: 'Complete transaction history and compliance reporting',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Real-time portfolio and transaction analytics',
    },
    {
      icon: Users,
      title: 'Role-based Controls',
      description: 'Fine-grained permission management for team members',
    },
  ];

  const handleContinue = async () => {
    try {
      setIsProcessing(true);
      setLoading(true);

      completeStep(4);
      setUserSegment(UserSegment.INSTITUTIONAL);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      router.push('/vault');
    } catch (err) {
      console.error('[InstitutionalSuiteConfirm] Error:', err);
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const bgColor = isDark ? 'bg-orya-ocean' : 'bg-orya-cream';
  const textColor = isDark ? 'text-white' : 'text-orya-charcoal';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const featureBg = isDark ? 'bg-gray-900' : 'bg-gray-50';

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-6 py-8">
          <View className="mb-12 items-center">
            <View className="w-24 h-24 rounded-full bg-gradient-to-br from-orya-sea-blue/20 to-orya-neon-gold/20 items-center justify-center mb-6">
              <CheckCircle2 size={48} color="#FFD700" />
            </View>
            <Text className={`text-3xl font-bold ${textColor} text-center mb-3`}>
              Institutional Suite Activated
            </Text>
            <Text className={`text-base text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Your KYB verification is complete
            </Text>
          </View>

          <View className="mb-8">
            <Text className={`text-lg font-bold ${textColor} mb-4`}>
              Suite Features
            </Text>

            {features.map((feature, index) => (
              <View
                key={index}
                className={`flex-row gap-4 p-4 mb-3 rounded-xl ${featureBg} border border-gray-200 dark:border-gray-700`}
              >
                <View className="w-12 h-12 rounded-lg bg-gradient-to-br from-orya-sea-blue/20 to-orya-neon-gold/20 items-center justify-center">
                  <feature.icon size={24} color="#4DA2FF" />
                </View>
                <View className="flex-1">
                  <Text className={`font-semibold ${textColor} mb-1`}>
                    {feature.title}
                  </Text>
                  <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View className="mb-8 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <View className="flex-row items-center gap-2 mb-2">
              <CheckCircle2 size={18} color="#10B981" />
              <Text className={`font-semibold ${isDark ? 'text-green-300' : 'text-green-900'}`}>
                Verification Approved
              </Text>
            </View>
            <Text className={`text-sm ${isDark ? 'text-green-200' : 'text-green-800'}`}>
              Your KYB information has been verified. All institutional features are now active.
            </Text>
          </View>

          <View className="gap-3">
            <TouchableOpacity
              onPress={handleContinue}
              disabled={isProcessing}
              className={`py-4 rounded-2xl ${
                isProcessing
                  ? 'bg-gray-400'
                  : 'bg-gradient-to-r from-orya-sea-blue to-orya-sea-blue/80'
              }`}
            >
              {isProcessing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-center">Continue to Vault</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/onboarding/intro')}
              disabled={isProcessing}
              className="py-3 rounded-2xl border-2 border-orya-sea-blue/30"
            >
              <Text className="text-orya-sea-blue font-semibold text-center">View Overview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
