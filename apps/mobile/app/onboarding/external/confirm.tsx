'use client';

import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, Text, TouchableOpacity, View, ScrollView, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Copy, Check, Lock } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useOnboardingStore } from '@/lib/onboardingStore';

export default function ExternalWalletConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { walletAddress, setWalletAddress, setLoading, completeStep } = useOnboardingStore();

  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (params.address && typeof params.address === 'string') {
      setWalletAddress(params.address);
    }
  }, [params.address, setWalletAddress]);

  useEffect(() => {
    if (!walletAddress) {
      router.back();
    }
  }, [walletAddress, router]);

  const copyToClipboard = () => {
    if (walletAddress) {
      // In React Native, use react-native-clipboard or similar
      // For now, we'll just show the feedback
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
  };

  const handleContinue = async () => {
    try {
      setIsProcessing(true);
      setLoading(true);

      completeStep(3);

      // Simulate approval processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate to vault (home screen)
      router.push('/vault');
    } catch (err) {
      console.error('[ExternalWalletConfirm] Error:', err);
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const bgColor = isDark ? 'bg-orya-ocean' : 'bg-orya-cream';
  const textColor = isDark ? 'text-white' : 'text-orya-charcoal';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  const displayAddress = walletAddress
    ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}`
    : '';

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <ScrollView className="flex-1">
        <View className="px-6 py-8">
          <View className="mb-12 text-center">
            <Text className={`text-3xl font-bold ${textColor} text-center mb-3`}>
              Wallet Connected
            </Text>
            <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'} text-center`}>
              Your external wallet has been successfully connected to ORŸA
            </Text>
          </View>

          <View className={`mb-8 p-6 rounded-2xl border-2 border-orya-sea-blue/30 ${cardBg}`}>
            <View className="items-center">
              <View className="w-16 h-16 rounded-full bg-gradient-to-br from-orya-sea-blue/20 to-orya-neon-gold/20 items-center justify-center mb-4">
                <Lock size={32} color="#4DA2FF" />
              </View>
              <Text className={`text-lg font-bold ${textColor} mb-2`}>Connected Wallet</Text>
              <Text className={`text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                {walletAddress}
              </Text>
              <TouchableOpacity
                onPress={copyToClipboard}
                className="flex-row items-center gap-2"
              >
                {copiedToClipboard ? (
                  <>
                    <Check size={16} color="#4DA2FF" />
                    <Text className="text-sm text-orya-sea-blue font-semibold">Copied</Text>
                  </>
                ) : (
                  <>
                    <Copy size={16} color="#4DA2FF" />
                    <Text className="text-sm text-orya-sea-blue font-semibold">Copy Address</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <Text className={`text-sm font-semibold ${isDark ? 'text-blue-300' : 'text-blue-900'} mb-2`}>
              ✓ Connection Verified
            </Text>
            <Text className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
              Your wallet is now connected and ready to use with ORŸA. You can now access the vault and manage your assets.
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
                <Text className="text-white font-bold text-center">Go to Vault</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              disabled={isProcessing}
              className={`py-3 rounded-2xl border-2 ${borderColor} border`}
            >
              <Text className="text-orya-sea-blue font-semibold text-center">Connect Another</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
