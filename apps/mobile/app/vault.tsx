import { FlatList, SafeAreaView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import { useState, useEffect } from 'react'
import { Send, Repeat, Share2, Zap, Gift, MoreHorizontal, Check, TrendingUp, Lock, ArrowUpDown, Sparkles } from 'lucide-react-native'
import { useCopy } from '../hooks/useCopy'
import { useWallet } from '../hooks/useWallet'
import { useUserStore } from '../lib/stores/useUserStore'
import { SUIBalanceCard } from '../components/vault/SUIBalanceCard'
import { UnlockPrompt } from '../components/vault/UnlockPrompt'
import { UpgradeToWeb3 } from '../components/vault/UpgradeToWeb3'
import { BannerCarousel, type BannerCard } from '../components/BannerCarousel'
import { UserSegment } from '@orya/shared-types'

interface VaultAction {
  id: string
  icon: React.ComponentType<{ size: number; color: string }>
  label: string
  onPress: () => void
  enabled: boolean
  tooltip?: string
}

const SAMPLE_MOBILE_BANNERS: BannerCard[] = [
  {
    id: 'sui-welcome',
    title: 'Welcome to ORŸA on SUI',
    description: 'Experience fast, low-cost transactions',
    gradient: 'linear-gradient(135deg, #4DA2FF 0%, #2774C5 100%)',
    ctaText: 'Learn More',
    onCtaClick: () => console.log('Learn more about SUI'),
  },
  {
    id: 'rewards-event',
    title: 'Earn Rewards This Week',
    description: 'Deposit $100+ and unlock exclusive rewards',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    ctaText: 'Deposit Now',
    isDismissible: true,
    onCtaClick: () => console.log('Deposit flow started'),
  },
  {
    id: 'feature-update',
    title: 'New: Multi-chain Swaps',
    description: 'Swap tokens across SUI, EVM, and Solana',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    ctaText: 'Try Now',
    isDismissible: true,
    onCtaClick: () => console.log('Swap flow started'),
  },
]

export default function VaultScreen() {
  const { portfolio, loading, error, connectWallet } = useWallet()
  const { profile, isSegment } = useUserStore()
  const copy = useCopy()
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [hasShownPrompt, setHasShownPrompt] = useState(false)
  const [bannerCards, setBannerCards] = useState(SAMPLE_MOBILE_BANNERS)

  const segment = profile?.userSegment || UserSegment.NORMIE
  const capabilities = profile?.capabilities

  useEffect(() => {
    if (!hasShownPrompt && portfolio.wallets.length > 0) {
      setShowUnlockPrompt(true)
      setHasShownPrompt(true)
    }
  }, [portfolio.wallets.length, hasShownPrompt])

  const getVaultActions = (): VaultAction[] => {
    const baseActions: VaultAction[] = [
      {
        id: 'send',
        icon: Send,
        label: 'Send',
        onPress: () => {},
        enabled: true,
      },
      {
        id: 'receive',
        icon: ArrowUpDown,
        label: 'Receive',
        onPress: () => {},
        enabled: true,
      },
    ]

    if (isSegment(UserSegment.NORMIE)) {
      return [
        ...baseActions,
        {
          id: 'pay',
          icon: Gift,
          label: 'Pay',
          onPress: () => {},
          enabled: true,
        },
        {
          id: 'card',
          icon: Zap,
          label: 'Card',
          onPress: () => {},
          enabled: true,
        },
        {
          id: 'swap',
          icon: Repeat,
          label: 'Swap',
          onPress: () => setShowUnlockPrompt(true),
          enabled: false,
          tooltip: 'Upgrade to unlock',
        },
        {
          id: 'bridge',
          icon: Share2,
          label: 'Bridge',
          onPress: () => setShowUnlockPrompt(true),
          enabled: false,
          tooltip: 'Upgrade to unlock',
        },
        {
          id: 'more',
          icon: MoreHorizontal,
          label: 'More',
          onPress: () => {},
          enabled: true,
        },
      ]
    }

    if (isSegment(UserSegment.CRYPTO_NATIVE)) {
      return [
        ...baseActions,
        {
          id: 'swap',
          icon: Repeat,
          label: 'Swap',
          onPress: () => {},
          enabled: true,
        },
        {
          id: 'bridge',
          icon: Share2,
          label: 'Bridge',
          onPress: () => {},
          enabled: true,
        },
        {
          id: 'stake',
          icon: Zap,
          label: 'Stake',
          onPress: () => {},
          enabled: true,
        },
        {
          id: 'nft',
          icon: Gift,
          label: 'NFT',
          onPress: () => {},
          enabled: true,
        },
        {
          id: 'more',
          icon: MoreHorizontal,
          label: 'More',
          onPress: () => {},
          enabled: true,
        },
      ]
    }

    if (isSegment(UserSegment.INSTITUTIONAL)) {
      return [
        ...baseActions,
        {
          id: 'swap',
          icon: Repeat,
          label: 'Swap',
          onPress: () => {},
          enabled: true,
        },
        {
          id: 'bridge',
          icon: Share2,
          label: 'Bridge',
          onPress: () => {},
          enabled: true,
        },
        {
          id: 'stake',
          icon: Zap,
          label: 'Stake',
          onPress: () => {},
          enabled: true,
        },
        {
          id: 'nft',
          icon: Gift,
          label: 'NFT',
          onPress: () => {},
          enabled: true,
        },
        {
          id: 'approvals',
          icon: Check,
          label: 'Approvals',
          onPress: () => {},
          enabled: true,
        },
        {
          id: 'analytics',
          icon: TrendingUp,
          label: 'Analytics',
          onPress: () => {},
          enabled: true,
        },
        {
          id: 'more',
          icon: MoreHorizontal,
          label: 'More',
          onPress: () => {},
          enabled: true,
        },
      ]
    }

    return baseActions
  }

  const actions = getVaultActions()

  return (
    <>
      <SafeAreaView className="flex-1 bg-orya-cream dark:bg-orya-ocean">
        <View className="px-6 py-6">
          <Text className="text-3xl font-bold text-orya-charcoal dark:text-white mb-1">
            {copy.nav?.vault || 'Vault'}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 mb-6">
            {copy.vault?.subtitle || 'Portfolio overview and account management'}
          </Text>
        </View>

        {error && (
          <View className="mx-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl mb-4">
            <Text className="text-red-700 dark:text-red-300 text-sm">{error}</Text>
          </View>
        )}

        <SUIBalanceCard />

        <View className="px-6 mt-6 mb-6">
          <BannerCarousel
            cards={bannerCards}
            autoScrollInterval={6000}
            showIndicators={true}
            onCardClick={(cardId) => console.log(`Clicked banner: ${cardId}`)}
          />
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#0EA5E9" />
            <Text className="text-gray-600 dark:text-gray-300 mt-3">
              {copy.status?.loading || 'Loading...'}
            </Text>
          </View>
        ) : portfolio.wallets.length === 0 ? (
          <View className="flex-1 justify-center items-center px-6">
            <Text className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {copy.vault?.noWalletsConnected || 'No wallets connected'}
            </Text>
            <TouchableOpacity
              className="bg-orya-sea-blue px-6 py-3 rounded-2xl shadow-lg active:shadow-xl active:scale-95 transition-all"
              onPress={() => connectWallet('privy')}
            >
              <Text className="text-white font-bold text-center">
                {copy.actions?.connectFirstWallet || 'Connect Your First Wallet'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={portfolio.wallets}
            keyExtractor={(item) => item.address}
            renderItem={({ item: wallet }) => (
              <View className="px-6 mb-3">
                <View className="bg-white dark:bg-orya-ocean/80 border border-orya-sea-blue/30 dark:border-orya-sea-blue/50 p-4 rounded-2xl shadow-md">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="font-bold text-lg text-orya-charcoal dark:text-white">
                        {wallet.name || copy.wallet?.defaultLabel || 'Wallet'}
                      </Text>
                      <Text className="text-xs text-gray-600 dark:text-gray-400 font-mono mt-1">
                        {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                      </Text>
                    </View>
                    <View className="bg-orya-aqua/20 dark:bg-orya-sea-blue/20 px-2 py-1 rounded-lg">
                      <Text className="text-xs text-orya-sea-blue dark:text-orya-aqua font-medium">
                        {wallet.chain}
                      </Text>
                    </View>
                  </View>

                  {wallet.balance && (
                    <View className="mt-4 pt-4 border-t border-orya-sea-blue/30 dark:border-orya-sea-blue/50">
                      <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {copy.vault?.balance || 'Balance'}
                      </Text>
                      <Text className="text-xl font-bold text-orya-charcoal dark:text-white">
                        {wallet.balance.formatted} {wallet.balance.symbol}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
            ListFooterComponent={
              <View className="px-6 mt-6 mb-8">
                <View className="bg-white dark:bg-orya-ocean/80 rounded-2xl p-4 border border-orya-sea-blue/30 dark:border-orya-sea-blue/50">
                  <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    {isSegment(UserSegment.NORMIE)
                      ? 'Quick Actions'
                      : isSegment(UserSegment.CRYPTO_NATIVE)
                        ? 'Trading & Assets'
                        : 'Suite Controls'}
                  </Text>

                  <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {actions.map((action) => {
                      const IconComponent = action.icon
                      const isDisabled = !action.enabled

                      return (
                        <TouchableOpacity
                          key={action.id}
                          onPress={action.onPress}
                          disabled={isDisabled}
                          style={{
                            flex: 1,
                            minWidth: '30%',
                            paddingVertical: 12,
                            paddingHorizontal: 8,
                            borderRadius: 12,
                            backgroundColor: isDisabled ? '#f3f4f6' : '#eff6ff',
                            borderWidth: 1,
                            borderColor: isDisabled ? '#e5e7eb' : '#bfdbfe',
                            alignItems: 'center',
                            gap: 4,
                            opacity: isDisabled ? 0.6 : 1,
                          }}
                        >
                          <View style={{ position: 'relative' }}>
                            <IconComponent
                              size={20}
                              color={isDisabled ? '#d1d5db' : '#0284c7'}
                            />
                            {isDisabled && (
                              <Lock
                                size={10}
                                color="#ef4444"
                                style={{
                                  position: 'absolute',
                                  right: -4,
                                  bottom: -4,
                                }}
                              />
                            )}
                          </View>
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '600',
                              color: isDisabled ? '#9ca3af' : '#0c4a6e',
                              textAlign: 'center',
                            }}
                          >
                            {action.label}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>

                  {isSegment(UserSegment.NORMIE) && (
                    <View className="mt-4 gap-3">
                      <TouchableOpacity
                        className="bg-blue-600 px-4 py-3 rounded-lg shadow-md active:shadow-lg active:scale-95 transition-all"
                        onPress={() => setShowUpgradeModal(true)}
                      >
                        <Text className="text-white font-bold text-center text-sm">
                          🚀 Upgrade to Web3
                        </Text>
                      </TouchableOpacity>
                      <View className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                        <Text className="text-xs text-blue-700 dark:text-blue-300 text-center">
                          💡 Unlock Swap, Bridge, Staking, NFTs & more
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            }
            scrollEnabled={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </SafeAreaView>

      <UnlockPrompt
        visible={showUnlockPrompt}
        segment={segment}
        onDismiss={() => setShowUnlockPrompt(false)}
        onUpgrade={() => {
          setShowUnlockPrompt(false)
          setShowUpgradeModal(true)
        }}
      />

      <UpgradeToWeb3
        visible={showUpgradeModal}
        onDismiss={() => setShowUpgradeModal(false)}
        onSuccess={() => {
          setShowUpgradeModal(false)
          setShowUnlockPrompt(false)
        }}
        onRouteToPasskey={() => {
          setShowUpgradeModal(false)
        }}
      />
    </>
  )
}
