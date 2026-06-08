import {
    ArrowRight,
    BarChart3,
    Download,
    FileText,
    Lock,
    Menu,
    MessageCircle,
    Network,
    Shield,
    Users,
} from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { useState } from 'react'
import {
    FlatList,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

interface Entity {
  name: string
  balance: string
  wallets: number
}

interface SuiteFeature {
  name: string
  icon: React.ComponentType<any>
  desc: string
}

interface Wallet {
  name: string
  sigs: string
  status: string
}

export default function SuiteScreen() {
  const { colorScheme } = useColorScheme()
  const [selectedEntity, setSelectedEntity] = useState(0)

  const isDark = colorScheme === 'dark'
  const fgColor = isDark ? '#F8F6F1' : '#1A1A1A'
  const primaryColor = isDark ? '#FFD700' : '#D4C29E'

  const entities: Entity[] = [
    { name: 'Treasury', balance: '$2.4M', wallets: 3 },
    { name: 'Operations', balance: '$850K', wallets: 2 },
    { name: 'Development', balance: '$320K', wallets: 1 },
  ]

  const features: SuiteFeature[] = [
    { name: 'Team Access', icon: Users, desc: 'Role-based permissions' },
    { name: 'Cross-Chain', icon: Network, desc: 'Seamless bridging' },
    { name: 'Cold Storage', icon: Lock, desc: 'Hardware integration' },
    { name: 'Audit Logs', icon: Shield, desc: 'Complete transparency' },
  ]

  const wallets: Wallet[] = [
    { name: 'Treasury Wallet', sigs: '3 of 5', status: 'Active' },
    { name: 'Operations Wallet', sigs: '2 of 3', status: 'Active' },
  ]

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-bone-white'}`}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-4 pb-6">
          <Text
            className="text-2xl font-bold"
            style={{ color: fgColor }}
          >
            ORŸA Suite
          </Text>
          <TouchableOpacity
            className={`p-2.5 rounded-full ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <Menu
              size={20}
              color={fgColor}
            />
          </TouchableOpacity>
        </View>

        <View className="px-6 mb-8">
          <Text
            className="text-sm font-medium"
            style={{ color: isDark ? '#888888' : '#999999' }}
          >
            Institutional-grade features
          </Text>
        </View>

        {/* Entities Selection */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold mb-4" style={{ color: fgColor }}>
            Your Entities
          </Text>
          <FlatList
            data={entities}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }: { item: Entity; index: number }) => (
              <TouchableOpacity
                onPress={() => setSelectedEntity(index)}
                className={`mr-3 min-w-48 p-4 rounded-2xl border-2 ${
                  selectedEntity === index
                    ? isDark
                      ? 'bg-gray-800 border-pale-gold bg-opacity-40'
                      : 'bg-white border-pale-gold bg-opacity-40'
                    : isDark
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}
              >
                <Text className="font-semibold text-sm" style={{ color: fgColor }}>
                  {item.name}
                </Text>
                <Text className="text-2xl font-bold mt-2" style={{ color: fgColor }}>
                  {item.balance}
                </Text>
                <Text
                  className="text-xs mt-1"
                  style={{ color: isDark ? '#888888' : '#999999' }}
                >
                  {item.wallets} wallet(s)
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(_: Entity, index: number) => index.toString()}
          />
        </View>

        {/* Multi-Sig Wallet */}
        <View className={`mx-6 mb-4 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-row items-center gap-3 flex-1">
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: primaryColor + '20' }}
              >
                <Shield size={24} color={primaryColor} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold" style={{ color: fgColor }}>
                  Multi-Signature Wallet
                </Text>
                <Text
                  className="text-xs mt-1"
                  style={{ color: isDark ? '#888888' : '#999999' }}
                >
                  Enhanced security for teams
                </Text>
              </View>
            </View>
            <View className="px-2 py-1 rounded-full bg-pale-gold/20">
              <Text className="text-xs font-semibold" style={{ color: primaryColor }}>
                Pro
              </Text>
            </View>
          </View>
          <Text
            className="text-xs mb-4 leading-5"
            style={{ color: isDark ? '#888888' : '#999999' }}
          >
            Require multiple approvals for transactions. Perfect for organizations and DAOs.
          </Text>
          <TouchableOpacity className="h-12 rounded-xl bg-pale-gold items-center justify-center flex-row gap-2">
            <Text className="text-sm font-semibold" style={{ color: '#000' }}>
              Create Multi-Sig
            </Text>
            <ArrowRight size={16} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Analytics Dashboard */}
        <View className={`mx-6 mb-4 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3 flex-1">
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: primaryColor + '20' }}
              >
                <BarChart3 size={20} color={primaryColor} />
              </View>
              <Text className="text-base font-semibold" style={{ color: fgColor }}>
                Analytics Dashboard
              </Text>
            </View>
            <TouchableOpacity
              className={`px-3 py-1 rounded-full border ${
                isDark ? 'border-gray-600' : 'border-gray-200'
              }`}
            >
              <Text className="text-xs font-semibold" style={{ color: fgColor }}>
                View Full
              </Text>
            </TouchableOpacity>
          </View>
          <View
            className={`h-40 rounded-xl items-center justify-center ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}
          >
            <Text
              className="text-sm"
              style={{ color: isDark ? '#888888' : '#999999' }}
            >
              Advanced analytics visualization
            </Text>
          </View>
        </View>

        {/* Features Grid */}
        <View className="px-6 mb-6">
          <FlatList
            data={features}
            numColumns={2}
            columnWrapperStyle={{ gap: 12 }}
            scrollEnabled={false}
            renderItem={({ item }: { item: SuiteFeature }) => {
              const IconComponent = item.icon
              return (
                <TouchableOpacity
                  className={`flex-1 p-6 rounded-2xl ${
                    isDark ? 'bg-gray-800' : 'bg-white'
                  }`}
                >
                  <IconComponent size={24} color={primaryColor} className="mb-3" />
                  <Text className="font-semibold text-sm" style={{ color: fgColor }}>
                    {item.name}
                  </Text>
                  <Text
                    className="text-xs mt-1"
                    style={{ color: isDark ? '#888888' : '#999999' }}
                  >
                    {item.desc}
                  </Text>
                </TouchableOpacity>
              )
            }}
            keyExtractor={(_: SuiteFeature, index: number) => index.toString()}
          />
        </View>

        {/* Concierge */}
        <View className={`mx-6 mb-6 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <View className="flex-row items-center gap-3 mb-4">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: primaryColor + '20' }}
            >
              <MessageCircle size={20} color={primaryColor} />
            </View>
            <View>
              <Text className="text-base font-semibold" style={{ color: fgColor }}>
                Dedicated Concierge
              </Text>
              <Text
                className="text-xs"
                style={{ color: isDark ? '#888888' : '#999999' }}
              >
                Your institutional support team
              </Text>
            </View>
          </View>
          <TouchableOpacity className="h-11 rounded-xl bg-pale-gold items-center justify-center">
            <Text className="text-sm font-semibold" style={{ color: '#000' }}>
              Contact Team
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reports & Export */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold mb-3" style={{ color: fgColor }}>
            Reports & Export
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className={`flex-1 h-20 rounded-2xl border items-center justify-center gap-2 ${
                isDark
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Download size={20} color={fgColor} />
              <Text className="text-xs font-semibold text-center" style={{ color: fgColor }}>
                Export PDF
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 h-20 rounded-2xl border items-center justify-center gap-2 ${
                isDark
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
            >
              <FileText size={20} color={fgColor} />
              <Text className="text-xs font-semibold text-center" style={{ color: fgColor }}>
                Export CSV
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Wallets */}
        <View className="px-6">
          <Text className="text-lg font-semibold mb-4" style={{ color: fgColor }}>
            Active Wallets
          </Text>
          <View className="gap-3">
            {wallets.map((wallet: Wallet, index: number) => (
              <TouchableOpacity
                key={index}
                className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold" style={{ color: fgColor }}>
                      {wallet.name}
                    </Text>
                    <Text
                      className="text-xs mt-1"
                      style={{ color: isDark ? '#888888' : '#999999' }}
                    >
                      {wallet.sigs} signatures required
                    </Text>
                  </View>
                  <View className="px-3 py-1 rounded-full bg-green-500/20">
                    <Text className="text-xs font-semibold" style={{ color: '#22c55e' }}>
                      {wallet.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

