import { View, Text, Dimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Wallet, Zap, Shield, TrendingUp, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface VisualProps {
  delay?: number;
}

export function LogoGlow({ delay = 0 }: VisualProps) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    scale.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style} className="items-center justify-center mb-6">
      <View className="relative w-24 h-24">
        <View className="absolute inset-0 rounded-full bg-gradient-to-br from-orya-sea-blue/20 to-orya-neon-gold/20 blur-2xl" />
        <View className="absolute inset-0 rounded-full border-2 border-orya-sea-blue/30" />
        <View className="w-full h-full items-center justify-center">
          <Text className="text-4xl font-bold text-orya-sea-blue">◇</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const displayedText = useSharedValue('');
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.ease,
    });

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        displayedText.value = text.substring(0, currentIndex);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <Animated.Text
      numberOfLines={4}
      className="text-3xl font-bold text-orya-charcoal dark:text-white text-center leading-tight"
    >
      {displayedText.value}
      <Text className="text-orya-sea-blue">|</Text>
    </Animated.Text>
  );
}

export function HeroCards() {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    translateY.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={style} className="w-full">
      <View className="flex-row gap-4 px-4 mb-6">
        {[
          { icon: Wallet, label: 'Wallet' },
          { icon: Zap, label: 'Fast' },
          { icon: Shield, label: 'Secure' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <View
              key={idx}
              className="flex-1 bg-gradient-to-br from-orya-sea-blue/10 to-orya-neon-gold/10 rounded-2xl p-4 items-center justify-center border border-orya-sea-blue/20"
            >
              <Icon size={28} color="#4DA2FF" className="mb-2" />
              <Text className="text-xs font-semibold text-orya-charcoal dark:text-white text-center">
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

export function SUIGlowEffect() {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    scale.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style} className="items-center justify-center mb-8">
      <View className="relative w-32 h-32">
        <View className="absolute inset-0 rounded-full bg-gradient-to-br from-orya-sea-blue/30 to-transparent blur-3xl" />
        <View className="w-full h-full items-center justify-center rounded-full border-2 border-orya-sea-blue/40">
          <Text className="text-5xl font-bold text-orya-sea-blue">◆</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export function ButtonShowcase() {
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    translateY.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={style} className="w-full px-4 gap-3">
      {[
        { label: 'Simple Wallet', icon: '◈' },
        { label: 'Next-gen Web3', icon: '◆' },
        { label: 'I have a wallet', icon: '○' },
      ].map((btn, idx) => (
        <View
          key={idx}
          className="flex-row items-center gap-3 bg-gradient-to-r from-orya-sea-blue/5 to-orya-neon-gold/5 rounded-xl p-4 border border-orya-sea-blue/20"
        >
          <Text className="text-xl text-orya-neon-gold">{btn.icon}</Text>
          <Text className="text-sm font-semibold text-orya-charcoal dark:text-white flex-1">
            {btn.label}
          </Text>
          <Text className="text-xs text-orya-sea-blue">→</Text>
        </View>
      ))}
    </Animated.View>
  );
}

export function FutureGradient() {
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={style} className="w-full h-64 items-center justify-center">
      <View className="w-full h-full bg-gradient-to-br from-orya-sea-blue/20 via-orya-neon-gold/5 to-transparent rounded-3xl flex-row items-center justify-center gap-3">
        <Sparkles size={40} color="#4DA2FF" />
        <TrendingUp size={40} color="#FFD700" />
        <Wallet size={40} color="#4DA2FF" />
      </View>
    </Animated.View>
  );
}

export function ProgressDots({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <View className="flex-row gap-2 justify-center items-center">
      {Array.from({ length: total }).map((_, idx) => (
        <Animated.View
          key={idx}
          className={`rounded-full ${
            idx === current
              ? 'bg-orya-sea-blue w-3 h-3'
              : idx < current
                ? 'bg-orya-sea-blue/50 w-2 h-2'
                : 'bg-orya-sea-blue/20 w-2 h-2'
          }`}
        />
      ))}
    </View>
  );
}
