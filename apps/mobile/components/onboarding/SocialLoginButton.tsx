import {
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

interface SocialLoginButtonProps {
  label: string;
  icon: LucideIcon;
  iconColor: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  error?: string;
}

export default function SocialLoginButton({
  label,
  icon: Icon,
  iconColor,
  onPress,
  loading = false,
  disabled = false,
  error,
}: SocialLoginButtonProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View>
      <TouchableOpacity
        onPress={onPress}
        disabled={loading || disabled}
        activeOpacity={0.85}
        className={`flex-row items-center justify-center gap-3 py-4 px-6 rounded-2xl border-2 ${
          isDark
            ? 'bg-orya-ocean/50 border-orya-sea-blue/30'
            : 'bg-white border-orya-sea-blue/30'
        } ${loading || disabled ? 'opacity-60' : ''}`}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={isDark ? '#FFD700' : '#4DA2FF'}
          />
        ) : (
          <Icon size={20} color={iconColor} />
        )}

        <Text
          className={`font-semibold text-center flex-1 ${
            isDark ? 'text-white' : 'text-orya-charcoal'
          }`}
        >
          {loading ? `Signing in...` : `Sign in with ${label}`}
        </Text>
      </TouchableOpacity>

      {error && (
        <Text className="text-red-500 text-sm mt-2 text-center">
          {error}
        </Text>
      )}
    </View>
  );
}
