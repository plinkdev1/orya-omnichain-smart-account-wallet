import {
    Check,
    ChevronRight,
    Crown,
    Gift,
    Menu,
    MessageCircle,
    Sparkles,
    Star,
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

interface CircleOffer {
  title: string
  desc: string
  icon: React.ComponentType<any>
}

interface CircleTier {
  name: string
  icon: React.ComponentType<any>
  volume: string
  color: string
  benefits: string[]
  isCurrent: boolean
}

export default function CircleScreen() {
  const { colorScheme } = useColorScheme()
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null)

  const isDark = colorScheme === 'dark'
  const fgColor = isDark ? '#F8F6F1' : '#1A1A1A'
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF'
  const primaryColor = isDark ? '#FFD700' : '#D4C29E'

  const offers: CircleOffer[] = [
    { title: '0% Trading Fees', desc: 'This weekend only', icon: Gift },
    { title: 'Priority Support', desc: '24/7 concierge access', icon: MessageCircle },
    { title: 'Exclusive Events', desc: 'Web3 summit invite', icon: Users },
  ]

  const tiers: CircleTier[] = [
    {
      name: 'Platinum',
      icon: Crown,
      volume: '$250,000+',
      color: '#a78bfa',
      benefits: ['24/7 Concierge', '0% Trading Fees', 'Priority Support', 'Exclusive Events'],
      isCurrent: false,
    },
    {
      name: 'Gold',
      icon: Star,
      volume: '$50,000+',
      color: '#fbbf24',
      benefits: ['Concierge Hours', '0.1% Trading Fees', 'Priority Support'],
      isCurrent: true,
    },
    {
      name: 'Silver',
      icon: Sparkles,
      volume: '$10,000+',
      color: '#9ca3af',
      benefits: ['Email Support', '0.25% Trading Fees'],
      isCurrent: false,
    },
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
            ORŸA Circle
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
            Exclusive membership benefits
          </Text>
        </View>

        {/* Member Status Card */}
        <View className={`mx-6 mb-6 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3 flex-1">
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: primaryColor + '30' }}
              >
                <Star size={24} color={primaryColor} />
              </View>
              <View>
                <Text className="text-lg font-bold" style={{ color: fgColor }}>
                  Gold Member
                </Text>
                <Text
                  className="text-xs"
                  style={{ color: isDark ? '#888888' : '#999999' }}
                >
                  Since January 2024
                </Text>
              </View>
            </View>
            <View
              className="px-3 py-1 rounded-full bg-pale-gold"
            >
              <Text className="text-xs font-semibold" style={{ color: '#000' }}>
                Active
              </Text>
            </View>
          </View>

          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text
                className="text-xs font-medium"
                style={{ color: isDark ? '#888888' : '#999999' }}
              >
                Progress to Platinum
              </Text>
              <Text className="text-xs font-semibold" style={{ color: fgColor }}>
                $75,000 / $250,000
              </Text>
            </View>
            <View className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <View
                className="h-full bg-pale-gold rounded-full"
                style={{ width: '30%' }}
              />
            </View>
          </View>
        </View>

        {/* Exclusive Offers */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold mb-4" style={{ color: fgColor }}>
            Exclusive Offers
          </Text>
          <FlatList
            data={offers}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }: { item: CircleOffer; index: number }) => {
              const IconComponent = item.icon
              return (
                <TouchableOpacity
                  onPress={() => setSelectedOffer(index)}
                  className={`mr-3 min-w-72 p-4 rounded-2xl ${
                    selectedOffer === index
                      ? `ring-2 ${isDark ? 'bg-gray-700 ring-pale-gold' : 'bg-white ring-pale-gold'}`
                      : isDark
                      ? 'bg-gray-800'
                      : 'bg-white'
                  }`}
                >
                  <View className="flex-row items-start gap-3">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: primaryColor + '20' }}
                    >
                      <IconComponent size={20} color={primaryColor} />
                    </View>
                    <View>
                      <Text className="font-semibold text-sm" style={{ color: fgColor }}>
                        {item.title}
                      </Text>
                      <Text
                        className="text-xs mt-1"
                        style={{ color: isDark ? '#888888' : '#999999' }}
                      >
                        {item.desc}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            }}
            keyExtractor={(_: CircleOffer, index: number) => index.toString()}
          />
        </View>

        {/* Membership Tiers */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold mb-4" style={{ color: fgColor }}>
            Membership Tiers
          </Text>
          <View className="gap-4">
            {tiers.map((tier: CircleTier, index: number) => {
              const TierIcon = tier.icon
              return (
                <View
                  key={index}
                  className={`p-6 rounded-2xl border ${
                    tier.isCurrent
                      ? isDark
                        ? 'bg-gray-800 border-pale-gold'
                        : 'bg-white border-pale-gold'
                      : isDark
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  } ${!tier.isCurrent && tier.name === 'Silver' ? 'opacity-60' : ''}`}
                >
                  <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: tier.color + '30' }}
                      >
                        <TierIcon size={20} color={tier.color} />
                      </View>
                      <View>
                        <Text className="text-base font-bold" style={{ color: fgColor }}>
                          {tier.name}
                        </Text>
                        <Text
                          className="text-xs"
                          style={{ color: isDark ? '#888888' : '#999999' }}
                        >
                          {tier.volume} volume
                        </Text>
                      </View>
                    </View>
                    {tier.isCurrent && (
                      <View className="px-3 py-1 rounded-full bg-pale-gold">
                        <Text className="text-xs font-semibold" style={{ color: '#000' }}>
                          Current
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="gap-2">
                    {tier.benefits.map((benefit) => (
                      <View key={benefit} className="flex-row items-center gap-2">
                        <Check
                          size={16}
                          color={tier.isCurrent ? '#22c55e' : isDark ? '#888888' : '#999999'}
                        />
                        <Text className="text-sm" style={{ color: fgColor }}>
                          {benefit}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )
            })}
          </View>
        </View>

        {/* Concierge Chat */}
        <View className={`mx-6 mb-6 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3 flex-1">
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: primaryColor + '20' }}
              >
                <MessageCircle size={20} color={primaryColor} />
              </View>
              <View>
                <Text className="text-base font-semibold" style={{ color: fgColor }}>
                  Concierge Chat
                </Text>
                <Text
                  className="text-xs"
                  style={{ color: isDark ? '#888888' : '#999999' }}
                >
                  Available 9 AM - 9 PM EST
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={isDark ? '#888888' : '#999999'} />
          </View>
          <Text
            className="text-sm mb-4"
            style={{ color: isDark ? '#888888' : '#999999' }}
          >
            Get personalized assistance with your portfolio, transactions, and membership
            benefits.
          </Text>
          <TouchableOpacity className="h-11 rounded-xl bg-pale-gold items-center justify-center">
            <Text className="text-sm font-semibold" style={{ color: '#000' }}>
              Start Chat
            </Text>
          </TouchableOpacity>
        </View>

        {/* Invite Friends */}
        <View className={`mx-6 mb-6 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <View className="flex-row items-center gap-3 mb-4">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: primaryColor + '20' }}
            >
              <Users size={20} color={primaryColor} />
            </View>
            <View>
              <Text className="text-base font-semibold" style={{ color: fgColor }}>
                Invite Friends
              </Text>
              <Text
                className="text-xs"
                style={{ color: isDark ? '#888888' : '#999999' }}
              >
                Earn rewards for referrals
              </Text>
            </View>
          </View>

          <View
            className={`p-4 rounded-xl mb-4 border ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'
            }`}
          >
            <Text
              className="text-xs font-medium mb-1"
              style={{ color: isDark ? '#888888' : '#999999' }}
            >
              Your Referral Code
            </Text>
            <Text className="text-lg font-bold tracking-widest" style={{ color: fgColor }}>
              ORYA-GOLD-2024
            </Text>
          </View>

          <TouchableOpacity
            className={`h-11 rounded-xl border items-center justify-center ${
              isDark
                ? 'bg-gray-700 border-gray-600'
                : 'bg-gray-100 border-gray-200'
            }`}
          >
            <Text className="text-sm font-semibold" style={{ color: fgColor }}>
              Share Code
            </Text>
          </TouchableOpacity>
        </View>

        {/* Upgrade CTA */}
        <TouchableOpacity className="mx-6 h-12 rounded-xl bg-pale-gold items-center justify-center mb-6">
          <Text className="text-sm font-semibold" style={{ color: '#000' }}>
            Upgrade Membership
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

