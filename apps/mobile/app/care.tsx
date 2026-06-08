import {
    AlertTriangle,
    ChevronDown,
    HelpCircle,
    Menu,
    MessageCircle,
    Phone,
    Send,
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

export default function CareScreen() {
  const { colorScheme } = useColorScheme()
  const [priority, setPriority] = useState('normal')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const isDark = colorScheme === 'dark'
  const fgColor = isDark ? '#F8F6F1' : '#1A1A1A'
  const primaryColor = isDark ? '#FFD700' : '#D4C29E'

  const faqs = [
    {
      q: 'How do I add funds to my wallet?',
      a: 'You can add funds via credit card, bank transfer, or crypto deposit. Go to ORŸA Link to get started.',
    },
    {
      q: 'What chains does ORŸA support?',
      a: 'ORŸA supports 150+ chains including Ethereum, Solana, SUI, Polygon, and many more. View all chains in the Chains page.',
    },
    {
      q: 'How do I upgrade my membership?',
      a: 'Visit ORŸA Circle to view tier requirements and upgrade options. Your tier is based on trading volume.',
    },
    {
      q: 'What are the trading fees?',
      a: 'Fees vary by membership tier: Silver 0.25%, Gold 0.1%, Platinum 0%. Check ORŸA Circle for details.',
    },
  ]

  const supportHistory = [
    { id: '#12345', subject: 'Transaction inquiry', status: 'Resolved', date: 'Oct 28' },
    { id: '#12344', subject: 'KYC verification', status: 'In Progress', date: 'Oct 25' },
    { id: '#12343', subject: 'Withdrawal question', status: 'Resolved', date: 'Oct 20' },
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
            ORŸA Care
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
            We're here to help, always
          </Text>
        </View>

        {/* Contact Methods */}
        <View className="flex-row gap-3 px-6 mb-6">
          <TouchableOpacity
            className={`flex-1 p-6 rounded-2xl items-center ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <MessageCircle size={32} color={primaryColor} className="mb-3" />
            <Text className="font-semibold text-sm" style={{ color: fgColor }}>
              Live Chat
            </Text>
            <Text
              className="text-xs mt-1"
              style={{ color: isDark ? '#888888' : '#999999' }}
            >
              Instant response
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 p-6 rounded-2xl items-center ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <Phone size={32} color={primaryColor} className="mb-3" />
            <Text className="font-semibold text-sm" style={{ color: fgColor }}>
              Call Us
            </Text>
            <Text
              className="text-xs mt-1"
              style={{ color: isDark ? '#888888' : '#999999' }}
            >
              24/7 available
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit Ticket */}
        <View className={`mx-6 mb-6 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <Text className="text-lg font-semibold mb-4" style={{ color: fgColor }}>
            Submit a Ticket
          </Text>

          <View className="gap-4">
            <View>
              <Text
                className="text-sm font-medium mb-3"
                style={{ color: isDark ? '#888888' : '#999999' }}
              >
                Priority
              </Text>
              <View className="flex-row gap-2">
                {[
                  { value: 'low', label: 'Low' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'high', label: 'High' },
                ].map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    onPress={() => setPriority(p.value)}
                    className={`flex-1 h-10 rounded-xl border-2 items-center justify-center ${
                      priority === p.value
                        ? isDark
                          ? 'bg-pale-gold border-pale-gold'
                          : 'bg-pale-gold border-pale-gold'
                        : isDark
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-gray-100 border-gray-200'
                    }`}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color: priority === p.value ? '#000' : fgColor,
                      }}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              placeholder="Subject"
              placeholderTextColor={isDark ? '#888888' : '#999999'}
              value={subject}
              onChangeText={setSubject}
              className={`h-12 px-4 rounded-xl border text-sm ${
                isDark
                  ? 'bg-gray-700 border-gray-600'
                  : 'bg-gray-100 border-gray-200'
              }`}
              style={{ color: fgColor }}
            />

            <TextInput
              placeholder="How can we help you today?"
              placeholderTextColor={isDark ? '#888888' : '#999999'}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              className={`px-4 py-3 rounded-xl border text-sm ${
                isDark
                  ? 'bg-gray-700 border-gray-600'
                  : 'bg-gray-100 border-gray-200'
              }`}
              style={{ color: fgColor }}
            />

            <TouchableOpacity className="h-12 rounded-xl bg-pale-gold items-center justify-center flex-row gap-2">
              <Send size={16} color="#000" />
              <Text className="text-sm font-semibold" style={{ color: '#000' }}>
                Send Message
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support History */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold mb-4" style={{ color: fgColor }}>
            Support History
          </Text>
          <View className="gap-3">
            {supportHistory.map((ticket) => (
              <TouchableOpacity
                key={ticket.id}
                className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold" style={{ color: fgColor }}>
                      {ticket.subject}
                    </Text>
                    <Text
                      className="text-xs mt-1"
                      style={{ color: isDark ? '#888888' : '#999999' }}
                    >
                      {ticket.id} • {ticket.date}
                    </Text>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full ${
                      ticket.status === 'Resolved'
                        ? 'bg-green-500/20'
                        : 'bg-pale-gold/20'
                    }`}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{
                        color:
                          ticket.status === 'Resolved' ? '#22c55e' : primaryColor,
                      }}
                    >
                      {ticket.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Security Alerts */}
        <View className={`mx-6 mb-6 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <View className="flex-row items-center gap-3 mb-4">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: '#ef4444' + '20' }}
            >
              <AlertTriangle size={20} color="#ef4444" />
            </View>
            <View>
              <Text className="text-base font-semibold" style={{ color: fgColor }}>
                Security Alerts
              </Text>
              <Text
                className="text-xs"
                style={{ color: isDark ? '#888888' : '#999999' }}
              >
                Stay informed about your account
              </Text>
            </View>
          </View>

          <View className={`p-3 rounded-xl border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
            <Text className="text-sm font-semibold mb-1" style={{ color: fgColor }}>
              New device login detected
            </Text>
            <Text
              className="text-xs"
              style={{ color: isDark ? '#888888' : '#999999' }}
            >
              iPhone 15 Pro • New York, US • 2 hours ago
            </Text>
          </View>
        </View>

        {/* FAQs */}
        <View className="px-6">
          <Text className="text-lg font-semibold mb-4" style={{ color: fgColor }}>
            Common Questions
          </Text>
          <View className="gap-2">
            {faqs.map((faq, index) => (
              <TouchableOpacity
                key={index}
                onPress={() =>
                  setExpandedFaq(expandedFaq === index ? null : index)
                }
                className={`p-4 rounded-2xl border ${
                  isDark
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3 flex-1">
                    <HelpCircle size={20} color={primaryColor} />
                    <Text className="text-sm font-medium flex-1" style={{ color: fgColor }}>
                      {faq.q}
                    </Text>
                  </View>
                  <ChevronDown
                    size={16}
                    color={isDark ? '#888888' : '#999999'}
                    style={{
                      transform: [
                        {
                          rotate: expandedFaq === index ? '180deg' : '0deg',
                        },
                      ],
                    }}
                  />
                </View>

                {expandedFaq === index && (
                  <View className="mt-3 pl-8">
                    <Text
                      className="text-xs leading-5"
                      style={{ color: isDark ? '#888888' : '#999999' }}
                    >
                      {faq.a}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

