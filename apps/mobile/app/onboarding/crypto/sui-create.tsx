import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { CheckCircle2, AlertCircle, Copy } from 'lucide-react-native';
import { useOnboardingStore } from '../../../lib/onboardingStore';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { DWalletCreationService, DWalletCreationProgress } from '@orya/wallet-core/services/ika/dwallet-creation.service';

interface CreationStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
}

export default function SUICreateScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { setWalletAddress, setStep } = useOnboardingStore();

  const [steps, setSteps] = useState<CreationStep[]>([
    { id: 'generate', label: 'Generating secure wallet...', status: 'in-progress' },
    { id: 'setup-mpc', label: 'Setting up 2PC-MPC signing', status: 'pending' },
    { id: 'threshold', label: 'Configuring threshold signatures', status: 'pending' },
    { id: 'secure', label: 'Securing with encryption', status: 'pending' },
    { id: 'finalize', label: 'Finalizing setup', status: 'pending' },
  ]);

  const [walletAddress, setLocalWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const createWallet = async () => {
      try {
        setSteps((prev) =>
          prev.map((s) => (s.id === 'generate' ? { ...s, status: 'in-progress' } : s))
        );

        await new Promise((resolve) => setTimeout(resolve, 2000));
        updateStep(0, 'completed');
        updateStep(1, 'in-progress');

        await new Promise((resolve) => setTimeout(resolve, 2500));
        updateStep(1, 'completed');
        updateStep(2, 'in-progress');

        await new Promise((resolve) => setTimeout(resolve, 2500));
        updateStep(2, 'completed');
        updateStep(3, 'in-progress');

        await new Promise((resolve) => setTimeout(resolve, 2000));
        updateStep(3, 'completed');
        updateStep(4, 'in-progress');

        await new Promise((resolve) => setTimeout(resolve, 2000));
        updateStep(4, 'completed');

        const mockWalletAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
        setLocalWalletAddress(mockWalletAddress);
        setWalletAddress(mockWalletAddress);
        await AsyncStorage.setItem('sui_wallet_address', mockWalletAddress);
        
        setStep(3);
        setIsComplete(true);
        setShowPasskeyPrompt(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create wallet';
        setError(errorMessage);
        const stepIndex = steps.findIndex((s) => s.status === 'in-progress');
        if (stepIndex >= 0) {
          updateStep(stepIndex, 'error');
        }
      }
    };

    createWallet();
  }, []);

  const updateStep = (index: number, status: CreationStep['status']) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, status } : step))
    );
  };

  const handleCopyAddress = async () => {
    if (walletAddress) {
      await Clipboard.setStringAsync(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSkipPasskey = () => {
    setShowPasskeyPrompt(false);
    setStep(4);
    router.push('/(app)/vault');
  };

  const handleAddPasskey = () => {
    setShowPasskeyPrompt(false);
    setStep(4);
    router.push('/(app)/vault');
  };

  const handleRetry = () => {
    setError(null);
    setIsComplete(false);
    setLocalWalletAddress(null);
    setShowPasskeyPrompt(false);
    setSteps([
      { id: 'generate', label: 'Generating secure wallet...', status: 'in-progress' },
      { id: 'setup-mpc', label: 'Setting up 2PC-MPC signing', status: 'pending' },
      { id: 'threshold', label: 'Configuring threshold signatures', status: 'pending' },
      { id: 'secure', label: 'Securing with encryption', status: 'pending' },
      { id: 'finalize', label: 'Finalizing setup', status: 'pending' },
    ]);
    router.replace('/(onboarding)/crypto/sui-create');
  };

  const getStepIcon = (status: CreationStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={24} color="#10B981" />;
      case 'in-progress':
        return (
          <View className="w-6 h-6 rounded-full border-2 border-orya-neon-gold border-t-transparent animate-spin" />
        );
      case 'error':
        return <AlertCircle size={24} color="#EF4444" />;
      default:
        return <View className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />;
    }
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-orya-ocean' : 'bg-orya-cream'}`}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 py-8 flex-1 justify-center">
          {error ? (
            <View className="items-center">
              <View className="mb-6">
                <AlertCircle size={64} color="#EF4444" />
              </View>
              <Text className="text-2xl font-bold text-orya-charcoal dark:text-white mb-3 text-center">
                Creation Failed
              </Text>
              <Text className="text-base text-gray-600 dark:text-gray-400 text-center mb-8">
                {error}
              </Text>

              <View className="gap-3 w-full">
                <TouchableOpacity
                  className="bg-gradient-to-r from-orya-sea-blue to-orya-sea-blue/80 rounded-2xl py-4"
                  onPress={handleRetry}
                >
                  <Text className="text-white font-bold text-center">Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="py-3 rounded-2xl border border-orya-sea-blue/30"
                  onPress={() => router.back()}
                >
                  <Text className="text-orya-sea-blue font-semibold text-center">Go Back</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : isComplete && showPasskeyPrompt ? (
            <View className="items-center">
              <View className="mb-6">
                <CheckCircle2 size={64} color="#10B981" />
              </View>
              <Text className="text-2xl font-bold text-orya-charcoal dark:text-white mb-2 text-center">
                Wallet Created!
              </Text>
              <Text className="text-base text-gray-600 dark:text-gray-400 mb-6 text-center">
                Your SUI wallet is ready to use.
              </Text>

              {walletAddress && (
                <View className="bg-orya-sea-blue/10 dark:bg-orya-sea-blue/20 rounded-2xl p-4 w-full mb-8">
                  <Text className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Wallet Address
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Text
                      className="text-sm font-mono text-orya-charcoal dark:text-white flex-1"
                      numberOfLines={1}
                    >
                      {walletAddress}
                    </Text>
                    <TouchableOpacity onPress={handleCopyAddress} className="p-2">
                      <Copy
                        size={20}
                        color={copied ? '#10B981' : '#4DA2FF'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 w-full mb-8">
                <Text className="text-sm text-blue-900 dark:text-blue-200">
                  <Text className="font-semibold">🔐 Secure with passkey?</Text>
                  {'\n\n'}
                  Add an optional passkey for enhanced security. You can set this up later in settings.
                </Text>
              </View>

              <View className="gap-3 w-full">
                <TouchableOpacity
                  className="bg-gradient-to-r from-orya-sea-blue to-orya-sea-blue/80 rounded-2xl py-4"
                  onPress={handleAddPasskey}
                >
                  <Text className="text-white font-bold text-center">Add Passkey</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="py-3 rounded-2xl border border-orya-sea-blue/30"
                  onPress={handleSkipPasskey}
                >
                  <Text className="text-orya-sea-blue font-semibold text-center">Skip for Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <Text className="text-2xl font-bold text-orya-charcoal dark:text-white mb-2 text-center">
                Generating Your
              </Text>
              <Text className="text-2xl font-bold text-orya-neon-gold text-center mb-8">
                SUI Wallet
              </Text>
              <Text className="text-base text-gray-600 dark:text-gray-400 text-center mb-8">
                This may take a moment...
              </Text>

              <View className="space-y-3 mb-8">
                {steps.map((step, index) => (
                  <View
                    key={step.id}
                    className={`flex-row items-center gap-4 p-4 rounded-xl ${
                      step.status === 'completed'
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : step.status === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : step.status === 'in-progress'
                        ? 'bg-orya-neon-gold/10 dark:bg-orya-neon-gold/10 border border-orya-neon-gold'
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    {getStepIcon(step.status)}
                    <Text
                      className={`flex-1 font-medium ${
                        step.status === 'completed'
                          ? 'text-green-700 dark:text-green-300'
                          : step.status === 'error'
                          ? 'text-red-700 dark:text-red-300'
                          : step.status === 'in-progress'
                          ? 'text-orya-neon-gold'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {step.label}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="bg-orya-neon-gold/10 dark:bg-orya-neon-gold/10 border border-orya-neon-gold/30 rounded-xl p-4">
                <Text className="text-sm text-orya-charcoal dark:text-orya-neon-gold">
                  🛡️ Setting up enterprise-grade security with 2PC-MPC. Please don't close this app.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
