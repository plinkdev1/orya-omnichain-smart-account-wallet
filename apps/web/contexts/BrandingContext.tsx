'use client';

/**
 * Branding Context
 * Manages branding/copy mode toggle between branded and non-branded versions
 * Supports switching between standard and custom copy dictionaries
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { copyEN } from '../copy/en';
import { copyPremiumEN } from '../copy/premium-en';

export type BrandingMode = 'branded' | 'non-branded';

interface BrandingContextType {
  mode: BrandingMode;
  setMode: (mode: BrandingMode) => void;
  copy: typeof copyEN;
  isPremium: boolean;
  setPremium: (premium: boolean) => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

interface BrandingProviderProps {
  children: React.ReactNode;
}

export function BrandingProvider({ children }: BrandingProviderProps) {
  const [mode, setModeState] = useState<BrandingMode>('branded');
  const [isPremium, setPremiumState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('orya-branding-mode') as BrandingMode | null;
    const savedPremium = localStorage.getItem('orya-is-premium') === 'true';

    if (savedMode) {
      setModeState(savedMode);
    }
    setPremiumState(savedPremium);
    setIsLoaded(true);
  }, []);

  const setMode = useCallback((newMode: BrandingMode) => {
    setModeState(newMode);
    localStorage.setItem('orya-branding-mode', newMode);
  }, []);

  const setPremium = useCallback((premium: boolean) => {
    setPremiumState(premium);
    localStorage.setItem('orya-is-premium', premium ? 'true' : 'false');
  }, []);

  const copy = isPremium ? copyPremiumEN : copyEN;

  if (!isLoaded) {
    return <>{children}</>;
  }

  return (
    <BrandingContext.Provider
      value={{
        mode,
        setMode,
        copy,
        isPremium,
        setPremium,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within BrandingProvider');
  }
  return context;
}
