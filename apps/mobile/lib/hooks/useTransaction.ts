import { useCallback, useState } from 'react'
import { useTransactionStore } from '../stores/useTransactionStore'

export interface TransactionParams {
  to: string
  amount: string
  token: string
  chain: string
}

export function useTransaction() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const addTransaction = useTransactionStore((state) => state.addTransaction)
  const updateTransaction = useTransactionStore((state) => state.updateTransaction)

  const sendTransaction = useCallback(
    async (params: TransactionParams) => {
      setIsLoading(true)
      setError(null)

      try {
        // Generate transaction ID
        const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`

        // Add pending transaction
        addTransaction({
          id: txId,
          hash: '',
          from: '', // Would be set from wallet context
          to: params.to,
          amount: params.amount,
          token: params.token,
          chain: params.chain,
          status: 'pending',
          timestamp: Date.now(),
        })

        // Simulate transaction submission (replace with actual API call)
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Simulate getting hash
        const hash = `0x${Math.random().toString(16).slice(2)}`

        // Update transaction with hash
        updateTransaction(txId, {
          hash,
          status: 'confirmed',
        })

        return { success: true, txId, hash }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transaction failed'
        setError(message)
        return { success: false, error: message }
      } finally {
        setIsLoading(false)
      }
    },
    [addTransaction, updateTransaction]
  )

  return { sendTransaction, isLoading, error }
}