import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  PanResponder,
  GestureResponderEvent,
} from 'react-native'
import { X } from 'lucide-react-native'

export interface BannerCard {
  id: string
  title: string
  description: string
  image?: string
  icon?: React.ReactNode
  backgroundColor?: string
  gradient?: string
  ctaText?: string
  ctaLink?: string
  onCtaClick?: () => void
  isDismissible?: boolean
}

interface BannerCarouselProps {
  cards: BannerCard[]
  autoScrollInterval?: number
  onCardClick?: (cardId: string) => void
  showIndicators?: boolean
  gap?: number
  className?: string
}

const SCREEN_WIDTH = Dimensions.get('window').width
const CARD_WIDTH = SCREEN_WIDTH - 32

export function BannerCarousel({
  cards,
  autoScrollInterval = 6000,
  onCardClick,
  showIndicators = true,
  gap = 16,
  className = '',
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoScroll, setIsAutoScroll] = useState(true)
  const [visibleCards, setVisibleCards] = useState<BannerCard[]>(cards)
  const scrollViewRef = useRef<ScrollView>(null)
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        setIsAutoScroll(false)

        if (Math.abs(gestureState.dx) > 50) {
          if (gestureState.dx > 0) {
            handlePrev()
          } else {
            handleNext()
          }
        }

        setTimeout(() => setIsAutoScroll(true), 500)
      },
    })
  ).current

  useEffect(() => {
    setVisibleCards(cards.filter((card) => card.id !== 'dismissed'))
  }, [cards])

  useEffect(() => {
    if (!isAutoScroll || visibleCards.length <= 1) return

    autoScrollTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % visibleCards.length)
    }, autoScrollInterval)

    return () => {
      if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current)
    }
  }, [isAutoScroll, visibleCards.length, autoScrollInterval])

  useEffect(() => {
    if (scrollViewRef.current && visibleCards.length > 0) {
      const offset = currentIndex * (CARD_WIDTH + gap)
      scrollViewRef.current.scrollTo({
        x: offset,
        animated: true,
      })
    }
  }, [currentIndex, gap])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + visibleCards.length) % visibleCards.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % visibleCards.length)
  }

  const handleDismiss = (cardId: string) => {
    setVisibleCards((prev) => prev.filter((card) => card.id !== cardId))
    if (currentIndex >= visibleCards.length - 1) {
      setCurrentIndex(Math.max(0, currentIndex - 1))
    }
  }

  if (visibleCards.length === 0) return null

  const gradients: Record<string, string> = {
    primary: 'from-blue-500 to-blue-700',
    secondary: 'from-purple-500 to-purple-700',
    success: 'from-green-500 to-green-700',
    warning: 'from-amber-500 to-amber-700',
    danger: 'from-red-500 to-red-700',
  }

  return (
    <View className="w-full">
      <View
        className="relative"
        onMouseLeave={() => setIsAutoScroll(true)}
        onMouseEnter={() => setIsAutoScroll(false)}
        {...panResponder.panHandlers}
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          snapToInterval={CARD_WIDTH + gap}
          decelerationRate="fast"
          onMomentumScrollBegin={() => setIsAutoScroll(false)}
          onMomentumScrollEnd={() => setIsAutoScroll(true)}
        >
          {visibleCards.map((card) => (
            <View key={card.id} className={`px-2`} style={{ width: CARD_WIDTH + gap }}>
              <TouchableOpacity
                onPress={() => {
                  onCardClick?.(card.id)
                  card.onCtaClick?.()
                }}
                activeOpacity={0.9}
                style={{
                  width: CARD_WIDTH,
                }}
              >
                <View
                  className="rounded-3xl overflow-hidden shadow-lg flex flex-col justify-between p-6"
                  style={{
                    minHeight: 200,
                    backgroundColor: card.backgroundColor || '#667eea',
                    background: card.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  {card.isDismissible && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation?.()
                        handleDismiss(card.id)
                      }}
                      className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20"
                    >
                      <X size={16} color="white" />
                    </TouchableOpacity>
                  )}

                  {card.image && (
                    <Image
                      source={{ uri: card.image }}
                      className="absolute inset-0 opacity-20"
                      style={{ width: CARD_WIDTH, height: 200 }}
                      resizeMode="cover"
                    />
                  )}

                  <View className="relative z-10">
                    {card.icon && <View className="mb-3 text-white">{card.icon}</View>}
                    <Text className="text-lg font-bold text-white mb-2 line-clamp-2">
                      {card.title}
                    </Text>
                    <Text className="text-sm text-white/90 line-clamp-2">
                      {card.description}
                    </Text>
                  </View>

                  {card.ctaText && (
                    <View className="relative z-10 mt-4">
                      <TouchableOpacity
                        onPress={(e) => {
                          e.preventDefault?.()
                          card.onCtaClick?.()
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-white active:bg-gray-100"
                      >
                        <Text className="text-sm font-semibold text-gray-900 text-center">
                          {card.ctaText}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {showIndicators && visibleCards.length > 1 && (
        <View className="mt-4 flex-row items-center justify-center gap-2">
          {visibleCards.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setCurrentIndex(index)}
              className={`rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 h-2 bg-primary'
                  : 'w-2 h-2 bg-gray-300'
              }`}
            />
          ))}
        </View>
      )}
    </View>
  )
}
