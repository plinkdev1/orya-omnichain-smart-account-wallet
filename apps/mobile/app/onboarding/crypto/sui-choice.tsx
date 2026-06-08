import { useRouter } from 'expo-router';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Wallet, Plus } from 'lucide-react-native';
import { useOnboardingStore } from '../../../lib/onboardingStore';

export default function SUIChoiceScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { setAuthMethod, setStep } = useOnboardingStore();

  const handleExistingWallet = () => {
    setAuthMethod('connect');
    setStep(1);
    router.push('/(onboarding)/crypto/sui-connect');
  };

  const handleCreateWallet = () => {
    setAuthMethod('create-wallet');
    setStep(2);
    router.push('/(onboarding)/crypto/sui-create');
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-orya-ocean' : 'bg-orya-cream'}`}
    >
      <View className="flex-1 justify-center items-center px-6">
        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-full bg-gradient-to-br from-orya-sea-blue/20 to-orya-neon-gold/20 items-center justify-center mb-6">
            <Wallet size={48} color="#4DA2FF" />
          </View>
          <Text className="text-3xl font-bold text-orya-charcoal dark:text-white text-center mb-3">
            Do you have a SUI wallet?
          </Text>
          <Text className="text-base text-gray-600 dark:text-gray-400 text-center">
            Connect to sync assets OR create new for full control
          </Text>
        </View>

        <View className="gap-3 w-full mt-8">
          <TouchableOpacity
            className="bg-gradient-to-r from-orya-sea-blue to-orya-sea-blue/80 rounded-2xl py-4 flex-row items-center justify-center gap-2"
            onPress={handleExistingWallet}
          >
            <Wallet size={20} color="white" />
            <Text className="text-white font-bold text-center flex-1">
              I have an existing wallet
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gradient-to-r from-orya-neon-gold/20 to-orya-neon-gold/10 rounded-2xl py-4 border border-orya-neon-gold/40 flex-row items-center justify-center gap-2"
            onPress={handleCreateWallet}
          >
            <Plus size={20} color="#FFD700" />
            <Text className="text-orya-neon-gold font-bold text-center flex-1">
              Create a new SUI wallet
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-3 rounded-2xl border border-orya-sea-blue/30 mt-4"
            onPress={() => router.back()}
          >
            <Text className="text-orya-sea-blue font-semibold text-center">Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
