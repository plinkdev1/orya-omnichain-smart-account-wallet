/**
 * Mobile App Login Screen
 * 
 * PROMPT D3: Generate Mobile Navigation (React Native)
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useCopy } from '../hooks/useCopy';

export default function LoginScreen() {
  const { login, loading, error, isAuthenticated } = useAuth();
  const copy = useCopy();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  if (isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-orya-cream dark:bg-orya-ocean">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-2xl font-bold text-orya-charcoal dark:text-white mb-4">{copy.login?.alreadyLoggedIn || "Already Logged In"}</Text>
          <TouchableOpacity
            className="bg-orya-sea-blue px-6 py-3 rounded-2xl shadow-lg active:shadow-xl active:scale-95 transition-all"
            onPress={() => router.replace('/')}
          >
            <Text className="text-white font-bold text-center">{copy.login?.goToHome || "Go to Home"}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogin = async () => {
    try {
      await login(email, password);
      router.replace('/');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-orya-cream dark:bg-orya-ocean">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center px-6 py-6">
          <Text className="text-3xl font-bold text-orya-charcoal dark:text-white mb-2">{copy.login?.title || "Login"}</Text>
          <Text className="text-gray-600 dark:text-gray-400 mb-6">{copy.login?.subtitle || "Sign in to your account"}</Text>

          {error && (
            <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-4">
              <Text className="text-red-700 dark:text-red-300 text-sm">{error}</Text>
            </View>
          )}

          <View className="mb-4">
            <Text className="text-sm font-medium text-orya-charcoal dark:text-white mb-2">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              editable={!loading}
              className="border border-orya-sea-blue/30 dark:border-orya-sea-blue/50 rounded-2xl px-4 py-3 bg-white dark:bg-orya-ocean/80 text-orya-charcoal dark:text-white"
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-orya-charcoal dark:text-white mb-2">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#999"
              secureTextEntry
              editable={!loading}
              className="border border-orya-sea-blue/30 dark:border-orya-sea-blue/50 rounded-2xl px-4 py-3 bg-white dark:bg-orya-ocean/80 text-orya-charcoal dark:text-white"
            />
          </View>

          <TouchableOpacity
            className="bg-orya-sea-blue px-6 py-3 rounded-2xl mb-4 shadow-lg active:shadow-xl active:scale-95 transition-all"
            onPress={handleLogin}
            disabled={loading}
          >
            <Text className="text-white font-bold text-center">{loading ? 'Logging in...' : 'Login'}</Text>
          </TouchableOpacity>

          <View className="border-t border-orya-sea-blue/30 dark:border-orya-sea-blue/50 pt-4">
            <Text className="text-center text-gray-600 dark:text-gray-400 mb-3">
              Don't have an account?
            </Text>
            <TouchableOpacity
              className="bg-orya-aqua dark:bg-orya-ocean px-6 py-3 rounded-2xl shadow-lg active:shadow-xl active:scale-95 transition-all"
              onPress={() => router.push('/onboarding')}
            >
              <Text className="text-orya-charcoal dark:text-white font-bold text-center">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
