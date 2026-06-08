'use client';

import { useRouter } from 'expo-router';
import { SafeAreaView, Text, TouchableOpacity, View, ScrollView, ActivityIndicator, TextInput, Alert, Linking } from 'react-native';
import { useColorScheme } from 'nativewind';
import { QrCode, Zap, AlertCircle } from 'lucide-react-native';
import { useState } from 'react';
import { useOnboardingStore } from '@/lib/onboardingStore';
import { createWalletConnectRedirectUri } from '@/lib/deepLinking';

type Step = 'options' | 'uri-input' | 'connecting';

const POPULAR_WALLETS = [
  { name: 'Phantom', icon: '👻', description: 'Solana & Ethereum' },
  { name: 'MetaMask', icon: '🦊', description: 'Ethereum & EVM chains' },
  { name: 'OKX Wallet', icon: '🐂', description: 'Multi-chain support' },
  { name: 'Ledger Live', icon: '💾', description: 'Hardware wallet' },
  { name: 'WalletConnect', icon: '🔗', description: 'Any WalletConnect wallet' },
  { name: 'Privy', icon: '🔐', description: 'Social recovery' },
];

export default function WalletConnectScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { setWalletAddress, setAuthMethod, setFlow } = useOnboardingStore();

  const [currentStep, setCurrentStep] = useState<Step>('options');
  const [uriInput, setUriInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const validateURI = (): boolean => {
    if (!uriInput.trim()) {
      setError('Please enter a WalletConnect URI');
      return false;
    }

    if (!uriInput.startsWith('wc:')) {
      setError('Please enter a valid WalletConnect URI (starts with wc:)');
      return false;
    }

    return true;
  };

  const handleManualURI = () => {
    setCurrentStep('uri-input');
    setError(null);
  };

  const handleWalletSelection = async (walletName: string) => {
    setSelectedWallet(walletName);
    
    const redirectUri = createWalletConnectRedirectUri();
    
    const walletUrls: Record<string, string> = {
      'Phantom': `https://phantom.app/ul/browse/${encodeURIComponent(`https://orya.app/connect?redirect=${redirectUri}`)}`,
      'MetaMask': `https://metamask.app.link/dapp/orya.app/connect?redirect=${encodeURIComponent(redirectUri)}`,
      'OKX Wallet': `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(`https://orya.app/connect?redirect=${redirectUri}`)}`,
      'Ledger Live': `ledgerlive://discover?url=${encodeURIComponent(`https://orya.app/connect?redirect=${redirectUri}`)}`,
      'WalletConnect': `wc:`,
      'Privy': `https://privy.io/connect?redirect=${encodeURIComponent(redirectUri)}`,
    };

    const walletUrl = walletUrls[walletName];
    
    if (walletUrl) {
      try {
        const canOpen = await Linking.canOpenURL(walletUrl);
        if (canOpen) {
          await Linking.openURL(walletUrl);
          Alert.alert(
            'Wallet Opening',
            `${walletName} should open now. Please approve the connection and you'll be redirected back automatically.`,
            [
              { text: 'Cancel', onPress: () => setSelectedWallet(null), style: 'cancel' },
            ]
          );
        } else {
          Alert.alert(
            'Wallet Not Found',
            `${walletName} is not installed on your device. Please install it first.`,
            [
              { text: 'OK', onPress: () => setSelectedWallet(null) },
            ]
          );
        }
      } catch (error) {
        console.error('[WalletConnect] Error opening wallet:', error);
        Alert.alert(
          'Error',
          `Failed to open ${walletName}. Please try again.`,
          [
            { text: 'OK', onPress: () => setSelectedWallet(null) },
          ]
        );
      }
    } else {
      Alert.alert(
        'Open Wallet',
        `Please open ${walletName} on your device and follow the prompts to connect your wallet.`,
        [
          { text: 'Cancel', onPress: () => setSelectedWallet(null), style: 'cancel' },
          { text: 'Connected', onPress: () => handleWalletConnect(walletName) },
        ]
      );
    }
  };

  const simulateWalletConnection = async () => {
    return new Promise((resolve) => setTimeout(resolve, 3000));
  };

  const handleWalletConnect = async (walletName: string) => {
    try {
      setIsProcessing(true);
      setCurrentStep('connecting');
      setError(null);

      const projectId = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID;
      if (!projectId) {
        throw new Error('WalletConnect project ID not configured');
      }

      await simulateWalletConnection();

      const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);

      setWalletAddress(mockAddress);
      setAuthMethod('connect');
      setFlow('connect-external');

      router.push('/onboarding/external/confirm');
    } catch (err) {
      console.error('[WalletConnect] Error:', err);
      setError('Failed to connect to wallet. Please try again.');
      setCurrentStep('options');
      setSelectedWallet(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnectURI = async () => {
    if (!validateURI()) return;

    try {
      setIsProcessing(true);
      setCurrentStep('connecting');
      setError(null);

      const projectId = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID;
      if (!projectId) {
        throw new Error('WalletConnect project ID not configured');
      }

      await simulateWalletConnection();

      const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);

      setWalletAddress(mockAddress);
      setAuthMethod('connect');
      setFlow('connect-external');

      router.push('/onboarding/external/confirm');
    } catch (err) {
      console.error('[WalletConnect] URI connection error:', err);
      setError('Failed to connect to wallet. Please check the URI and try again.');
      setCurrentStep('uri-input');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'options') {
      router.back();
    } else if (currentStep === 'uri-input') {
      setCurrentStep('options');
      setUriInput('');
      setError(null);
    } else if (currentStep === 'connecting') {
      return;
    }
  };

  const bgColor = isDark ? 'bg-orya-ocean' : 'bg-orya-cream';
  const textColor = isDark ? 'text-white' : 'text-orya-charcoal';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <ScrollView className="flex-1">
        <View className="px-6 py-8">
          {currentStep === 'options' && (
            <>
              <View className="mb-8">
                <TouchableOpacity
                  onPress={handleBack}
                  className="mb-4"
                >
                  <Text className="text-orya-sea-blue font-semibold">← Back</Text>
                </TouchableOpacity>
                <Text className={`text-3xl font-bold ${textColor} mb-3`}>
                  Connect your wallet
                </Text>
                <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Choose a wallet to connect via WalletConnect
                </Text>
              </View>

              <View className="mb-8">
                <Text className={`text-sm font-semibold ${textColor} mb-4`}>Popular Wallets</Text>
                <View className="gap-3">
                  {POPULAR_WALLETS.map((wallet) => (
                    <TouchableOpacity
                      key={wallet.name}
                      disabled={isProcessing}
                      onPress={() => handleWalletSelection(wallet.name)}
                      className={`p-4 rounded-2xl border-2 flex-row items-center gap-4 ${cardBg} ${borderColor} border`}
                    >
                      <Text className="text-4xl">{wallet.icon}</Text>
                      <View className="flex-1">
                        <Text className={`text-lg font-semibold ${textColor}`}>
                          {wallet.name}
                        </Text>
                        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {wallet.description}
                        </Text>
                      </View>
                      <Text className="text-orya-sea-blue">→</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <View className="flex-row gap-3">
                  <AlertCircle size={20} color={isDark ? '#93c5fd' : '#1e40af'} />
                  <Text className={`flex-1 text-sm ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                    Never share your private key or seed phrase with any wallet.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleManualURI}
                className={`p-4 rounded-xl border-2 ${borderColor} border flex-row items-center gap-3`}
              >
                <Zap size={24} color="#4DA2FF" />
                <View className="flex-1">
                  <Text className={`font-semibold ${textColor}`}>Enter URI Manually</Text>
                  <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Paste a WalletConnect URI
                  </Text>
                </View>
              </TouchableOpacity>

              <View className="mt-6 p-4 rounded-xl bg-gray-100 dark:bg-gray-700/30">
                <View className="flex-row items-center gap-2 mb-2">
                  <QrCode size={16} color="#4DA2FF" />
                  <Text className={`text-sm font-semibold ${textColor}`}>WalletConnect Certified</Text>
                </View>
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  All wallets are certified by WalletConnect for maximum security.
                </Text>
              </View>
            </>
          )}

          {currentStep === 'uri-input' && (
            <>
              <View className="mb-8">
                <TouchableOpacity
                  disabled={isProcessing}
                  onPress={handleBack}
                  className="mb-4"
                >
                  <Text className="text-orya-sea-blue font-semibold">← Back</Text>
                </TouchableOpacity>
                <Text className={`text-2xl font-bold ${textColor} mb-2`}>
                  Enter WalletConnect URI
                </Text>
                <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Paste the WalletConnect URI from your wallet
                </Text>
              </View>

              <View className="mb-6">
                <TextInput
                  value={uriInput}
                  onChangeText={(text) => {
                    setUriInput(text);
                    setError(null);
                  }}
                  placeholder="wc:a1b2c3d4..."
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  multiline={true}
                  editable={!isProcessing}
                  numberOfLines={5}
                  className={`p-4 rounded-xl border-2 ${borderColor} border font-mono text-sm ${
                    isDark ? 'bg-gray-900 text-white' : 'bg-white text-orya-charcoal'
                  }`}
                />
              </View>

              {error && (
                <View className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex-row gap-3">
                  <AlertCircle size={20} color={isDark ? '#fca5a5' : '#dc2626'} />
                  <Text className={`flex-1 text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                    {error}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleConnectURI}
                disabled={isProcessing}
                className={`py-4 rounded-2xl mb-3 ${
                  isProcessing
                    ? 'bg-gray-400'
                    : 'bg-gradient-to-r from-orya-sea-blue to-orya-sea-blue/80'
                }`}
              >
                <Text className="text-white font-bold text-center">
                  {isProcessing ? 'Connecting...' : 'Connect'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCurrentStep('options')}
                disabled={isProcessing}
                className={`py-3 rounded-2xl border-2 ${borderColor} border`}
              >
                <Text className="text-orya-sea-blue font-semibold text-center">Back</Text>
              </TouchableOpacity>
            </>
          )}

          {currentStep === 'connecting' && (
            <View className="flex-1 justify-center items-center py-20">
              <ActivityIndicator size="large" color="#4DA2FF" className="mb-8" />
              <Text className={`text-2xl font-bold ${textColor} text-center mb-2`}>
                Connecting to Wallet...
              </Text>
              <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'} text-center`}>
                Please approve the connection in your wallet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
