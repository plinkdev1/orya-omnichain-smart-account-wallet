import { useCallback, useState } from 'react'
import { useWalletStore } from '../stores/useWalletStore'

export interface ConnectWalletParams {
  name: string
  address: string
  chain: string
  type: 'embedded' | 'external'
}

export function useWallet() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const wallets = useWalletStore((state) => state.wallets)
  const activeWallet = useWalletStore((state) => state.activeWallet)
  const isConnected = useWalletStore((state) => state.isConnected)
  const addWallet = useWalletStore((state) => state.addWallet)
  const removeWallet = useWalletStore((state) => state.removeWallet)
  const setActiveWallet = useWalletStore((state) => state.setActiveWallet)
  const disconnect = useWalletStore((state) => state.disconnect)

  const connectWallet = useCallback(
    async (params: ConnectWalletParams) => {
      setIsConnecting(true)
      setError(null)

      try {
        // Simulate wallet connection (replace with actual wallet integration)
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const walletId = `wallet_${Date.now()}`
        const newWallet = {
          id: walletId,
          ...params,
          balance: '0.00',
        }

        addWallet(newWallet)
        return { success: true, wallet: newWallet }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to connect wallet'
        setError(message)
        return { success: false, error: message }
      } finally {
        setIsConnecting(false)
      }
    },
    [addWallet]
  )

  const switchWallet = useCallback(
    (walletId: string) => {
      const wallet = wallets.find((w) => w.id === walletId)
      if (wallet) {
        setActiveWallet(wallet)
        return true
      }
      return false
    },
    [wallets, setActiveWallet]
  )

  const disconnectWallet = useCallback(() => {
    disconnect()
  }, [disconnect])

  return {
    wallets,
    activeWallet,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    switchWallet,
    disconnectWallet,
    removeWallet,
  }
}