/**
 * Transaction Store - Uses @orya/wallet-core storage abstraction
 * This ensures consistent storage behavior across web and mobile platforms
 */

import { StorageFactory } from '@orya/wallet-core/storage'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/react-native'

export interface Transaction {
  id: string
  hash: string
  from: string
  to: string
  amount: string
  token: string
  chain: string
  status: 'pending' | 'confirmed' | 'failed'
  timestamp: number
  fee?: string
  gasUsed?: string
}

interface TransactionStore {
  transactions: Transaction[]
  pending: Transaction[]
  addTransaction: (tx: Transaction) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  getTransactionsByAddress: (address: string) => Transaction[]
  getPendingTransactions: () => Transaction[]
}

// Create storage adapter using wallet-core factory
const storageAdapter = StorageFactory.create('mobile', AsyncStorage)

// Convert IStorage interface to Zustand storage format
const zustandStorage = {
  getItem: (name: string) => storageAdapter.getItem(name),
  setItem: (name: string, value: string) => storageAdapter.setItem(name, value),
  removeItem: (name: string) => storageAdapter.removeItem(name),
}

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      pending: [],

      addTransaction: (tx) =>
        set((state) => {
          const newTx = { ...tx, timestamp: Date.now() }
          return {
            transactions: [newTx, ...state.transactions],
            pending: tx.status === 'pending' ? [newTx, ...state.pending] : state.pending,
          }
        }),

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...updates } : tx
          ),
          pending: state.pending
            .map((tx) =>
              tx.id === id ? { ...tx, ...updates } : tx
            )
            .filter((tx) => tx.status === 'pending'),
        })),

      getTransactionsByAddress: (address) =>
        get().transactions.filter((tx) => tx.from === address || tx.to === address),

      getPendingTransactions: () =>
        get().transactions.filter((tx) => tx.status === 'pending'),
    }),
    {
      name: 'transaction-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
)