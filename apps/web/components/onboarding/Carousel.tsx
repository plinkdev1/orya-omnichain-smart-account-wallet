'use client';

/**
 * Welcome Carousel Component
 * 5-slide value proposition carousel for onboarding welcome screen
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji or icon identifier
  color?: 'gold' | 'blue' | 'green' | 'purple' | 'rose';
}

interface CarouselProps {
  slides: CarouselSlide[];
  autoAdvance?: boolean;
  autoAdvanceInterval?: number;
  onSlideChange?: (index: number) => void;
  className?: string;
  testID?: string;
}

export const Carousel = ({
  slides,
  autoAdvance = false,
  autoAdvanceInterval = 5000,
  onSlideChange,
  className = '',
  testID,
}: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToSlide = (index: number) => {
    const validIndex = Math.max(0, Math.min(index, slides.length - 1));
    setCurrentIndex(validIndex);
    onSlideChange?.(validIndex);
  };

  const goToPrevious = () => {
    goToSlide(currentIndex - 1);
  };

  const goToNext = () => {
    goToSlide(currentIndex + 1);
  };

  const currentSlide = slides[currentIndex];

  return (
    <div
      data-testid={testID}
      className={`w-full max-w-2xl mx-auto ${className}`}
    >
      {/* Slide Container */}
      <div className="relative bg-gradient-to-br from-bone-white to-gray-50 dark:from-deep-charcoal dark:to-gray-900 rounded-3xl p-8 md:p-12 min-h-96 flex flex-col justify-between border border-gray-200 dark:border-gray-700 shadow-lg">
        {/* Icon/Emoji */}
        <div className="text-6xl md:text-7xl text-center mb-6 leading-none">
          {currentSlide.icon}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-4 text-center leading-tight">
            {currentSlide.title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 text-center leading-relaxed">
            {currentSlide.description}
          </p>
        </div>

        {/* Slide Counter */}
        <div className="text-center text-sm font-medium text-gray-500 dark:text-gray-400">
          {currentIndex + 1} / {slides.length}
        </div>
      </div>

      {/* Slide Indicators (Dots) */}
      <div className="flex justify-center gap-2 mt-8 mb-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`
              transition-all duration-300 rounded-full
              ${
                index === currentIndex
                  ? 'w-8 h-2.5 bg-pale-gold dark:bg-neon-gold'
                  : 'w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }
            `}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <div className="flex justify-between items-center gap-4">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className={`
            p-2 rounded-full transition-all duration-200
            ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }
            text-deep-charcoal dark:text-bone-white
          `}
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex-1 text-center text-sm text-gray-600 dark:text-gray-400">
          Use arrows or click dots to navigate
        </div>

        <button
          onClick={goToNext}
          disabled={currentIndex === slides.length - 1}
          className={`
            p-2 rounded-full transition-all duration-200
            ${
              currentIndex === slides.length - 1
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }
            text-deep-charcoal dark:text-bone-white
          `}
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};