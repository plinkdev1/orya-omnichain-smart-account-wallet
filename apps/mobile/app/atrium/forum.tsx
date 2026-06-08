import { useRouter } from 'expo-router'
import { ArrowLeft, Menu, Users } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native'

export default function ForumScreen() {
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
        <Text className={`text-xl font-bold ${textColor}`}>Forum</Text>
        <Menu size={24} color={textColor} />
      </View>
      <ScrollView className="flex-1 px-4">
        <View className={`${cardBg} p-6 rounded-2xl mt-4`}>
          <View className="flex-row items-center gap-3 mb-3">
            <Users size={28} color="#a78bfa" />
            <Text className={`text-2xl font-bold ${textColor}`}>Governance</Text>
          </View>
          <Text className={`${mutedColor} mb-4`}>DAO voting & governance platform</Text>
          <View className={`${isDark ? 'bg-slate-700' : 'bg-slate-100'} p-4 rounded-2xl mb-4`}>
            <Text className={`${mutedColor} text-xs mb-1`}>Voting Power</Text>
            <Text className={`text-2xl font-bold ${textColor}`}>10,000 votes</Text>
          </View>
          <Text className={`${textColor} font-semibold mb-2`}>Active Proposals:</Text>
          {['Treasury Allocation', 'Protocol Upgrade', 'Fee Structure', 'New Features'].map((prop, i) => (
            <View key={i} className={`${isDark ? 'bg-slate-700' : 'bg-slate-100'} p-3 rounded-2xl mb-2`}>
              <Text className={textColor}>{prop}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}


