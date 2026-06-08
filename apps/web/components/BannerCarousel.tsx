'use client'
import React, { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

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
  showNavigationArrows?: boolean
  cardWidth?: string
  gap?: string
  className?: string
}

export function BannerCarousel({
  cards,
  autoScrollInterval = 6000,
  onCardClick,
  showIndicators = true,
  showNavigationArrows = true,
  cardWidth = 'w-80',
  gap = 'gap-4',
  className = '',
}: BannerCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoScroll, setIsAutoScroll] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const [visibleCards, setVisibleCards] = useState<BannerCard[]>(cards)
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setVisibleCards(cards.filter(card => card.id !== 'dismissed'))
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
    if (scrollContainerRef.current) {
      const scrollWidth = scrollContainerRef.current.scrollWidth
      const clientWidth = scrollContainerRef.current.clientWidth
      const cardWidthPx = clientWidth / 3

      scrollContainerRef.current.scrollTo({
        left: currentIndex * (cardWidthPx + 16),
        behavior: 'smooth',
      })
    }
  }, [currentIndex])

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart(e.clientX)
    setIsAutoScroll(false)
  }

  const handleDragEnd = (e: React.MouseEvent) => {
    if (!isDragging) return

    const dragEnd = e.clientX
    const diff = dragStart - dragEnd

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }

    setIsDragging(false)
    setIsAutoScroll(true)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setDragStart(e.touches[0].clientX)
    setIsAutoScroll(false)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return

    const dragEnd = e.changedTouches[0].clientX
    const diff = dragStart - dragEnd

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }

    setIsDragging(false)
    setIsAutoScroll(true)
  }

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

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={containerRef}
        className="relative"
        onMouseLeave={() => setIsAutoScroll(true)}
        onMouseEnter={() => setIsAutoScroll(false)}
      >
        <div
          ref={scrollContainerRef}
          className={`flex overflow-x-auto snap-x snap-mandatory scrollbar-hide ${gap}`}
          style={{
            scrollBehavior: isDragging ? 'auto' : 'smooth',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory',
          }}
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
          onMouseMove={isDragging ? (e) => e.preventDefault() : undefined}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {visibleCards.map((card, index) => (
            <div
              key={card.id}
              className={`${cardWidth} flex-shrink-0 snap-center`}
              onClick={() => {
                onCardClick?.(card.id)
                card.onCtaClick?.()
              }}
            >
              <div
                className={`relative h-full rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between p-6 cursor-pointer group`}
                style={{
                  background: card.gradient || card.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  minHeight: '200px',
                }}
              >
                {card.isDismissible && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDismiss(card.id)
                    }}
                    className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}

                {card.image && (
                  <div className="absolute inset-0 opacity-20">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="relative z-10">
                  {card.icon && (
                    <div className="mb-3 text-white">{card.icon}</div>
                  )}
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-white/90 line-clamp-2">
                    {card.description}
                  </p>
                </div>

                {card.ctaText && (
                  <div className="relative z-10 mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        card.onCtaClick?.()
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-white text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors duration-200 transform group-hover:scale-105"
                    >
                      {card.ctaText}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {showNavigationArrows && visibleCards.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all hover:scale-110 hidden md:flex items-center justify-center"
              aria-label="Previous card"
            >
              <ChevronLeft className="w-5 h-5 text-gray-900" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all hover:scale-110 hidden md:flex items-center justify-center"
              aria-label="Next card"
            >
              <ChevronRight className="w-5 h-5 text-gray-900" />
            </button>
          </>
        )}
      </div>

      {showIndicators && visibleCards.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {visibleCards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? 'w-8 h-2 bg-primary'
                  : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
