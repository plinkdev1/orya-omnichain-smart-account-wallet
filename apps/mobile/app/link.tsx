import {
    ArrowLeftRight,
    ArrowRight,
    Banknote,
    CreditCard,
    Menu,
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

export default function LinkScreen() {
  const { colorScheme } = useColorScheme()
  const [step, setStep] = useState(1)
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [fromChain, setFromChain] = useState('Ethereum')
  const [toChain, setToChain] = useState('Polygon')

  const isDark = colorScheme === 'dark'
  const bgColor = isDark ? '#111111' : '#F8F6F1'
  const fgColor = isDark ? '#F8F6F1' : '#1A1A1A'
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF'
  const primaryColor = isDark ? '#FFD700' : '#D4C29E'

  const chains = ['Ethereum', 'Solana', 'SUI', 'Polygon']
  const toChains = ['Polygon', 'Arbitrum', 'Base', 'Optimism']

  const handleStepChange = (newStep: number) => {
    if (newStep > 0 && newStep <= 3) {
      setStep(newStep)
    }
  }

  const StepIndicator = () => (
    <View className="flex-row gap-2 justify-end mb-6">
      {[1, 2, 3].map((s) => (
        <View
          key={s}
          className={`h-2 rounded-full transition-all ${
            s === step
              ? 'w-6 bg-pale-gold'
              : isDark
              ? 'w-2 bg-gray-700'
              : 'w-2 bg-gray-300'
          }`}
        />
      ))}
    </View>
  )

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
            ORŸA Link
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
            Cross-chain swaps & transfers
          </Text>
        </View>

        {/* Cross-Chain Transfer Card */}
        <View className={`mx-6 mb-6 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <View className="flex-row justify-between items-start mb-6">
            <Text className="text-lg font-semibold" style={{ color: fgColor }}>
              Cross-Chain Transfer
            </Text>
            <StepIndicator />
          </View>

          {/* Step 1: From Chain */}
          {step === 1 && (
            <View className="gap-4">
              <View>
                <Text
                  className="text-sm font-medium mb-2"
                  style={{ color: isDark ? '#888888' : '#999999' }}
                >
                  From Chain
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row gap-2"
                >
                  {chains.map((chain) => (
                    <TouchableOpacity
                      key={chain}
                      onPress={() => setFromChain(chain)}
                      className={`px-4 py-2.5 rounded-xl border ${
                        fromChain === chain
                          ? isDark
                            ? 'bg-pale-gold border-pale-gold'
                            : 'bg-pale-gold border-pale-gold'
                          : isDark
                          ? 'bg-gray-700 border-gray-600'
                          : 'bg-gray-100 border-gray-200'
                      }`}
                    >
                      <Text
                        className="text-sm font-medium"
                        style={{
                          color:
                            fromChain === chain
                              ? '#000'
                              : fgColor,
                        }}
                      >
                        {chain}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View>
                <Text
                  className="text-sm font-medium mb-2"
                  style={{ color: isDark ? '#888888' : '#999999' }}
                >
                  Amount
                </Text>
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor={
                    isDark ? '#888888' : '#999999'
                  }
                  value={fromAmount}
                  onChangeText={setFromAmount}
                  keyboardType="decimal-pad"
                  className={`h-12 px-4 rounded-xl border text-lg font-semibold ${
                    isDark
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-gray-100 border-gray-200'
                  }`}
                  style={{ color: fgColor }}
                />
              </View>

              <TouchableOpacity
                onPress={() => handleStepChange(2)}
                className="h-12 rounded-xl bg-pale-gold items-center justify-center flex-row gap-2 mt-2"
              >
                <Text className="text-sm font-semibold" style={{ color: '#000' }}>
                  Continue
                </Text>
                <ArrowRight size={16} color="#000" />
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: To Chain */}
          {step === 2 && (
            <View className="gap-4">
              <View className="items-center justify-center mb-4">
                <View className="w-12 h-12 rounded-full bg-pale-gold/20 items-center justify-center">
                  <ArrowLeftRight size={24} color={primaryColor} />
                </View>
              </View>

              <View>
                <Text
                  className="text-sm font-medium mb-2"
                  style={{ color: isDark ? '#888888' : '#999999' }}
                >
                  To Chain
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row gap-2"
                >
                  {toChains.map((chain) => (
                    <TouchableOpacity
                      key={chain}
                      onPress={() => setToChain(chain)}
                      className={`px-4 py-2.5 rounded-xl border ${
                        toChain === chain
                          ? isDark
                            ? 'bg-pale-gold border-pale-gold'
                            : 'bg-pale-gold border-pale-gold'
                          : isDark
                          ? 'bg-gray-700 border-gray-600'
                          : 'bg-gray-100 border-gray-200'
                      }`}
                    >
                      <Text
                        className="text-sm font-medium"
                        style={{
                          color:
                            toChain === chain
                              ? '#000'
                              : fgColor,
                        }}
                      >
                        {chain}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Text
                  className="text-xs font-medium mb-1"
                  style={{ color: isDark ? '#888888' : '#999999' }}
                >
                  Estimated Time
                </Text>
                <Text className="text-sm font-semibold" style={{ color: fgColor }}>
                  ~2-5 minutes
                </Text>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => handleStepChange(1)}
                  className={`flex-1 h-12 rounded-xl border items-center justify-center ${
                    isDark
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-gray-100 border-gray-200'
                  }`}
                >
                  <Text className="text-sm font-semibold" style={{ color: fgColor }}>
                    Back
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleStepChange(3)}
                  className="flex-1 h-12 rounded-xl bg-pale-gold items-center justify-center"
                >
                  <Text className="text-sm font-semibold" style={{ color: '#000' }}>
                    Review
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <View className="gap-4">
              <View className={`p-4 rounded-xl gap-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <View className="flex-row justify-between">
                  <Text
                    className="text-sm font-medium"
                    style={{ color: isDark ? '#888888' : '#999999' }}
                  >
                    From
                  </Text>
                  <Text className="text-sm font-semibold" style={{ color: fgColor }}>
                    {fromChain}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text
                    className="text-sm font-medium"
                    style={{ color: isDark ? '#888888' : '#999999' }}
                  >
                    To
                  </Text>
                  <Text className="text-sm font-semibold" style={{ color: fgColor }}>
                    {toChain}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text
                    className="text-sm font-medium"
                    style={{ color: isDark ? '#888888' : '#999999' }}
                  >
                    Amount
                  </Text>
                  <Text className="text-sm font-semibold" style={{ color: fgColor }}>
                    {fromAmount || '0.00'} ETH
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text
                    className="text-sm font-medium"
                    style={{ color: isDark ? '#888888' : '#999999' }}
                  >
                    Fee
                  </Text>
                  <Text className="text-sm font-semibold" style={{ color: fgColor }}>
                    0.002 ETH
                  </Text>
                </View>
              </View>

              <Text
                className="text-xs text-center font-serif"
                style={{ color: isDark ? '#888888' : '#999999' }}
              >
                Your transfer will be processed securely across chains
              </Text>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => handleStepChange(2)}
                  className={`flex-1 h-12 rounded-xl border items-center justify-center ${
                    isDark
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-gray-100 border-gray-200'
                  }`}
                >
                  <Text className="text-sm font-semibold" style={{ color: fgColor }}>
                    Back
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setStep(1)
                    setFromAmount('')
                  }}
                  className="flex-1 h-12 rounded-xl bg-pale-gold items-center justify-center"
                >
                  <Text className="text-sm font-semibold" style={{ color: '#000' }}>
                    Confirm Transfer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Quick Swap Card */}
        <View className={`mx-6 mb-6 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <Text className="text-lg font-semibold mb-4" style={{ color: fgColor }}>
            Quick Swap
          </Text>

          <View className="gap-4">
            <View>
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: isDark ? '#888888' : '#999999' }}
              >
                From
              </Text>
              <View className="flex-row gap-2">
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor={
                    isDark ? '#888888' : '#999999'
                  }
                  value={fromAmount}
                  onChangeText={setFromAmount}
                  keyboardType="decimal-pad"
                  className={`flex-1 h-12 px-4 rounded-xl border text-lg font-semibold ${
                    isDark
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-gray-100 border-gray-200'
                  }`}
                  style={{ color: fgColor }}
                />
                <TouchableOpacity
                  className={`px-4 rounded-xl border items-center justify-center ${
                    isDark
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-gray-100 border-gray-200'
                  }`}
                >
                  <Text className="text-sm font-semibold" style={{ color: fgColor }}>
                    ETH
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="items-center">
              <TouchableOpacity
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}
              >
                <ArrowLeftRight size={20} color={primaryColor} />
              </TouchableOpacity>
            </View>

            <View>
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: isDark ? '#888888' : '#999999' }}
              >
                To
              </Text>
              <View className="flex-row gap-2">
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor={
                    isDark ? '#888888' : '#999999'
                  }
                  value={toAmount}
                  onChangeText={setToAmount}
                  keyboardType="decimal-pad"
                  className={`flex-1 h-12 px-4 rounded-xl border text-lg font-semibold ${
                    isDark
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-gray-100 border-gray-200'
                  }`}
                  style={{ color: fgColor }}
                />
                <TouchableOpacity
                  className={`px-4 rounded-xl border items-center justify-center ${
                    isDark
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-gray-100 border-gray-200'
                  }`}
                >
                  <Text className="text-sm font-semibold" style={{ color: fgColor }}>
                    USDC
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity className="h-12 rounded-xl bg-pale-gold items-center justify-center flex-row gap-2">
              <Text className="text-sm font-semibold" style={{ color: '#000' }}>
                Swap Now
              </Text>
              <ArrowRight size={16} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Funds Methods */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold mb-4" style={{ color: fgColor }}>
            Add Funds
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className={`flex-1 p-4 rounded-2xl items-center ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <CreditCard size={24} color={primaryColor} className="mb-2" />
              <Text className="font-semibold text-sm" style={{ color: fgColor }}>
                Card
              </Text>
              <Text
                className="text-xs"
                style={{ color: isDark ? '#888888' : '#999999' }}
              >
                Instant deposit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 p-4 rounded-2xl items-center ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <Banknote size={24} color={primaryColor} className="mb-2" />
              <Text className="font-semibold text-sm" style={{ color: fgColor }}>
                Bank
              </Text>
              <Text
                className="text-xs"
                style={{ color: isDark ? '#888888' : '#999999' }}
              >
                1-3 business days
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Rates */}
        <View className="px-6">
          <Text className="text-lg font-semibold mb-4" style={{ color: fgColor }}>
            Live Rates
          </Text>
          <View className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            {[
              { from: 'USD', to: 'ETH', rate: '0.000298' },
              { from: 'USD', to: 'SOL', rate: '0.007234' },
              { from: 'USD', to: 'SUI', rate: '0.068421' },
              { from: 'EUR', to: 'ETH', rate: '0.000324' },
            ].map((rate, index) => (
              <View
                key={index}
                className={`flex-row justify-between py-3 ${
                  index < 3 ? `border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}` : ''
                }`}
              >
                <Text className="text-sm font-medium" style={{ color: fgColor }}>
                  {rate.from} → {rate.to}
                </Text>
                <Text
                  className="text-sm"
                  style={{ color: isDark ? '#888888' : '#999999' }}
                >
                  {rate.rate}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

