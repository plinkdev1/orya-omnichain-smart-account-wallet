import { TouchableOpacity, View, Text } from 'react-native';
import { LucideIcon, ArrowRight } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

interface IdentityButtonProps {
  label: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  onPress: () => void;
}

export default function IdentityButton({
  label,
  description,
  icon: Icon,
  iconColor,
  onPress,
}: IdentityButtonProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-gradient-to-br from-orya-sea-blue/10 to-orya-neon-gold/10 rounded-3xl p-6 border border-orya-sea-blue/20 active:bg-orya-sea-blue/20 active:scale-105"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-4">
          <View className="flex-row items-center gap-3 mb-2">
            <View className="w-12 h-12 rounded-xl bg-gradient-to-br from-orya-sea-blue/20 to-orya-neon-gold/20 items-center justify-center">
              <Icon size={24} color={iconColor} />
            </View>
            <Text className="text-lg font-bold text-orya-charcoal dark:text-white flex-1">
              {label}
            </Text>
          </View>
          <Text className="text-sm text-gray-600 dark:text-gray-400 ml-15">
            {description}
          </Text>
        </View>
        <View className="items-center justify-center">
          <ArrowRight
            size={20}
            color={isDark ? '#FFD700' : '#4DA2FF'}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}
