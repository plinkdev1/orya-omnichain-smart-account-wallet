import React, { createContext, useContext, useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BrandingMode = 'orya' | 'normie';

export interface BrandingContextType {
  brandingMode: BrandingMode;
  setBrandingMode: (mode: BrandingMode) => void;
  toggleBranding: () => void;
  showOnboardingPopup: boolean;
  setShowOnboardingPopup: (show: boolean) => void;
  hasSeenOnboarding: boolean;
  markOnboardingAsSeen: () => void;
}

const BrandingContextDefault: BrandingContextType = {
  brandingMode: 'orya',
  setBrandingMode: () => {},
  toggleBranding: () => {},
  showOnboardingPopup: false,
  setShowOnboardingPopup: () => {},
  hasSeenOnboarding: false,
  markOnboardingAsSeen: () => {},
};

export const BrandingContext = createContext<BrandingContextType>(BrandingContextDefault);

export const useBrandingStore = create<BrandingContextType>()(
  persist(
    (set) => ({
      brandingMode: 'orya',
      showOnboardingPopup: false,
      hasSeenOnboarding: false,

      setBrandingMode: (mode: BrandingMode) => {
        set({ brandingMode: mode });
      },

      toggleBranding: () => {
        set((state) => ({
          brandingMode: state.brandingMode === 'orya' ? 'normie' : 'orya',
        }));
      },

      setShowOnboardingPopup: (show: boolean) => {
        set({ showOnboardingPopup: show });
      },

      markOnboardingAsSeen: () => {
        set({ hasSeenOnboarding: true, showOnboardingPopup: false });
      },
    }),
    {
      name: 'branding-store',
    }
  )
);

interface BrandingProviderProps {
  children: React.ReactNode;
  defaultMode?: BrandingMode;
}

export function BrandingProvider({ children, defaultMode = 'orya' }: BrandingProviderProps) {
  const store = useBrandingStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (defaultMode !== store.brandingMode && !store.hasSeenOnboarding) {
      store.setBrandingMode(defaultMode);
    }
  }, []);

  const contextValue: BrandingContextType = {
    brandingMode: store.brandingMode,
    setBrandingMode: store.setBrandingMode,
    toggleBranding: store.toggleBranding,
    showOnboardingPopup: store.showOnboardingPopup && mounted,
    setShowOnboardingPopup: store.setShowOnboardingPopup,
    hasSeenOnboarding: store.hasSeenOnboarding,
    markOnboardingAsSeen: store.markOnboardingAsSeen,
  };

  return (
    <BrandingContext.Provider value={contextValue}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandingContextType {
  const context = useContext(BrandingContext);
  if (!context) {
    return BrandingContextDefault;
  }
  return context;
}

export const BrandingSwitch = {
  text: (oryaText: string, normieText: string, mode: BrandingMode): string => {
    return mode === 'orya' ? oryaText : normieText;
  },

  element: (oryaElement: React.ReactNode, normieElement: React.ReactNode, mode: BrandingMode): React.ReactNode => {
    return mode === 'orya' ? oryaElement : normieElement;
  },

  className: (oryaClass: string, normieClass: string, mode: BrandingMode): string => {
    return mode === 'orya' ? oryaClass : normieClass;
  },

  condition: (mode: BrandingMode, oryaValue: any, normieValue: any): any => {
    return mode === 'orya' ? oryaValue : normieValue;
  },
};
