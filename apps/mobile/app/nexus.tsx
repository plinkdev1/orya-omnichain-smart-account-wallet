import { useRouter } from 'expo-router'
import {
    ArrowLeft,
    Menu,
    Radio,
    Zap
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

const NETWORK_NODES = [
  { id: '1', name: 'Mainnet - Primary', status: 'connected', latency: '12ms', peers: 145 },
  { id: '2', name: 'Fallback Node - Backup', status: 'connected', latency: '34ms', peers: 98 },
  { id: '3', name: 'Archive Node - Full', status: 'syncing', latency: '45ms', peers: 67 },
]

const RPC_ENDPOINTS = [
  { id: '1', name: 'Alchemy', status: 'active', requests: '5.2k/day' },
  { id: '2', name: 'QuickNode', status: 'standby', requests: '1.2k/day' },
  { id: '3', name: 'Infura', status: 'standby', requests: '0.8k/day' },
]

export default function NexusScreen() {
  const { colorScheme } = useColorScheme()
  const router = useRouter()
  const isDark = colorScheme === 'dark'
  const [nodeStats, setNodeStats] = useState('uptime')

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
          <Text className={`text-2xl font-bold ${textColor}`}>Nexus</Text>
          <Text className={`${mutedColor} text-xs`}>Network management</Text>
        </View>
        <TouchableOpacity>
          <Menu size={24} color={isDark ? '#64748b' : '#64748b'} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Network Status */}
        <View className={`mx-4 mt-4 p-4 rounded-2xl ${cardBg}`}>
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full bg-green-500" />
              <Text className={`font-semibold ${textColor}`}>Network Status</Text>
            </View>
            <Text className="text-green-500 font-semibold">Healthy</Text>
          </View>

          <View className="grid grid-cols-3 gap-2">
            <View className={`p-3 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-slate-100'} items-center`}>
              <Text className={`${mutedColor} text-xs mb-1`}>Latency</Text>
              <Text className={`font-bold text-lg ${textColor}`}>12ms</Text>
            </View>
            <View className={`p-3 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-slate-100'} items-center`}>
              <Text className={`${mutedColor} text-xs mb-1`}>Uptime</Text>
              <Text className={`font-bold text-lg ${textColor}`}>99.8%</Text>
            </View>
            <View className={`p-3 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-slate-100'} items-center`}>
              <Text className={`${mutedColor} text-xs mb-1`}>Peers</Text>
              <Text className={`font-bold text-lg ${textColor}`}>310</Text>
            </View>
          </View>
        </View>

        {/* Network Nodes */}
        <View className="px-4 mt-6 mb-6">
          <Text className={`font-bold text-lg ${textColor} mb-3`}>Active Nodes</Text>
          {NETWORK_NODES.map((node) => (
            <View key={node.id} className={`${cardBg} p-4 rounded-xl mb-2`}>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2 flex-1">
                  <Radio size={16} color={node.status === 'connected' ? '#22c55e' : '#f59e0b'} />
                  <Text className={`font-semibold ${textColor}`}>{node.name}</Text>
                </View>
                <View
                  className={`px-2 py-1 rounded-2xl ${node.status === 'connected' ? 'bg-green-500/20' : 'bg-amber-500/20'}`}
                >
                  <Text
                    className={`text-xs font-semibold ${node.status === 'connected' ? 'text-green-600' : 'text-amber-600'}`}
                  >
                    {node.status}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between">
                <Text className={`text-xs ${mutedColor}`}>Latency: {node.latency}</Text>
                <Text className={`text-xs ${mutedColor}`}>Peers: {node.peers}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* RPC Endpoints */}
        <View className="px-4 mb-8">
          <Text className={`font-bold text-lg ${textColor} mb-3`}>RPC Endpoints</Text>
          {RPC_ENDPOINTS.map((endpoint) => (
            <View key={endpoint.id} className={`${cardBg} p-4 rounded-xl mb-2 flex-row items-center justify-between`}>
              <View className="flex-row items-center gap-2">
                <Zap size={16} color="#D4C29E" />
                <View>
                  <Text className={`font-semibold ${textColor}`}>{endpoint.name}</Text>
                  <Text className={`text-xs ${mutedColor}`}>{endpoint.requests}</Text>
                </View>
              </View>
              <View
                className={`px-2 py-1 rounded-2xl ${endpoint.status === 'active' ? 'bg-green-500/20' : 'bg-slate-500/20'}`}
              >
                <Text
                  className={`text-xs font-semibold ${endpoint.status === 'active' ? 'text-green-600' : textColor}`}
                >
                  {endpoint.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

