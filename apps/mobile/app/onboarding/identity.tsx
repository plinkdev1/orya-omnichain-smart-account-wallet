import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import {
  Zap,
  Shield,
  Building2,
  Wallet,
} from 'lucide-react-native';
import { useOnboardingStore, UserSegment } from '../../lib/onboardingStore';
import IdentityButton from '../../components/onboarding/IdentityButton';

interface IdentityOption {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  segment: UserSegment;
  flow: 'normie' | 'crypto_native' | 'external' | 'institutional';
}

const IDENTITY_OPTIONS: IdentityOption[] = [
  {
    id: 'normie',
    title: 'Simple Wallet',
    description: 'Payments + cards (custodial HNW)',
    icon: Wallet,
    color: '#4DA2FF',
    segment: UserSegment.NORMIE,
    flow: 'normie',
  },
  {
    id: 'crypto',
    title: 'Next-gen Web3',
    description: 'Full DeFi + NFTs (SUI-native MPC)',
    icon: Zap,
    color: '#FFD700',
    segment: UserSegment.CRYPTO_NATIVE,
    flow: 'crypto_native',
  },
  {
    id: 'external',
    title: 'I Already Have a Wallet',
    description: 'Connect Phantom, MetaMask, etc.',
    icon: Shield,
    color: '#4DA2FF',
    segment: UserSegment.EXTERNAL_CONNECTED,
    flow: 'external',
  },
  {
    id: 'institutional',
    title: 'Company or DAO',
    description: 'Multi-sig treasury suite',
    icon: Building2,
    color: '#FFD700',
    segment: UserSegment.INSTITUTIONAL,
    flow: 'institutional',
  },
];

export default function IdentityScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const setFlow = useOnboardingStore((state) => state.setFlow);
  const setUserSegment = useOnboardingStore((state) => state.setUserSegment);

  const handleSelectIdentity = (option: IdentityOption) => {
    setUserSegment(option.segment);
    setFlow(option.flow as any);
    router.push(`/onboarding/${option.flow}`);
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-orya-ocean' : 'bg-orya-cream'}`}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-6 py-8">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-orya-charcoal dark:text-white mb-2">
              How do you want to use this wallet?
            </Text>
            <Text className="text-base text-gray-600 dark:text-gray-400">
              Choose your path, upgrade anytime
            </Text>
          </View>

          <View className="gap-4 mb-6">
            {IDENTITY_OPTIONS.map((option) => (
              <IdentityButton
                key={option.id}
                label={option.title}
                description={option.description}
                icon={option.icon}
                iconColor={option.color}
                onPress={() => handleSelectIdentity(option)}
              />
            ))}
          </View>

          <View className="mt-auto">
            <Text className="text-xs text-gray-600 dark:text-gray-400 text-center">
              You can upgrade your path anytime after onboarding
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
