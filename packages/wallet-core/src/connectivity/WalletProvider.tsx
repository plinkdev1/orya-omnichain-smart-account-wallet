/**
 * Step 4A: WalletProvider Component
 * Wraps React app with Sui Wallet Kit provider and manages wallet connectivity
 */

import React, { ReactNode, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { OwnWallet } from "../crypto/OwnWallet";
import {
    connectWalletSuccess,
    setNetworkStatus,
} from "../store/slices/walletSlice";
import {
    initializeTransactionRouter,
    OwnWalletBackend,
    SuiWalletKitBackend,
    ReownEvmBackend,
    ReownSolanaBackend,
} from "./TransactionRouter";
// ReOwn integration disabled temporarily due to SDK incompatibilities
// import type { ReownAdapter } from "./reown/ReownAdapter";
type ReownAdapter = any;

export interface WalletProviderConfig {
  preferredWallets?: string[];
  enableOwnWallet?: boolean;
  storageKey?: string;
  reown?: {
    adapter: ReownAdapter;
    enableEvm?: boolean;
    enableSolana?: boolean;
    defaultBackend?: 'reown-evm' | 'reown-solana';
  };
}

export interface WalletContextType {
  isConnected: boolean;
  currentWallet: any;
  isConnecting: boolean;
  error: string | null;
  connectWallet: (walletName: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  getAvailableWallets: () => Promise<string[]>;
}

export const WalletContext = React.createContext<WalletContextType | null>(null);

interface WalletProviderProps {
  children: ReactNode;
  config?: WalletProviderConfig;
}

/**
 * WalletProvider Component
 * Manages wallet connections and provides wallet context to child components
 */
export const WalletProvider: React.FC<WalletProviderProps> = ({
  children,
  config = {},
}) => {
  const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState(false);
  const [currentWallet, setCurrentWallet] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);

  const {
    enableOwnWallet = true,
    preferredWallets = ["Sui Wallet", "Suiet"],
    storageKey = "orya-wallet-connection",
    reown: reownIntegration,
  } = config as WalletProviderConfig;

  // Initialize transaction router
  useEffect(() => {
    const router = initializeTransactionRouter();

    if (enableOwnWallet) {
      try {
        const ownWallet = OwnWallet.fromStorage("wallet-key");
        if (ownWallet) {
          const backend = new OwnWalletBackend(ownWallet);
          router.registerBackend("own-wallet", backend);
        }
      } catch (err) {
        console.warn("OwnWallet not available in this session");
      }
    }

    if (!reownIntegration?.adapter) {
      return;
    }

    const setupReown = async () => {
      const adapter = reownIntegration.adapter;
      try {
        let initialized = false;
        if (typeof (adapter as any).isInitializedFlag === "function") {
          initialized = (adapter as any).isInitializedFlag();
        }
        if (!initialized) {
          await adapter.initialize();
        }

        if (reownIntegration.enableEvm !== false) {
          router.registerBackend("reown-evm", new ReownEvmBackend(adapter));
        }

        if (reownIntegration.enableSolana !== false) {
          router.registerBackend("reown-solana", new ReownSolanaBackend(adapter));
        }

        if (reownIntegration.defaultBackend) {
          router.setActiveBackend(reownIntegration.defaultBackend);
        }
      } catch (error) {
        console.error("Failed to configure Reown adapter", error);
      }
    };

    void setupReown();
  }, [enableOwnWallet, reownIntegration]);

  /**
   * Detect and list available Sui standard wallets
   */
  const detectAvailableWallets = async (): Promise<string[]> => {
    const detected: string[] = [];

    // Check for Sui Wallet (browser extension)
    if ((window as any).suiWallet) {
      detected.push("Sui Wallet");
    }

    // Check for Suiet
    if ((window as any).suiet) {
      detected.push("Suiet");
    }

    // Check for Ethos (Sui wallet)
    if ((window as any).ethos) {
      detected.push("Ethos");
    }

    // Check for Martian (multichain wallet)
    if ((window as any).martianWallet) {
      detected.push("Martian");
    }

    // Add OwnWallet if enabled
    if (enableOwnWallet) {
      detected.push("OwnWallet");
    }

    return detected;
  };

  /**
   * Update available wallets on mount
   */
  useEffect(() => {
    const updateWallets = async () => {
      const wallets = await detectAvailableWallets();
      setAvailableWallets(wallets);
    };

    updateWallets();

    // Listen for wallet installation
    const handleWalletInstalled = () => {
      updateWallets();
    };

    window.addEventListener("suiWalletInstalled", handleWalletInstalled);
    return () => {
      window.removeEventListener("suiWalletInstalled", handleWalletInstalled);
    };
  }, [enableOwnWallet]);

  /**
   * Restore wallet connection from storage
   */
  useEffect(() => {
    const restoreConnection = async () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const { walletName } = JSON.parse(stored);
          await connectWallet(walletName);
        }
      } catch (err) {
        console.warn("Failed to restore wallet connection:", err);
      }
    };

    restoreConnection();
  }, []);

  /**
   * Connect to a wallet
   */
  const connectWallet = async (walletName: string): Promise<void> => {
    setIsConnecting(true);
    setError(null);

    try {
      let connectedWallet: any = null;
      const router = initializeTransactionRouter();

      if (walletName === "OwnWallet") {
        // Handle OwnWallet connection
        const ownWallet = OwnWallet.fromStorage("wallet-key");
        if (!ownWallet) {
          throw new Error("OwnWallet not initialized");
        }

        const backend = new OwnWalletBackend(ownWallet);
        router.registerBackend("own-wallet", backend);
        router.setActiveBackend("own-wallet");

        connectedWallet = {
          name: "OwnWallet",
          address: ownWallet.getPublicKey(),
          publicKey: ownWallet.getPublicKey(),
          type: "self-custody",
        };
      } else {
        // Handle Sui standard wallets
        const walletProvider = await getWalletProvider(walletName);
        if (!walletProvider) {
          throw new Error(`Wallet provider not found: ${walletName}`);
        }

        // Connect to wallet
        await walletProvider.connect();

        const account = walletProvider.getAccount?.();
        if (!account) {
          throw new Error("Failed to get account from wallet");
        }

        // Register backend
        const backend = new SuiWalletKitBackend(walletProvider);
        router.registerBackend(walletName.toLowerCase(), backend);
        router.setActiveBackend(walletName.toLowerCase());

        connectedWallet = {
          name: walletName,
          address: account.address,
          publicKey: account.publicKey,
          type: "external",
        };
      }

      // Update state
      setCurrentWallet(connectedWallet);
      setIsConnected(true);

      // Update Redux
      dispatch(connectWalletSuccess(connectedWallet));
      dispatch(setNetworkStatus("connected"));

      // Persist connection
      localStorage.setItem(
        storageKey,
        JSON.stringify({ walletName, timestamp: Date.now() })
      );
    } catch (err) {
      const errorMessage = (err as any).message || "Failed to connect wallet";
      setError(errorMessage);
      setIsConnected(false);
      dispatch(setNetworkStatus("error"));
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Disconnect from wallet
   */
  const disconnectWallet = async (): Promise<void> => {
    try {
      if (currentWallet?.type === "external" && currentWallet.disconnect) {
        await currentWallet.disconnect();
      }

      setCurrentWallet(null);
      setIsConnected(false);
      setError(null);
      localStorage.removeItem(storageKey);

      // Update Redux
      dispatch(setNetworkStatus("disconnected"));
    } catch (err) {
      console.error("Failed to disconnect wallet:", err);
    }
  };

  /**
   * Get wallet provider by name
   */
  const getWalletProvider = async (walletName: string): Promise<any> => {
    const walletMap: Record<string, any> = {
      "Sui Wallet": (window as any).suiWallet,
      Suiet: (window as any).suiet,
      Ethos: (window as any).ethos,
      Martian: (window as any).martianWallet,
    };

    const provider = walletMap[walletName];
    if (!provider) {
      throw new Error(`${walletName} not installed`);
    }

    return provider;
  };

  const value: WalletContextType = {
    isConnected,
    currentWallet,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    getAvailableWallets: async () => availableWallets,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

/**
 * Hook to use wallet context
 */
export const useWalletProvider = (): WalletContextType => {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletProvider must be used within WalletProvider");
  }
  return context;
};