import { useRouter } from 'expo-router'
import {
    ArrowLeft,
    ArrowRight,
    Menu,
    TrendingUp
} from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { useState } from 'react'
import {
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { PortfolioOverview } from '@/components/Portfolio/PortfolioOverview'
import { TransactionHistory } from '@/components/Portfolio/TransactionHistory'
import { useWallet } from '@orya/wallet-core'

const TRANSFER_OPTIONS = [
  { id: 'fiat-to-crypto', label: 'Fiat → Crypto', icon: '📥' },
  { id: 'crypto-to-fiat', label: 'Crypto → Fiat', icon: '📤' },
]

const TABS = [
  { id: 'portfolio', label: 'Portfolio', icon: TrendingUp },
  { id: 'flow', label: 'Flow', icon: ArrowRight },
]

export default function FlowScreen() {
  const { colorScheme } = useColorScheme()
  const router = useRouter()
  const { selectedWallet } = useWallet()
  const isDark = colorScheme === 'dark'
  const [transferType, setTransferType] = useState('fiat-to-crypto')
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState('')
  const [activeTab, setActiveTab] = useState('portfolio')

  const bgColor = isDark ? 'bg-slate-900' : 'bg-slate-50'
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white'
  const textColor = isDark ? 'text-slate-50' : 'text-slate-900'
  const mutedColor = isDark ? 'text-slate-400' : 'text-slate-500'

  if (!selectedWallet) {
    return (
      <SafeAreaView className={`flex-1 ${bgColor} justify-center items-center`}>
        <Text className={`${textColor} text-lg`}>Please connect a wallet</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={isDark ? '#64748b' : '#64748b'} />
        </TouchableOpacity>
        <Text className={`text-2xl font-bold ${textColor}`}>Flow</Text>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Menu size={24} color={isDark ? '#64748b' : '#64748b'} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row px-4 pt-4 gap-2">
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 rounded-2xl items-center justify-center ${
              activeTab === tab.id
                ? 'bg-amber-500'
                : isDark
                  ? 'bg-slate-700'
                  : 'bg-slate-200'
            }`}
          >
            <Text className={`font-semibold ${activeTab === tab.id ? 'text-white' : textColor}`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <PortfolioOverview
            address={selectedWallet.address}
            chainId={selectedWallet.chainId}
          />
          <TransactionHistory
            address={selectedWallet.address}
            chainId={selectedWallet.chainId}
          />
        </ScrollView>
      )}

      {/* Flow Tab */}
      {activeTab === 'flow' && (
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Description */}
        <View className="px-4 py-3">
          <Text className={`${mutedColor} text-sm`}>Seamless fiat ↔ crypto bridge</Text>
        </View>

        {/* Transfer Type Toggle */}
        <View className="px-4 gap-2 mb-4 flex-row">
          {TRANSFER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              onPress={() => {
                setTransferType(opt.id)
                setStep(1)
              }}
              className={`flex-1 py-3 rounded-2xl items-center ${
                transferType === opt.id
                  ? 'bg-amber-500'
                  : isDark
                    ? 'bg-slate-700'
                    : 'bg-slate-200'
              }`}
            >
              <Text className={`font-semibold ${transferType === opt.id ? 'text-white' : textColor}`}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Step Indicator */}
        <View className="px-4 flex-row items-center justify-between mb-4">
          <View className="flex-row gap-1 flex-1">
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                className={`flex-1 h-1 rounded-full ${
                  s === step
                    ? 'bg-amber-500 w-8'
                    : s < step
                      ? 'bg-amber-300'
                      : isDark
                        ? 'bg-slate-700'
                        : 'bg-slate-300'
                }`}
              />
            ))}
          </View>
          <Text className={`ml-2 font-semibold ${textColor}`}>
            {step}/3
          </Text>
        </View>

        {/* Step 1: Enter Amount */}
        {step === 1 && (
          <View className={`mx-4 p-4 rounded-2xl ${cardBg} mb-4`}>
            <Text className={`${mutedColor} text-sm mb-2`}>
              {transferType === 'fiat-to-crypto' ? 'You Pay (Fiat)' : 'You Sell (Crypto)'}
            </Text>
            <View className="flex-row items-center rounded-xl mb-4">
              <TextInput
                placeholder="0.00"
                placeholderTextColor={isDark ? '#94a3b8' : '#cbd5e1'}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                className={`flex-1 text-lg font-semibold px-3 py-3 ${isDark ? 'bg-slate-700 text-slate-50' : 'bg-slate-100 text-slate-900'} rounded-2xl`}
              />
              <View className={`px-3 py-2 rounded-2xl ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                <Text className={`font-semibold ${textColor}`}>
                  {transferType === 'fiat-to-crypto' ? 'USD' : 'BTC'}
                </Text>
              </View>
            </View>

            <View className={`p-3 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <Text className={`${mutedColor} text-xs mb-1`}>You Receive</Text>
              <Text className={`text-xl font-bold ${textColor}`}>
                {transferType === 'fiat-to-crypto' ? '0.025 BTC' : '$1,234'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setStep(2)}
              className="bg-amber-500 rounded-xl py-3 mt-4"
            >
              <Text className="text-white text-center font-bold">Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Select Method */}
        {step === 2 && (
          <View className="mx-4 gap-3 mb-4">
            <View className={`p-4 rounded-2xl ${cardBg} flex-row items-center`}>
              <View className="w-12 h-12 rounded-xl bg-blue-500 items-center justify-center mr-3">
                <Text className="text-lg">💳</Text>
              </View>
              <View className="flex-1">
                <Text className={`font-semibold ${textColor}`}>Credit/Debit Card</Text>
                <Text className={`${mutedColor} text-xs`}>Instant transfer • 2.5% fee</Text>
              </View>
              <TouchableOpacity onPress={() => setStep(3)}>
                <ArrowRight size={20} color="#D4C29E" />
              </TouchableOpacity>
            </View>

            <View className={`p-4 rounded-2xl ${cardBg} flex-row items-center`}>
              <View className="w-12 h-12 rounded-xl bg-green-500 items-center justify-center mr-3">
                <Text className="text-lg">🏦</Text>
              </View>
              <View className="flex-1">
                <Text className={`font-semibold ${textColor}`}>Bank Transfer</Text>
                <Text className={`${mutedColor} text-xs`}>1-3 days • 0.5% fee</Text>
              </View>
              <TouchableOpacity onPress={() => setStep(3)}>
                <ArrowRight size={20} color="#D4C29E" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setStep(1)}
              className="bg-slate-300 dark:bg-slate-700 rounded-xl py-3 mt-4"
            >
              <Text className={`text-center font-bold ${textColor}`}>Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <View className={`mx-4 p-4 rounded-2xl ${cardBg} mb-4`}>
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-green-500 items-center justify-center">
                <Text className="text-2xl">✓</Text>
              </View>
            </View>
            <Text className={`text-center text-lg font-bold ${textColor} mb-2`}>
              Ready to {transferType === 'fiat-to-crypto' ? 'buy' : 'sell'}
            </Text>
            <Text className={`text-center ${mutedColor} text-sm mb-4`}>
              Review your transaction details below
            </Text>

            <View className={`p-3 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-slate-100'} mb-4`}>
              <View className="flex-row justify-between mb-2">
                <Text className={mutedColor}>Amount</Text>
                <Text className={`font-semibold ${textColor}`}>{amount || '0.00'}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className={mutedColor}>Fee</Text>
                <Text className={`font-semibold ${textColor}`}>$30.87</Text>
              </View>
              <View className="border-t border-slate-400 dark:border-slate-600 py-2 flex-row justify-between">
                <Text className={`font-semibold ${textColor}`}>Total</Text>
                <Text className={`font-bold text-lg text-green-500`}>$1,234.87</Text>
              </View>
            </View>

            <TouchableOpacity className="bg-green-500 rounded-xl py-4 mb-2">
              <Text className="text-white text-center font-bold text-lg">Confirm & Complete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStep(2)}
              className="bg-slate-300 dark:bg-slate-700 rounded-xl py-3"
            >
              <Text className={`text-center font-bold ${textColor}`}>Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Transfers */}
        <View className="px-4 pb-8">
          <Text className={`font-bold text-lg ${textColor} mb-3`}>Recent Transfers</Text>
          {[
            { date: 'Today', amount: '$1,200', type: 'BTC', status: 'completed' },
            { date: 'Yesterday', amount: '$500', type: 'ETH', status: 'completed' },
            { date: '2 days ago', amount: '$300', type: 'USDC', status: 'completed' },
          ].map((t, i) => (
            <View
              key={i}
              className={`p-3 rounded-xl mb-2 flex-row items-center justify-between ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}
            >
              <View>
                <Text className={`font-semibold ${textColor}`}>{t.type}</Text>
                <Text className={`text-xs ${mutedColor}`}>{t.date}</Text>
              </View>
              <Text className={`font-semibold ${textColor}`}>{t.amount}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      )}
    </SafeAreaView>
  )
}

