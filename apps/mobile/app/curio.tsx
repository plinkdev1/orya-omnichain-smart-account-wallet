import { useRouter } from 'expo-router'
import {
    ArrowLeft,
    Filter,
    Grid3x3,
    List,
    Menu,
    Search,
} from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { useState } from 'react'
import {
    FlatList,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'

interface NFT {
  id: string
  name: string
  chain: string
  price: string
  color: string
}

const NFTS: NFT[] = [
  { id: '1', name: 'Cosmic Dreams #142', chain: 'Ethereum', price: '2.5 ETH', color: '#a855f7' },
  { id: '2', name: 'Digital Essence #89', chain: 'Solana', price: '45 SOL', color: '#ec4899' },
  { id: '3', name: 'Quantum Realm #301', chain: 'Polygon', price: '150 MATIC', color: '#3b82f6' },
  { id: '4', name: 'Ethereal Waves #56', chain: 'Base', price: '0.8 ETH', color: '#f97316' },
  { id: '5', name: 'Neon Genesis #234', chain: 'Arbitrum', price: '1.2 ETH', color: '#10b981' },
  { id: '6', name: 'Prism Shift #78', chain: 'Optimism', price: '0.95 ETH', color: '#ef4444' },
]

export default function CurioScreen() {
  const { colorScheme } = useColorScheme()
  const router = useRouter()
  const isDark = colorScheme === 'dark'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchText, setSearchText] = useState('')

  const bgColor = isDark ? 'bg-slate-900' : 'bg-slate-50'
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white'
  const textColor = isDark ? 'text-slate-50' : 'text-slate-900'
  const mutedColor = isDark ? 'text-slate-400' : 'text-slate-500'

  const filteredNFTs = NFTS.filter(nft =>
    nft.name.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={isDark ? '#64748b' : '#64748b'} />
        </TouchableOpacity>
        <View>
          <Text className={`text-2xl font-bold ${textColor}`}>Curio</Text>
          <Text className={`${mutedColor} text-xs`}>NFT Gallery</Text>
        </View>
        <TouchableOpacity>
          <Menu size={24} color={isDark ? '#64748b' : '#64748b'} />
        </TouchableOpacity>
      </View>

      {/* Featured Carousel */}
      <View className={`mx-4 mt-4 p-4 rounded-2xl ${cardBg} flex-row items-center gap-3`}>
        <View className="w-20 h-20 rounded-xl" style={{ backgroundColor: '#a855f7' }} />
        <View className="flex-1">
          <Text className={`${mutedColor} text-xs mb-1`}>Featured</Text>
          <Text className={`font-bold text-lg ${textColor}`}>Cosmic Dreams</Text>
          <Text className={`${mutedColor} text-xs`}>Limited edition art</Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View className="px-4 mt-4 flex-row items-center gap-2 mb-4">
        <View className={`flex-1 flex-row items-center rounded-xl px-3 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <Search size={16} color={isDark ? '#94a3b8' : '#cbd5e1'} />
          <TextInput
            placeholder="Search NFTs..."
            placeholderTextColor={isDark ? '#94a3b8' : '#cbd5e1'}
            value={searchText}
            onChangeText={setSearchText}
            className={`flex-1 ml-2 py-3 text-sm ${isDark ? 'text-slate-50' : 'text-slate-900'}`}
          />
        </View>
        <TouchableOpacity className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <Filter size={18} color={isDark ? '#D4C29E' : '#D4C29E'} />
        </TouchableOpacity>
        <View className={`flex-row gap-1 p-1 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <TouchableOpacity
            onPress={() => setViewMode('grid')}
            className={`p-2 rounded-2xl ${viewMode === 'grid' ? 'bg-amber-500' : ''}`}
          >
            <Grid3x3 size={18} color={viewMode === 'grid' ? '#fff' : '#D4C29E'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            className={`p-2 rounded-2xl ${viewMode === 'list' ? 'bg-amber-500' : ''}`}
          >
            <List size={18} color={viewMode === 'list' ? '#fff' : '#D4C29E'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* NFTs Grid/List */}
      <FlatList
        data={filteredNFTs}
        keyExtractor={(item: NFT) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        scrollEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        renderItem={({ item }: { item: NFT }) => (
          <View className={viewMode === 'grid' ? 'w-1/2 pr-2' : 'w-full'}>
            <TouchableOpacity
              className={`${cardBg} rounded-2xl overflow-hidden mb-4 ${viewMode === 'list' ? 'flex-row' : ''}`}
            >
              <View
                className={`${viewMode === 'grid' ? 'h-40' : 'w-24 h-24'} rounded-xl`}
                style={{ backgroundColor: item.color }}
              />
              {viewMode === 'list' && (
                <View className="flex-1 p-3">
                  <Text className={`font-bold ${textColor}`}>{item.name}</Text>
                  <Text className={`${mutedColor} text-xs mb-2`}>{item.chain}</Text>
                  <Text className="text-amber-500 font-semibold">{item.price}</Text>
                </View>
              )}
            </TouchableOpacity>
            {viewMode === 'grid' && (
              <View>
                <Text className={`font-semibold text-sm ${textColor}`}>{item.name}</Text>
                <Text className={`${mutedColor} text-xs mb-1`}>{item.chain}</Text>
                <Text className="text-amber-500 font-semibold text-sm">{item.price}</Text>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  )
}

