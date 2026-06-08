import React, { createContext, useContext, useEffect, ReactNode, FC } from 'react';
import { ReOwnWalletManager } from './ReOwnWalletManager';
import { reownConfig, initializeReOwnManager } from './config.example';

export interface ReOwnContextType {
  manager: ReOwnWalletManager | null;
  isReady: boolean;
  error: Error | null;
}

const ReOwnContext = createContext<ReOwnContextType | undefined>(undefined);

export interface ReOwnProviderProps {
  children: ReactNode;
  config?: typeof reownConfig;
  onError?: (error: Error) => void;
  onReady?: () => void;
}

export const ReOwnProvider: FC<ReOwnProviderProps> = ({
  children,
  config = reownConfig,
  onError,
  onReady
}) => {
  const [manager, setManager] = React.useState<ReOwnWalletManager | null>(null);
  const [isReady, setIsReady] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  useEffect(() => {
    try {
      if (!manager) {
        const initialized = initializeReOwnManager();
        setManager(initialized);
        setIsReady(true);
        onReady?.();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize ReOwn');
      setError(error);
      onError?.(error);
      console.error('ReOwn initialization failed:', error);
    }
  }, []);

  return (
    <ReOwnContext.Provider value={{ manager, isReady, error }}>
      {children}
    </ReOwnContext.Provider>
  );
};

export function useReOwn(): ReOwnContextType {
  const context = useContext(ReOwnContext);
  if (!context) {
    throw new Error('useReOwn must be used within ReOwnProvider');
  }
  return context;
}

export function useReOwnManager(): ReOwnWalletManager {
  const { manager, error } = useReOwn();
  if (!manager) {
    throw new Error('ReOwn Manager not initialized');
  }
  if (error) {
    throw error;
  }
  return manager;
}

export default ReOwnProvider;
