/**
 * Wallet Store - Uses @orya/wallet-core storage abstraction
 * This ensures consistent storage behavior across web and mobile platforms
 */

import { StorageFactory } from '@orya/wallet-core/storage'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/react-native'

interface Wallet {
  id: string
  name: string
  address: string
  chain: string
  balance: string
  type: 'embedded' | 'external'
}

interface WalletStore {
  wallets: Wallet[]
  activeWallet: Wallet | null
  isConnected: boolean
  addWallet: (wallet: Wallet) => void
  removeWallet: (id: string) => void
  setActiveWallet: (wallet: Wallet) => void
  disconnect: () => void
}

// Create storage adapter using wallet-core factory
const storageAdapter = StorageFactory.create('mobile', AsyncStorage)

// Convert IStorage interface to Zustand storage format
const zustandStorage = {
  getItem: (name: string) => storageAdapter.getItem(name),
  setItem: (name: string, value: string) => storageAdapter.setItem(name, value),
  removeItem: (name: string) => storageAdapter.removeItem(name),
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      wallets: [],
      activeWallet: null,
      isConnected: false,

      addWallet: (wallet) =>
        set((state) => ({
          wallets: [...state.wallets, wallet],
          activeWallet: state.activeWallet || wallet,
          isConnected: true,
        })),

      removeWallet: (id) =>
        set((state) => ({
          wallets: state.wallets.filter((w) => w.id !== id),
          activeWallet: state.activeWallet?.id === id ? null : state.activeWallet,
          isConnected: state.wallets.length > 1,
        })),

      setActiveWallet: (wallet) =>
        set(() => ({
          activeWallet: wallet,
          isConnected: true,
        })),

      disconnect: () =>
        set(() => ({
          activeWallet: null,
          isConnected: false,
        })),
    }),
    {
      name: 'wallet-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
)