import { useFonts } from 'expo-font'
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
import ProvidersEnhanced from './providers-enhanced'
import AppKitModal from '@/components/AppKitModal'
import { subscribeToDeepLinks, handleDeepLink } from '@/lib/deepLinking'

SplashScreen.preventAutoHideAsync()

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

export default function RootLayout() {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  
  const [loaded] = useFonts({
    inter: require('../assets/fonts/Inter-Regular.ttf'),
    'inter-tight': require('../assets/fonts/Inter-Tight-Bold.ttf'),
  })

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  useEffect(() => {
    const unsubscribe = subscribeToDeepLinks((url) => {
      handleDeepLink(url)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  if (!loaded) {
    return null
  }

  return (
    <ProvidersEnhanced>
      <Drawer
        screenOptions={{
          headerShown: false,
          drawerType: 'front',
          sceneContainerStyle: {
            backgroundColor: isDark ? '#030F1C' : '#FDFCF7',
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
        <Drawer.Screen name="onboarding" options={{ title: 'Onboarding' }} />
      </Drawer>
      <AppKitModal />
    </ProvidersEnhanced>
  )
}
