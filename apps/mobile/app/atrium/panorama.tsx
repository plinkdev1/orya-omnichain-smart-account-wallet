import { useRouter } from 'expo-router'
import { ArrowLeft, BarChart4, Menu } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native'

export default function PanoramaScreen() {
  const { colorScheme } = useColorScheme()
  const router = useRouter()
  const isDark = colorScheme === 'dark'
  const bgColor = isDark ? 'bg-slate-900' : 'bg-slate-50'
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white'
  const textColor = isDark ? 'text-slate-50' : 'text-slate-900'
  const mutedColor = isDark ? 'text-slate-400' : 'text-slate-500'

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={textColor} />
        </TouchableOpacity>
        <Text className={`text-xl font-bold ${textColor}`}>Panorama</Text>
        <Menu size={24} color={textColor} />
      </View>
      <ScrollView className="flex-1 px-4">
        <View className={`${cardBg} p-6 rounded-2xl mt-4`}>
          <View className="flex-row items-center gap-3 mb-3">
            <BarChart4 size={28} color="#10b981" />
            <Text className={`text-2xl font-bold ${textColor}`}>ETF Dashboard</Text>
          </View>
          <Text className={`${mutedColor} mb-4`}>Track stocks & ETFs in real-time</Text>
          <View className={`${isDark ? 'bg-slate-700' : 'bg-slate-100'} p-4 rounded-2xl mb-4`}>
            <Text className={`${mutedColor} text-xs mb-1`}>ETF Portfolio</Text>
            <Text className={`text-2xl font-bold ${textColor}`}>$62,180</Text>
          </View>
          <Text className={`${textColor} font-semibold mb-2`}>Tracked ETFs:</Text>
          {['SPY', 'QQQ', 'VTI', 'AGG', 'IVV'].map((etf, i) => (
            <View key={i} className={`${isDark ? 'bg-slate-700' : 'bg-slate-100'} p-3 rounded-2xl mb-2`}>
              <Text className={textColor}>{etf}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}


