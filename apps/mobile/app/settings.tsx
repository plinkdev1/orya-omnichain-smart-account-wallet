/**
 * Mobile App Settings Screen
 * 
 * PROMPT D3: Generate Mobile Navigation (React Native)
 * Application and user preferences
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';

export default function SettingsScreen() {
  const { auth, logout } = useAuth();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-orya-cream dark:bg-orya-ocean">
      <ScrollView>
        <View className="px-6 py-6">
          <Text className="text-3xl font-bold text-orya-charcoal dark:text-white mb-1">Settings</Text>
          <Text className="text-gray-600 dark:text-gray-400 mb-6">Manage your preferences</Text>

          {/* Profile Section */}
          <View className="mb-6">
            <Text className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3 uppercase">Profile</Text>
            <View className="bg-white dark:bg-orya-ocean/80 border border-orya-sea-blue/30 dark:border-orya-sea-blue/50 rounded-2xl p-4">
              <View className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</Text>
                <Text className="font-medium text-orya-charcoal dark:text-white">{auth.user?.email || 'Not set'}</Text>
              </View>
              <View>
                <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1">User ID</Text>
                <Text className="font-medium text-orya-charcoal dark:text-white font-mono text-xs">
                  {auth.user?.id?.slice(0, 16) || 'N/A'}...
                </Text>
              </View>
            </View>
          </View>

          {/* Security Section */}
          <View className="mb-6">
            <Text className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3 uppercase">Security</Text>
            <View className="space-y-2">
              <TouchableOpacity className="bg-white dark:bg-orya-ocean/80 border border-orya-sea-blue/30 dark:border-orya-sea-blue/50 p-4 rounded-2xl">
                <Text className="text-orya-charcoal dark:text-white font-medium">Change Password</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-white dark:bg-orya-ocean/80 border border-orya-sea-blue/30 dark:border-orya-sea-blue/50 p-4 rounded-2xl">
                <Text className="text-orya-charcoal dark:text-white font-medium">Enable Two-Factor Auth</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* App Section */}
          <View className="mb-6">
            <Text className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3 uppercase">Application</Text>
            <View className="bg-white dark:bg-orya-ocean/80 border border-orya-sea-blue/30 dark:border-orya-sea-blue/50 rounded-2xl divide-y divide-gray-200 dark:divide-gray-700">
              <View className="flex-row items-center justify-between p-4">
                <Text className="text-orya-charcoal dark:text-white font-medium">Dark Mode</Text>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#ccc', true: '#3b82f6' }}
                  thumbColor={darkMode ? '#1e40af' : '#f5f5f5'}
                />
              </View>
              <View className="flex-row items-center justify-between p-4">
                <Text className="text-orya-charcoal dark:text-white font-medium">Notifications</Text>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#ccc', true: '#3b82f6' }}
                  thumbColor={notifications ? '#1e40af' : '#f5f5f5'}
                />
              </View>
            </View>
          </View>

          {/* Danger Zone */}
          <View className="mb-6">
            <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
              <Text className="text-sm font-bold text-red-900 dark:text-red-300 mb-4 uppercase">Danger Zone</Text>
              <TouchableOpacity
                className="bg-red-600 px-6 py-3 rounded-2xl"
                onPress={handleLogout}
              >
                <Text className="text-white font-bold text-center">Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


