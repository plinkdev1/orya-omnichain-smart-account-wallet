/**
 * Mobile App Home Screen
 * 
 * PROMPT D3: Generate Mobile Navigation (React Native)
 * Entry point for authenticated users
 */

import { Link, useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useCopy } from '../hooks/useCopy';

export default function HomeScreen() {
  const { isAuthenticated, loading } = useAuth();
  const copy = useCopy();
  const router = useRouter();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-orya-cream dark:bg-orya-ocean">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600 dark:text-gray-300">{copy.status?.loading || "Loading..."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-orya-cream dark:bg-orya-ocean">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-2xl font-bold text-orya-charcoal dark:text-white mb-4">{copy.auth?.welcome || "Welcome to ORŸA"}</Text>
          <Text className="text-gray-600 dark:text-gray-400 text-center mb-6">{copy.auth?.pleaseLogin || "Please log in to continue"}</Text>
          <TouchableOpacity
            className="bg-orya-sea-blue px-6 py-3 rounded-2xl mb-3 shadow-lg active:shadow-xl active:scale-95 transition-all"
            onPress={() => router.push('/login')}
          >
            <Text className="text-white font-bold text-center">{copy.actions?.login || "Login"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-orya-aqua dark:bg-orya-ocean px-6 py-3 rounded-2xl shadow-lg active:shadow-xl active:scale-95 transition-all"
            onPress={() => router.push('/onboarding')}
          >
            <Text className="text-orya-charcoal dark:text-white font-bold text-center">{copy.actions?.signUp || "Sign Up"}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-orya-cream dark:bg-orya-ocean">
      <ScrollView className="flex-1">
        <View className="px-6 py-6">
          <Text className="text-3xl font-bold text-orya-charcoal dark:text-white mb-2">{copy.nav?.home || "Home"}</Text>
          <Text className="text-gray-600 dark:text-gray-400 mb-6">{copy.auth?.welcomeBack || "Welcome back to ORŸA Wallet"}</Text>

          {/* Discover Section */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-orya-charcoal dark:text-white mb-3">{copy.home?.discover || "Discover"}</Text>
            <View className="flex-row flex-wrap justify-between">
              <TouchableOpacity className="w-[48%] p-4 bg-orya-aqua/20 dark:bg-orya-sea-blue/20 rounded-2xl mb-3 border border-orya-sea-blue/30 dark:border-orya-sea-blue/50">
                <Text className="text-2xl mb-2">🌐</Text>
                <Text className="font-semibold text-sm text-orya-charcoal dark:text-white">{copy.home?.exploreDApps?.split(' ')[0] || "Explore"}</Text>
                <Text className="text-xs text-gray-600 dark:text-gray-400 mt-1">{copy.home?.exploreDApps?.split(' ')[1] || "dApps"}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="w-[48%] p-4 bg-orya-sea-blue/10 dark:bg-orya-sea-blue/20 rounded-2xl mb-3 border border-orya-sea-blue/30 dark:border-orya-sea-blue/50">
                <Text className="text-2xl mb-2">🎁</Text>
                <Text className="font-semibold text-sm text-orya-charcoal dark:text-white">{copy.home?.offers || "Offers"}</Text>
                <Text className="text-xs text-gray-600 dark:text-gray-400 mt-1">{copy.home?.deals || "Deals"}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="w-[48%] p-4 bg-orya-sea-blue/15 dark:bg-orya-sea-blue/20 rounded-2xl mb-3 border border-orya-sea-blue/30 dark:border-orya-sea-blue/50">
                <Text className="text-2xl mb-2">💎</Text>
                <Text className="font-semibold text-sm text-orya-charcoal dark:text-white">{copy.home?.assets || "Assets"}</Text>
                <Text className="text-xs text-gray-600 dark:text-gray-400 mt-1">{copy.home?.tokens || "Tokens"}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="w-[48%] p-4 bg-orya-sea-blue/10 dark:bg-orya-sea-blue/20 rounded-2xl mb-3 border border-orya-sea-blue/30 dark:border-orya-sea-blue/50">
                <Text className="text-2xl mb-2">📢</Text>
                <Text className="font-semibold text-sm text-orya-charcoal dark:text-white">{copy.home?.campaigns || "Campaigns"}</Text>
                <Text className="text-xs text-gray-600 dark:text-gray-400 mt-1">{copy.home?.promo || "Promo"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="space-y-3">
            <Link href="/vault" asChild>
              <TouchableOpacity className="bg-white dark:bg-orya-ocean border border-orya-sea-blue/30 dark:border-orya-sea-blue/50 p-4 rounded-2xl mb-3 shadow-md">
                <Text className="font-bold text-orya-charcoal dark:text-white">{copy.nav?.vault || "Vault"}</Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400">{copy.home?.vaultDescription || "Portfolio overview"}</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/portfolio" asChild>
              <TouchableOpacity className="bg-white dark:bg-orya-ocean border border-orya-sea-blue/30 dark:border-orya-sea-blue/50 p-4 rounded-2xl mb-3 shadow-md">
                <Text className="font-bold text-orya-charcoal dark:text-white">{copy.nav?.portfolio || "Portfolio"}</Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400">{copy.home?.portfolioDescription || "Detailed analytics"}</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/transactions" asChild>
              <TouchableOpacity className="bg-white dark:bg-orya-ocean border border-orya-sea-blue/30 dark:border-orya-sea-blue/50 p-4 rounded-2xl mb-3 shadow-md">
                <Text className="font-bold text-orya-charcoal dark:text-white">{copy.nav?.transactions || "Transactions"}</Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400">{copy.home?.transactionsDescription || "Transaction history"}</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/settings" asChild>
              <TouchableOpacity className="bg-white dark:bg-orya-ocean border border-orya-sea-blue/30 dark:border-orya-sea-blue/50 p-4 rounded-2xl shadow-md">
                <Text className="font-bold text-orya-charcoal dark:text-white">{copy.nav?.settings || "Settings"}</Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400">{copy.home?.settingsDescription || "Manage preferences"}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

