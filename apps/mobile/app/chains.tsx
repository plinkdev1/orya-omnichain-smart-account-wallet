import BlockchainIcon from '@/components/BlockchainIcon'
import { getBlockchainIconName, hasBlockchainIcon } from '@/lib/blockchainMapping'
import { useRouter } from 'expo-router'
import {
    ArrowLeft,
    Menu,
    Plus,
    ToggleRight,
} from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { useState } from 'react'
import {
    FlatList,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

interface BlockchainChain {
  id: string
  name: string
  ticker: string
  enabled: boolean
  balance: string
  color?: string // Fallback color if icon not found
}

// Expanded list of blockchain chains with all 29 supported icons plus popular chains
const BLOCKCHAIN_CHAINS: BlockchainChain[] = [
  // Primary supported blockchains (with dedicated icons)
  { id: '1', name: 'Bitcoin', ticker: 'BTC', enabled: true, balance: '$35,000' },
  { id: '2', name: 'Ethereum', ticker: 'ETH', enabled: true, balance: '$38,000' },
  { id: '3', name: 'Solana', ticker: 'SOL', enabled: true, balance: '$28,000' },
  { id: '4', name: 'SUI', ticker: 'SUI', enabled: true, balance: '$15,000' },
  { id: '5', name: 'Polygon', ticker: 'MATIC', enabled: false, balance: '$8,856' },
  { id: '6', name: 'Arbitrum', ticker: 'ARB', enabled: false, balance: '$0' },
  { id: '7', name: 'Avalanche', ticker: 'AVAX', enabled: true, balance: '$12,500' },
  { id: '8', name: 'Cardano', ticker: 'ADA', enabled: false, balance: '$5,200' },
  { id: '9', name: 'Polkadot', ticker: 'DOT', enabled: true, balance: '$8,900' },
  { id: '10', name: 'Tron', ticker: 'TRX', enabled: false, balance: '$3,400' },
  { id: '11', name: 'Dogecoin', ticker: 'DOGE', enabled: true, balance: '$2,100' },
  { id: '12', name: 'Monero', ticker: 'XMR', enabled: false, balance: '$6,700' },
  { id: '13', name: 'Chainlink', ticker: 'LINK', enabled: true, balance: '$4,800' },
  { id: '14', name: 'Algorand', ticker: 'ALGO', enabled: false, balance: '$1,900' },
  { id: '15', name: 'Tezos', ticker: 'XTZ', enabled: true, balance: '$2,300' },
  { id: '16', name: 'Bitcoin Cash', ticker: 'BCH', enabled: false, balance: '$890' },
  { id: '17', name: 'Stellar', ticker: 'XLM', enabled: true, balance: '$1,200' },
  { id: '18', name: 'Filecoin', ticker: 'FIL', enabled: false, balance: '$4,500' },
  { id: '19', name: 'Zcash', ticker: 'ZEC', enabled: true, balance: '$2,800' },
  { id: '20', name: 'Near', ticker: 'NEAR', enabled: false, balance: '$1,600' },
  { id: '21', name: 'Aptos', ticker: 'APT', enabled: true, balance: '$3,200' },
  { id: '22', name: 'Optimism', ticker: 'OP', enabled: true, balance: '$5,600' },
  { id: '23', name: 'Fantom', ticker: 'FTM', enabled: false, balance: '$2,900' },
  { id: '24', name: 'Klaytn', ticker: 'KLAY', enabled: true, balance: '$1,400' },
  { id: '25', name: 'Hedera', ticker: 'HBAR', enabled: false, balance: '$980' },
  { id: '26', name: 'Cosmos', ticker: 'ATOM', enabled: true, balance: '$3,700' },
  { id: '27', name: 'Litecoin', ticker: 'LTC', enabled: true, balance: '$7,200' },
  { id: '28', name: 'Ripple', ticker: 'XRP', enabled: false, balance: '$9,100' },
  { id: '29', name: 'Binance Coin', ticker: 'BNB', enabled: true, balance: '$22,300' },
]

export default function ChainsScreen() {
  const { colorScheme } = useColorScheme()
  const router = useRouter()
  const isDark = colorScheme === 'dark'
  const [chains, setChains] = useState(BLOCKCHAIN_CHAINS)

  const bgColor = isDark ? 'bg-slate-900' : 'bg-slate-50'
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white'
  const textColor = isDark ? 'text-slate-50' : 'text-slate-900'
  const mutedColor = isDark ? 'text-slate-400' : 'text-slate-500'

  const toggleChain = (id: string) => {
    setChains(chains.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c))
  }

  const enabledChains = chains.filter(c => c.enabled)
  const totalBalance = enabledChains.reduce((sum, c) => {
    const value = parseInt(c.balance.replace(/[$,]/g, ''))
    return sum + value
  }, 0)

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={isDark ? '#64748b' : '#64748b'} />
        </TouchableOpacity>
        <View>
          <Text className={`text-2xl font-bold ${textColor}`}>Chains</Text>
          <Text className={`${mutedColor} text-xs`}>Multi-chain manager</Text>
        </View>
        <TouchableOpacity>
          <Menu size={24} color={isDark ? '#64748b' : '#64748b'} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={chains}
        keyExtractor={(item: BlockchainChain) => item.id}
        scrollEnabled
        ListHeaderComponent={
          <View className="px-4 pt-4">
            {/* Total Balance */}
            <View className={`${cardBg} p-4 rounded-2xl mb-4`}>
              <Text className={`${mutedColor} text-sm mb-1`}>Total Balance Across Chains</Text>
              <Text className={`text-3xl font-bold ${textColor}`}>${totalBalance.toLocaleString()}</Text>
              <Text className={`${mutedColor} text-xs mt-2`}>{enabledChains.length} active chains</Text>
            </View>

            {/* Add Chain Button */}
            <TouchableOpacity className="bg-amber-500 px-4 py-3 rounded-xl flex-row items-center justify-center mb-4">
              <Plus size={18} color="#fff" />
              <Text className="text-white font-bold ml-2">Add Chain</Text>
            </TouchableOpacity>

            <Text className={`font-bold text-lg ${textColor} mb-3`}>Manage Chains</Text>
          </View>
        }
        renderItem={({ item }: { item: BlockchainChain }) => (
          <View className="px-4 mb-2">
            <TouchableOpacity
              onPress={() => toggleChain(item.id)}
              className={`${cardBg} p-4 rounded-xl flex-row items-center justify-between`}
            >
              <View className="flex-row items-center gap-3 flex-1">
                {/* Blockchain Icon - Using BlockchainIcon component */}
                {hasBlockchainIcon(item.name) ? (
                  <View className="w-12 h-12 rounded-lg items-center justify-center" style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
                    <BlockchainIcon 
                      chainName={getBlockchainIconName(item.name)} 
                      size={48}
                    />
                  </View>
                ) : (
                  /* Fallback for chains without dedicated icons */
                  <View 
                    className="w-12 h-12 rounded-lg items-center justify-center" 
                    style={{ backgroundColor: item.color || '#f59e0b' }}
                  >
                    <Text className="text-white font-bold text-xs">
                      {item.ticker.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
                
                <View>
                  <Text className={`font-semibold ${textColor}`}>{item.name}</Text>
                  <Text className={`text-xs ${mutedColor}`}>{item.ticker}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className={`font-semibold ${textColor} mb-1`}>{item.balance}</Text>
                <ToggleRight
                  size={24}
                  color={item.enabled ? '#22c55e' : '#94a3b8'}
                  fill={item.enabled ? '#22c55e' : 'none'}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </SafeAreaView>
  )
}

