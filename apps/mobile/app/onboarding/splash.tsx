import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';

export default function SplashScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);

  useEffect(() => {
    logoOpacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    logoScale.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    const timer = setTimeout(() => {
      router.replace('/onboarding/intro');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-orya-ocean' : 'bg-orya-cream'}`}>
      <View className="flex-1 items-center justify-center">
        <Animated.Text
          style={logoAnimatedStyle}
          className="text-6xl font-bold text-orya-sea-blue dark:text-orya-sea-blue mb-4"
        >
          ORŸA
        </Animated.Text>
        <Animated.Text
          style={logoAnimatedStyle}
          className="text-lg text-orya-charcoal dark:text-white font-light"
        >
          Your gateway to Web3
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}
