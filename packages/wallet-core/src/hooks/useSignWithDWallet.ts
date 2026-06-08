import { useState, useCallback } from 'react';
import {
  SigningService,
  SignMessageParams,
  SignatureResult,
} from '../services/ika/signing.service';
import { PresignService, CreatePresignParams } from '../services/ika/presign.service';
import { IkaClientService } from '../services/ika/ika-client.service';

export interface UseSignWithDWalletReturn {
  signMessage: (params: SignMessageParams) => Promise<SignatureResult>;
  createPresign: (params: CreatePresignParams) => Promise<string>;
  waitForPresignCompletion: (presignId: string) => Promise<void>;
  isSigning: boolean;
  isCreatingPresign: boolean;
  error: string | null;
  lastSignatureDigest: string | null;
}

export function useSignWithDWallet(): UseSignWithDWalletReturn {
  const [isSigning, setIsSigning] = useState(false);
  const [isCreatingPresign, setIsCreatingPresign] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSignatureDigest, setLastSignatureDigest] = useState<string | null>(null);

  const signMessage = useCallback(
    async (params: SignMessageParams): Promise<SignatureResult> => {
      setIsSigning(true);
      setError(null);

      try {
        const ikaClientService = IkaClientService.getInstance();
        const ikaClient = ikaClientService.getClient();
        const suiClient = ikaClientService.getSuiClient();

        const service = new SigningService(ikaClient, suiClient);
        const result = await service.signMessage(params);

        setLastSignatureDigest(result.transactionDigest);
        console.log('Message signed successfully');

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Signing failed:', err);
        throw err;
      } finally {
        setIsSigning(false);
      }
    },
    []
  );

  const createPresign = useCallback(
    async (params: CreatePresignParams): Promise<string> => {
      setIsCreatingPresign(true);
      setError(null);

      try {
        const ikaClientService = IkaClientService.getInstance();
        const ikaClient = ikaClientService.getClient();
        const suiClient = ikaClientService.getSuiClient();

        const service = new PresignService(ikaClient, suiClient);
        const result = await service.createPresign(params);

        console.log('Presign created successfully:', result.presignId);

        return result.presignId;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Presign creation failed:', err);
        throw err;
      } finally {
        setIsCreatingPresign(false);
      }
    },
    []
  );

  const waitForPresignCompletion = useCallback(
    async (presignId: string): Promise<void> => {
      try {
        const ikaClientService = IkaClientService.getInstance();
        const ikaClient = ikaClientService.getClient();
        const suiClient = ikaClientService.getSuiClient();

        const service = new PresignService(ikaClient, suiClient);
        await service.waitForPresignCompletion(presignId);

        console.log('Presign completed:', presignId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Presign completion wait failed:', err);
        throw err;
      }
    },
    []
  );

  return {
    signMessage,
    createPresign,
    waitForPresignCompletion,
    isSigning,
    isCreatingPresign,
    error,
    lastSignatureDigest,
  };
}
