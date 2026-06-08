import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { ChevronRight, X } from 'lucide-react-native';
import {
  LogoGlow,
  TypewriterText,
  HeroCards,
  SUIGlowEffect,
  ButtonShowcase,
  FutureGradient,
  ProgressDots,
} from '../../components/onboarding/IntroScreenVisuals';

const { width } = Dimensions.get('window');

const SCREENS = [
  {
    id: 'welcome',
    title: 'Welcome to ORŸA',
    description: 'Your gateway to Web3 starts here',
    content: () => <LogoGlow />,
  },
  {
    id: 'finance',
    title: 'Control Your Finance Future',
    description: 'Manage tokens, swaps, and rewards seamlessly',
    content: () => <HeroCards />,
  },
  {
    id: 'sui',
    title: 'Fast, Secure, SUI-first',
    description: 'Lightning-fast transactions, military-grade security',
    content: () => <SUIGlowEffect />,
  },
  {
    id: 'modes',
    title: 'Start Simple or Unlock Advanced Control',
    description: 'Choose your level: Beginner to Power User',
    content: () => <ButtonShowcase />,
  },
  {
    id: 'grow',
    title: 'Learn How ORŸA Grows With You',
    description: 'From simple payments to advanced DeFi',
    content: () => <FutureGradient />,
  },
];

export default function IntroScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentScreen, setCurrentScreen] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentScreen(currentIndex);
  };

  const handleNext = () => {
    if (currentScreen < SCREENS.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentScreen + 1) * width,
        animated: true,
      });
    } else {
      router.push('/onboarding/identity');
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/identity');
  };

  const screen = SCREENS[currentScreen];
  const Content = screen.content;

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-orya-ocean' : 'bg-orya-cream'}`}
    >
      {/* Header with Skip Button */}
      <View className="px-6 py-4 flex-row justify-between items-center">
        <View className="w-8" />
        <ProgressDots current={currentScreen} total={SCREENS.length} />
        <TouchableOpacity onPress={handleSkip} className="p-2">
          <X size={24} color={isDark ? '#FFD700' : '#4DA2FF'} />
        </TouchableOpacity>
      </View>

      {/* Main Content - Horizontal Scroll */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        className="flex-1"
      >
        {SCREENS.map((item, idx) => (
          <View
            key={item.id}
            className={`w-full px-6 py-8 ${isDark ? 'bg-orya-ocean' : 'bg-orya-cream'}`}
          >
            <View className="flex-1 justify-center items-center">
              {/* Visual Content */}
              <View className="w-full items-center mb-8">
                <Content />
              </View>

              {/* Text Content */}
              <View className="w-full items-center mb-8">
                <Text className="text-3xl font-bold text-orya-charcoal dark:text-white text-center mb-3 leading-tight">
                  {item.title}
                </Text>
                <Text className="text-base text-gray-600 dark:text-gray-400 text-center">
                  {item.description}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="px-6 py-6 gap-3">
        <TouchableOpacity
          onPress={handleNext}
          className="flex-row items-center justify-center bg-gradient-to-r from-orya-sea-blue to-orya-sea-blue/80 rounded-2xl py-4 shadow-lg"
        >
          <Text className="text-white font-bold text-center flex-1">
            {currentScreen === SCREENS.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <ChevronRight size={20} color="white" />
        </TouchableOpacity>

        {currentScreen > 0 && (
          <TouchableOpacity
            onPress={() => {
              scrollViewRef.current?.scrollTo({
                x: (currentScreen - 1) * width,
                animated: true,
              });
            }}
            className="py-3 rounded-2xl border border-orya-sea-blue/30"
          >
            <Text className="text-center text-orya-sea-blue font-semibold">
              Back
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
