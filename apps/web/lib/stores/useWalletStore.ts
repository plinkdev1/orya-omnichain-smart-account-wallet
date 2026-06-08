import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
    }
  )
)