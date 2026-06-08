import { useState, useCallback } from 'react';
import {
  DWalletCreationService,
  DWalletCreationProgress,
  CreateDWalletParams,
} from '../services/ika/dwallet-creation.service';
import { IkaClientService } from '../services/ika/ika-client.service';

export interface UseCreateDWalletReturn {
  createDWallet: (params: Omit<CreateDWalletParams, 'onProgress'>) => Promise<void>;
  progress: DWalletCreationProgress | null;
  isCreating: boolean;
  error: string | null;
  result: any | null;
}

export function useCreateDWallet(): UseCreateDWalletReturn {
  const [progress, setProgress] = useState<DWalletCreationProgress | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const createDWallet = useCallback(
    async (params: Omit<CreateDWalletParams, 'onProgress'>) => {
      setIsCreating(true);
      setError(null);
      setResult(null);
      setProgress(null);

      try {
        const ikaClientService = IkaClientService.getInstance();
        const ikaClient = ikaClientService.getClient();
        const service = new DWalletCreationService(ikaClient);

        const walletResult = await service.createZeroTrustDWallet({
          ...params,
          onProgress: (p) => {
            setProgress(p);
            console.log('dWallet creation progress:', p);
          },
        });

        setResult(walletResult);
        console.log('dWallet created successfully:', walletResult);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('dWallet creation failed:', err);
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  return {
    createDWallet,
    progress,
    isCreating,
    error,
    result,
  };
}
