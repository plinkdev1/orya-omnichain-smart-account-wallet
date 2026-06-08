import { useRouter } from 'expo-router';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Building2 } from 'lucide-react-native';

export default function InstitutionalOnboardingScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-orya-ocean' : 'bg-orya-cream'}`}
    >
      <View className="flex-1 justify-center items-center px-6">
        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-full bg-gradient-to-br from-orya-sea-blue/20 to-orya-neon-gold/20 items-center justify-center mb-6">
            <Building2 size={48} color="#FFD700" />
          </View>
          <Text className="text-3xl font-bold text-orya-charcoal dark:text-white text-center mb-3">
            Institutional Suite
          </Text>
          <Text className="text-base text-gray-600 dark:text-gray-400 text-center">
            KYB + Multi-sig treasury{'\n'}(Compliance & analytics)
          </Text>
        </View>

        <View className="gap-3 w-full mt-8">
          <TouchableOpacity
            className="bg-gradient-to-r from-orya-sea-blue to-orya-sea-blue/80 rounded-2xl py-4"
            onPress={() => router.push('/onboarding/inst/kyb-flow')}
          >
            <Text className="text-white font-bold text-center">Activate Suite</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-3 rounded-2xl border border-orya-sea-blue/30"
            onPress={() => router.back()}
          >
            <Text className="text-orya-sea-blue font-semibold text-center">Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
