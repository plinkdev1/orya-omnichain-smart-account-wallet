import { useRouter } from 'expo-router'
import {
    ArrowLeft,
    BarChart3,
    LineChart,
    Menu,
    TrendingUp,
} from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { useState } from 'react'
import {
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

const MOCK_PORTFOLIO = {
  value: '$124,856.42',
  change: '+8.4%',
  change24h: '+$1,234',
  bestPerformer: 'SOL +12%',
  assetCount: '12 tokens',
}

const CHART_DATA = [
  { name: 'ETH', value: 38000, change: '+5.2%', color: '#6366f1' },
  { name: 'SOL', value: 28000, change: '+12%', color: '#8b5cf6' },
  { name: 'BTC', value: 35000, change: '-2.1%', color: '#f59e0b' },
  { name: 'SUI', value: 15000, change: '+15%', color: '#06b6d4' },
  { name: 'USDC', value: 8856, change: '0%', color: '#14b8a6' },
]

export default function InsightsScreen() {
  const { colorScheme } = useColorScheme()
  const router = useRouter()
  const isDark = colorScheme === 'dark'
  const [timeRange, setTimeRange] = useState('7d')
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

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
          <Text className={`text-2xl font-bold ${textColor}`}>Insights</Text>
          <Text className={`${mutedColor} text-xs`}>Portfolio analytics</Text>
        </View>
        <TouchableOpacity>
          <Menu size={24} color={isDark ? '#64748b' : '#64748b'} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Portfolio Summary */}
        <View className={`mx-4 mt-4 p-4 rounded-2xl ${cardBg}`}>
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className={`${mutedColor} text-sm mb-1`}>Total Portfolio Value</Text>
              <Text className={`text-3xl font-bold ${textColor}`}>{MOCK_PORTFOLIO.value}</Text>
            </View>
            <View className="items-end">
              <View className="flex-row items-center gap-1 mb-1">
                <TrendingUp size={16} color="#22c55e" />
                <Text className="text-green-500 font-semibold">{MOCK_PORTFOLIO.change}</Text>
              </View>
              <Text className={`${mutedColor} text-xs`}>Last 7 days</Text>
            </View>
          </View>

          <View className={`border-t ${isDark ? 'border-slate-700' : 'border-slate-200'} pt-3 flex-row justify-between`}>
            <View>
              <Text className={`${mutedColor} text-xs mb-1`}>24h Change</Text>
              <Text className="text-green-500 font-semibold">{MOCK_PORTFOLIO.change24h}</Text>
            </View>
            <View>
              <Text className={`${mutedColor} text-xs mb-1`}>Best Performer</Text>
              <Text className={`font-semibold ${textColor}`}>{MOCK_PORTFOLIO.bestPerformer}</Text>
            </View>
            <View>
              <Text className={`${mutedColor} text-xs mb-1`}>Assets</Text>
              <Text className={`font-semibold ${textColor}`}>{MOCK_PORTFOLIO.assetCount}</Text>
            </View>
          </View>
        </View>

        {/* Controls */}
        <View className="px-4 mt-4 flex-row gap-2 mb-4">
          {['1d', '7d', '1m', '1y', 'all'].map((range) => (
            <TouchableOpacity
              key={range}
              onPress={() => setTimeRange(range)}
              className={`px-3 py-2 rounded-2xl ${timeRange === range ? 'bg-amber-500' : isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
            >
              <Text className={timeRange === range ? 'text-white font-semibold' : `${textColor}`}>
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        <View className={`mx-4 p-4 rounded-2xl ${cardBg} mb-4`}>
          <View className="flex-row items-center justify-between mb-3">
            <Text className={`font-semibold ${textColor}`}>Portfolio Distribution</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setChartType('line')}
                className={`p-2 rounded-2xl ${chartType === 'line' ? 'bg-amber-500' : isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
              >
                <LineChart size={16} color={chartType === 'line' ? '#fff' : '#D4C29E'} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setChartType('bar')}
                className={`p-2 rounded-2xl ${chartType === 'bar' ? 'bg-amber-500' : isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
              >
                <BarChart3 size={16} color={chartType === 'bar' ? '#fff' : '#D4C29E'} />
              </TouchableOpacity>
            </View>
          </View>

          <View className={`h-40 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-slate-100'} items-center justify-center`}>
            <Text className={`${mutedColor} text-sm`}>📊 Chart visualization</Text>
          </View>
        </View>

        {/* Asset Breakdown */}
        <View className="px-4 mb-8">
          <Text className={`font-bold text-lg ${textColor} mb-3`}>Assets Breakdown</Text>
          {CHART_DATA.map((asset, i) => (
            <View
              key={i}
              className={`p-3 rounded-xl mb-2 flex-row items-center justify-between ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}
            >
              <View className="flex-row items-center gap-3 flex-1">
                <View
                  className="w-8 h-8 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: asset.color }}
                >
                  <Text className="text-white text-xs font-bold">{asset.name[0]}</Text>
                </View>
                <View>
                  <Text className={`font-semibold ${textColor}`}>{asset.name}</Text>
                  <Text className={`text-xs ${mutedColor}`}>${asset.value.toLocaleString()}</Text>
                </View>
              </View>
              <Text
                className={`font-semibold ${asset.change.includes('+') ? 'text-green-500' : 'text-red-500'}`}
              >
                {asset.change}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

