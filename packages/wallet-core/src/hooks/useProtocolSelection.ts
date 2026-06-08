import { useEffect, useState } from 'react';
import { useProtocolPreferenceStore } from '../store/protocolPreferenceStore';
import type {
  Protocol,
  ChainId,
  FeatureType,
  ProtocolPreference,
} from '../domain/protocols';

export interface UseProtocolSelectionReturn {
  selectedProtocol: Protocol | undefined;
  availableProtocols: Protocol[];
  preference: ProtocolPreference | undefined;
  loading: boolean;
  error: string | null;
  selectProtocol: (protocolId: string) => Promise<void>;
  setAvailableProtocols: (protocols: Protocol[]) => void;
}

export function useProtocolSelection(
  chainId: ChainId,
  feature: FeatureType,
  mockProtocols?: Protocol[]
): UseProtocolSelectionReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    setProtocolPreference,
    getProtocolPreference,
    getPreferredProtocol,
    getAvailableProtocols,
    setAvailableProtocols: storeSetAvailableProtocols,
  } = useProtocolPreferenceStore();

  const preference = getProtocolPreference(chainId, feature);
  const selectedProtocol = getPreferredProtocol(chainId, feature);
  const availableProtocols = getAvailableProtocols(chainId, feature);

  useEffect(() => {
    if (mockProtocols) {
      storeSetAvailableProtocols(mockProtocols);
    }
  }, [chainId, feature, mockProtocols, storeSetAvailableProtocols]);

  const selectProtocol = async (protocolId: string) => {
    try {
      setLoading(true);
      setError(null);

      const protocol = availableProtocols.find((p) => p.id === protocolId);
      if (!protocol) {
        throw new Error(`Protocol ${protocolId} not found`);
      }

      setProtocolPreference(chainId, feature, protocolId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    selectedProtocol,
    availableProtocols,
    preference,
    loading,
    error,
    selectProtocol,
    setAvailableProtocols: storeSetAvailableProtocols,
  };
}
