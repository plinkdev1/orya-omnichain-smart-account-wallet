import { useRouter } from 'expo-router'
import {
    ArrowLeft,
    ArrowRight,
    BarChart4,
    Bell,
    Building,
    FileText,
    Gift,
    GitMerge,
    Landmark,
    Layers,
    Menu,
    Palette,
    Shield,
    Sparkles,
    TrendingUp,
    Users,
    Vault,
} from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import {
    FlatList,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import type { Feature } from '../../types/data'

const ATRIUM_FEATURES = [
  { id: 'vaultline', name: 'Vaultline', desc: 'Real-world assets', icon: Landmark, color: '#d97706' },
  { id: 'horizon', name: 'Horizon', desc: 'Equity portfolio', icon: TrendingUp, color: '#0ea5e9' },
  { id: 'fragment', name: 'Fragment', desc: 'Fractional shares', icon: Layers, color: '#a855f7' },
  { id: 'panorama', name: 'Panorama', desc: 'ETF dashboard', icon: BarChart4, color: '#10b981' },
  { id: 'estate', name: 'Estate', desc: 'Real estate', icon: Building, color: '#f97316' },
  { id: 'atelier', name: 'Atelier', desc: 'Private equity', icon: Palette, color: '#6366f1' },
  { id: 'ledger', name: 'Ledger', desc: 'Fixed income', icon: FileText, color: '#64748b' },
  { id: 'conflux', name: 'Conflux', desc: 'Hybrid DeFi', icon: GitMerge, color: '#06b6d4' },
  { id: 'haven', name: 'Haven', desc: 'Savings', icon: Vault, color: '#14b8a6' },
  { id: 'curator', name: 'Curator', desc: 'Robo-advisory', icon: Sparkles, color: '#eab308' },
  { id: 'beacon', name: 'Beacon', desc: 'Alerts', icon: Bell, color: '#f59e0b' },
  { id: 'lumen', name: 'Lumen', desc: 'Rewards', icon: Gift, color: '#ec4899' },
  { id: 'shield', name: 'Shield', desc: 'Insurance', icon: Shield, color: '#3b82f6' },
  { id: 'forum', name: 'Forum', desc: 'Governance', icon: Users, color: '#a78bfa' },
]

export default function AtriumScreen() {
  const { colorScheme } = useColorScheme()
  const router = useRouter()
  const isDark = colorScheme === 'dark'

  const bgColor = isDark ? 'bg-slate-900' : 'bg-slate-50'
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white'
  const textColor = isDark ? 'text-slate-50' : 'text-slate-900'
  const mutedColor = isDark ? 'text-slate-400' : 'text-slate-500'

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={isDark ? '#64748b' : '#64748b'} />
        </TouchableOpacity>
        <View>
          <Text className={`text-2xl font-bold ${textColor}`}>Atrium</Text>
          <Text className={`${mutedColor} text-xs`}>Investment portal</Text>
        </View>
        <TouchableOpacity>
          <Menu size={24} color={isDark ? '#64748b' : '#64748b'} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={ATRIUM_FEATURES}
        keyExtractor={(item: Feature) => item.id}
        scrollEnabled
        numColumns={1}
        ListHeaderComponent={
          <View className="px-4 pt-4">
            {/* Hero */}
            <View className={`${cardBg} p-4 rounded-2xl mb-6`}>
              <View className="flex-row items-center gap-3 mb-3">
                <Sparkles size={24} color="#D4C29E" />
                <View className="flex-1">
                  <Text className={`text-lg font-bold ${textColor}`}>Welcome to Atrium</Text>
                  <Text className={`${mutedColor} text-xs`}>Sophisticated investments</Text>
                </View>
              </View>
              <Text className={`${mutedColor} text-xs leading-4`}>
                Explore curated investment opportunities across real-world assets, equities, DeFi, and more.
              </Text>
            </View>
            <Text className={`font-bold text-lg ${textColor} px-4 mb-3`}>Premium Features</Text>
          </View>
        }
        renderItem={({ item }: { item: Feature }) => {
          const Icon = item.icon
          return (
            <View className="px-4 mb-3">
              <TouchableOpacity
                onPress={() => router.push(item.id as any)}
                className={`${cardBg} p-4 rounded-2xl flex-row items-center`}
              >
                <View
                  className="w-14 h-14 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: item.color + '20' }}
                >
                  <Icon size={24} color={item.color} />
                </View>
                <View className="flex-1">
                  <Text className={`font-bold ${textColor}`}>{item.name}</Text>
                  <Text className={`${mutedColor} text-xs`}>{item.desc}</Text>
                </View>
                <ArrowRight size={18} color="#D4C29E" />
              </TouchableOpacity>
            </View>
          )
        }}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </SafeAreaView>
  )
}

