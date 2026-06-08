/**
 * Root Layout with Auth-Aware Routing
 * Enhanced version that uses routing logic to conditionally show screens
 * 
 * Flow:
 * 1. AuthGate shows LoadingScreen while initializing
 * 2. Once ready, routing logic determines what to show:
 *    - Not authenticated: OnboardingStack
 *    - Authenticated but not onboarded: OnboardingFlow
 *    - Authenticated + onboarded: MainStack (Drawer)
 */

import type { RootState } from '@orya/wallet-core/store'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import { Drawer } from 'expo-router/drawer'
import * as SplashScreen from 'expo-splash-screen'
import {
    ArrowLeftRight,
    Award,
    BarChart3,
    Blocks,
    Building2,
    Headphones,
    ImageIcon,
    Network,
    Repeat,
    Settings,
    Sparkles,
    TrendingUp,
    Wallet
} from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { useEffect } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'
import { useAppStore } from '../lib/appStore'
import type { AppRoute } from '../lib/routingLogic'
import { determineRoute, logRoutingDecision } from '../lib/routingLogic'
import ProvidersEnhanced from './providers-enhanced'

SplashScreen.preventAutoHideAsync()

/**
 * Custom Drawer Content
 * Shows navigation menu for authenticated, onboarded users
 */
function CustomDrawerContent(props: any) {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const menuItems = [
    { label: 'Vault', icon: Wallet, href: 'index' },
    { label: 'Link', icon: ArrowLeftRight, href: 'link' },
    { label: 'Flow', icon: Repeat, href: 'flow' },
    { label: 'Insights', icon: BarChart3, href: 'insights' },
    { label: 'Curio', icon: ImageIcon, href: 'curio' },
    { label: 'Grove', icon: TrendingUp, href: 'grove' },
    { label: 'Nexus', icon: Blocks, href: 'nexus' },
    { label: 'Circle', icon: Award, href: 'circle' },
    { label: 'Care', icon: Headphones, href: 'care' },
    { label: 'Suite', icon: Building2, href: 'suite' },
    { label: 'Chains', icon: Network, href: 'chains' },
    { label: 'Atrium', icon: Sparkles, href: 'atrium' },
    { label: 'Settings', icon: Settings, href: 'settings' },
  ]

  return (
    <View className={`flex-1 ${isDark ? 'bg-orya-ocean' : 'bg-orya-cream'} pt-4`}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-orya-sea-blue/30 dark:border-orya-sea-blue/50">
        <Text className="text-2xl font-bold text-orya-charcoal dark:text-white">ORŸA</Text>
        <Text className="text-xs text-gray-600 dark:text-gray-400 mt-1">Digital Wallet</Text>
      </View>

      {/* Menu Items */}
      <View className="flex-1 px-4 py-6">
        {menuItems.map((item, idx) => {
          const Icon = item.icon
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => {
                props.navigation.navigate(item.href || 'index')
                props.navigation.closeDrawer()
              }}
              className={`flex-row items-center px-4 py-3 rounded-2xl mb-2 ${
                isDark ? 'bg-orya-ocean/50 active:bg-orya-sea-blue/30' : 'bg-orya-aqua/20 active:bg-orya-aqua/40'
              }`}
            >
              <View className={`w-10 h-10 rounded-xl items-center justify-center ${isDark ? 'bg-orya-sea-blue/20' : 'bg-orya-aqua/30'}`}>
                <Icon size={18} color={isDark ? '#FFD700' : '#4DA2FF'} />
              </View>
              <Text className={`ml-3 font-semibold text-base ${isDark ? 'text-white' : 'text-orya-charcoal'}`}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Footer */}
      <View className={`px-6 py-4 border-t ${isDark ? 'border-orya-sea-blue/30' : 'border-orya-sea-blue/30'}`}>
        <Text className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          ORŸA v1.0.0
        </Text>
      </View>
    </View>
  )
}

/**
 * Main Stack (Drawer Navigation)
 * Shown to authenticated, onboarded users
 */
function MainStack() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        sceneContainerStyle: {
          backgroundColor: '#030F1C',
        },
      }}
      drawerContent={CustomDrawerContent}
    >
      <Drawer.Screen name="index" options={{ title: 'Vault' }} />
      <Drawer.Screen name="link" options={{ title: 'Link' }} />
      <Drawer.Screen name="flow" options={{ title: 'Flow' }} />
      <Drawer.Screen name="insights" options={{ title: 'Insights' }} />
      <Drawer.Screen name="curio" options={{ title: 'Curio' }} />
      <Drawer.Screen name="grove" options={{ title: 'Grove' }} />
      <Drawer.Screen name="nexus" options={{ title: 'Nexus' }} />
      <Drawer.Screen name="circle" options={{ title: 'Circle' }} />
      <Drawer.Screen name="care" options={{ title: 'Care' }} />
      <Drawer.Screen name="suite" options={{ title: 'Suite' }} />
      <Drawer.Screen name="chains" options={{ title: 'Chains' }} />
      <Drawer.Screen name="atrium" options={{ title: 'Atrium' }} />
      <Drawer.Screen name="settings" options={{ title: 'Settings' }} />
    </Drawer>
  )
}

/**
 * Onboarding Stack
 * Shown to unauthenticated or not-yet-onboarded users
 */
function OnboardingStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
    </Stack>
  )
}

/**
 * Root Layout Component
 * Auth-aware routing based on authentication state
 */
function RootLayoutContent() {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [loaded] = useFonts({
    inter: require('../assets/fonts/Inter-Regular.ttf'),
    'inter-tight': require('../assets/fonts/Inter-Tight-Bold.ttf'),
  })

  // Get auth state from Redux
  const reduxAuth = useSelector((state: RootState) => state.auth)

  // Get state from Zustand
  const { isAuthReady, onboardingComplete } = useAppStore()

  // Determine current route based on state
  const currentRoute: AppRoute = determineRoute(
    !isAuthReady,
    reduxAuth.isAuthenticated,
    onboardingComplete,
    reduxAuth.error || undefined
  )

  // Log routing decision for debugging
  useEffect(() => {
    logRoutingDecision(
      {
        currentRoute,
        isLoading: !isAuthReady,
        isAuthenticated: reduxAuth.isAuthenticated,
        onboardingComplete,
        error: reduxAuth.error || undefined,
      },
      currentRoute
    )
  }, [currentRoute, isAuthReady, reduxAuth.isAuthenticated, onboardingComplete, reduxAuth.error])

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  // AuthGate handles loading and error screens, so by the time we're here:
  // - isAuthReady should be true
  // - We can render either MainStack or OnboardingStack

  if (!isAuthReady) {
    // This should be handled by AuthGate, but as a safety net
    return null
  }

  return (
    <>
      {reduxAuth.isAuthenticated && onboardingComplete ? (
        <MainStack />
      ) : (
        <OnboardingStack />
      )}
    </>
  )
}

/**
 * Root Layout Export
 * Wraps with all providers
 */
export default function RootLayout() {
  return (
    <ProvidersEnhanced>
      <RootLayoutContent />
    </ProvidersEnhanced>
  )
}