import { useState } from 'react';
import { useAutoSigningStore } from '../store/autoSigningStore';
import type {
  AutoSigningPreference,
  AutoSigningPolicy,
  SigningMethod,
  ChainId,
} from '../domain/protocols';

export interface UseAutoSigningReturn {
  preferences: AutoSigningPreference[];
  policies: AutoSigningPolicy[];
  defaultSigningMethod: SigningMethod;
  allowAutoSign: boolean;
  loading: boolean;
  error: string | null;

  addPreference: (preference: AutoSigningPreference) => Promise<void>;
  updatePreference: (preference: AutoSigningPreference) => Promise<void>;
  removePreference: (id: string) => Promise<void>;
  getPreference: (id: string) => AutoSigningPreference | undefined;
  getPreferencesForProtocol: (protocolId: string) => AutoSigningPreference[];
  getPreferencesForChain: (chainId: ChainId) => AutoSigningPreference[];

  addPolicy: (policy: AutoSigningPolicy) => Promise<void>;
  updatePolicy: (policy: AutoSigningPolicy) => Promise<void>;
  removePolicy: (id: string) => Promise<void>;
  getPolicy: (id: string) => AutoSigningPolicy | undefined;
  getAllPolicies: () => AutoSigningPolicy[];
  enablePolicy: (id: string) => Promise<void>;
  disablePolicy: (id: string) => Promise<void>;

  setDefaultSigningMethod: (method: SigningMethod) => Promise<void>;
  setAllowAutoSign: (allow: boolean) => Promise<void>;
}

export function useAutoSigning(): UseAutoSigningReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    preferences,
    policies,
    signingPreferences,
    addAutoSigningPreference,
    updateAutoSigningPreference,
    removeAutoSigningPreference,
    getAutoSigningPreference,
    getPreferencesForProtocol,
    getPreferencesForChain,
    addPolicy,
    updatePolicy,
    removePolicy,
    getPolicy,
    getAllPolicies,
    enablePolicy: storeEnablePolicy,
    disablePolicy: storeDisablePolicy,
    setDefaultSigningMethod: storeSetDefaultSigningMethod,
    setAllowAutoSign: storeSetAllowAutoSign,
  } = useAutoSigningStore();

  const addPreference = async (preference: AutoSigningPreference) => {
    try {
      setLoading(true);
      setError(null);
      addAutoSigningPreference(preference);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (preference: AutoSigningPreference) => {
    try {
      setLoading(true);
      setError(null);
      updateAutoSigningPreference({
        ...preference,
        updatedAt: Date.now(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removePreference = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      removeAutoSigningPreference(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addPolicyAsync = async (policy: AutoSigningPolicy) => {
    try {
      setLoading(true);
      setError(null);
      addPolicy(policy);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePolicyAsync = async (policy: AutoSigningPolicy) => {
    try {
      setLoading(true);
      setError(null);
      updatePolicy({
        ...policy,
        updatedAt: Date.now(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removePolicyAsync = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      removePolicy(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const enablePolicyAsync = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      storeEnablePolicy(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const disablePolicyAsync = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      storeDisablePolicy(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setDefaultSigningMethodAsync = async (method: SigningMethod) => {
    try {
      setLoading(true);
      setError(null);
      storeSetDefaultSigningMethod(method);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setAllowAutoSignAsync = async (allow: boolean) => {
    try {
      setLoading(true);
      setError(null);
      storeSetAllowAutoSign(allow);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    preferences,
    policies,
    defaultSigningMethod: signingPreferences.defaultMethod,
    allowAutoSign: signingPreferences.allowAutoSign,
    loading,
    error,

    addPreference,
    updatePreference,
    removePreference,
    getPreference: getAutoSigningPreference,
    getPreferencesForProtocol,
    getPreferencesForChain,

    addPolicy: addPolicyAsync,
    updatePolicy: updatePolicyAsync,
    removePolicy: removePolicyAsync,
    getPolicy,
    getAllPolicies,
    enablePolicy: enablePolicyAsync,
    disablePolicy: disablePolicyAsync,

    setDefaultSigningMethod: setDefaultSigningMethodAsync,
    setAllowAutoSign: setAllowAutoSignAsync,
  };
}
