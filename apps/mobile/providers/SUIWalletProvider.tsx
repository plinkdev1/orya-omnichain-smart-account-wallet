import { createContext, useContext, useEffect, useState } from 'react';
import { OrysaSUIWallet } from '@orya/wallet-core/sui/wallet-standard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import type { OryaSUIWalletAccount } from '@orya/wallet-core/sui/types';

interface SUIWalletContextValue {
  wallet: OrysaSUIWallet | null;
  accounts: OryaSUIWalletAccount[];
  selectedAccount: OryaSUIWalletAccount | null;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  signTransactionBlock: (tx: Uint8Array) => Promise<Uint8Array>;
  signAndExecuteTransactionBlock: (tx: Uint8Array) => Promise<string>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const SUIWalletContext = createContext<SUIWalletContextValue | null>(null);

export function SUIWalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<OrysaSUIWallet | null>(null);
  const [accounts, setAccounts] = useState<OryaSUIWalletAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initializeWallet();
  }, []);

  const initializeWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const storedAddress = await AsyncStorage.getItem('sui_wallet_address');
      if (storedAddress) {
        const oryaWallet = new OrysaSUIWallet();
        await oryaWallet.connect();
        setWallet(oryaWallet);
        setAccounts(oryaWallet.accounts);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateWithBiometrics = async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to sign',
          fallbackLabel: 'Use passcode',
          disableDeviceFallback: false,
        });
        return result.success;
      }
      return true;
    } catch (err) {
      console.warn('Biometric authentication error:', err);
      return false;
    }
  };

  const signTransactionBlock = async (tx: Uint8Array): Promise<Uint8Array> => {
    if (!wallet) throw new Error('Wallet not initialized');

    const authenticated = await authenticateWithBiometrics();
    if (!authenticated) {
      throw new Error('Biometric authentication failed');
    }

    try {
      const result = await wallet['sui:signTransactionBlock']({
        transactionBlock: tx,
      });
      return result.signature;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  };

  const signAndExecuteTransactionBlock = async (tx: Uint8Array): Promise<string> => {
    if (!wallet) throw new Error('Wallet not initialized');

    const authenticated = await authenticateWithBiometrics();
    if (!authenticated) {
      throw new Error('Biometric authentication failed');
    }

    try {
      const result = await wallet['sui:signAndExecuteTransactionBlock']({
        transactionBlock: tx,
      });
      return result.digest;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  };

  const signMessage = async (message: Uint8Array): Promise<Uint8Array> => {
    if (!wallet) throw new Error('Wallet not initialized');

    const authenticated = await authenticateWithBiometrics();
    if (!authenticated) {
      throw new Error('Biometric authentication failed');
    }

    try {
      const result = await wallet['sui:signMessage']({
        message,
      });
      return result.signature;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  };

  const connect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const oryaWallet = new OrysaSUIWallet();
      await oryaWallet.connect();
      
      if (oryaWallet.accounts.length > 0) {
        await AsyncStorage.setItem('sui_wallet_address', oryaWallet.accounts[0].address);
      }

      setWallet(oryaWallet);
      setAccounts(oryaWallet.accounts);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      setIsLoading(true);
      if (wallet) {
        await wallet.disconnect();
      }
      await AsyncStorage.removeItem('sui_wallet_address');
      setWallet(null);
      setAccounts([]);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SUIWalletContext.Provider
      value={{
        wallet,
        accounts,
        selectedAccount: accounts[0] || null,
        isConnected: accounts.length > 0,
        isLoading,
        error,
        signTransactionBlock,
        signAndExecuteTransactionBlock,
        signMessage,
        connect,
        disconnect,
      }}
    >
      {children}
    </SUIWalletContext.Provider>
  );
}

export const useSUIWallet = () => {
  const context = useContext(SUIWalletContext);
  if (!context) throw new Error('useSUIWallet must be used within SUIWalletProvider');
  return context;
};
