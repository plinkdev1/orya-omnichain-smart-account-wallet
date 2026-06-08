import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  UserSegment,
  WalletCapabilities,
} from '@orya/shared-types'

interface UserProfile {
  id: string
  userId: string
  userSegment: UserSegment
  capabilities: WalletCapabilities
  kyc: {
    verified: boolean
    level: 'none' | 'basic' | 'advanced'
  }
}

interface UserStore {
  profile: UserProfile | null
  setProfile: (profile: UserProfile) => void
  updateSegment: (segment: UserSegment) => void
  updateCapabilities: (capabilities: WalletCapabilities) => void
  getCapabilities: () => WalletCapabilities
  isSegment: (segment: UserSegment) => boolean
  clear: () => void
}

const DEFAULT_CAPABILITIES: WalletCapabilities = {
  canSwap: false,
  canBridge: false,
  canStake: false,
  canDefi: false,
  canNft: false,
  canPayCard: false,
  canMultisig: false,
}

const SEGMENT_CAPABILITIES: Record<UserSegment, WalletCapabilities> = {
  [UserSegment.NORMIE]: {
    canSwap: false,
    canBridge: false,
    canStake: false,
    canDefi: false,
    canNft: false,
    canPayCard: true,
    canMultisig: false,
  },
  [UserSegment.CRYPTO_NATIVE]: {
    canSwap: true,
    canBridge: true,
    canStake: true,
    canDefi: true,
    canNft: true,
    canPayCard: false,
    canMultisig: false,
  },
  [UserSegment.INSTITUTIONAL]: {
    canSwap: true,
    canBridge: true,
    canStake: true,
    canDefi: true,
    canNft: true,
    canPayCard: true,
    canMultisig: true,
  },
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      profile: null,

      setProfile: (profile) =>
        set(() => ({
          profile,
        })),

      updateSegment: (segment) =>
        set((state) => {
          if (!state.profile) return {}
          const capabilities = SEGMENT_CAPABILITIES[segment]
          return {
            profile: {
              ...state.profile,
              userSegment: segment,
              capabilities,
            },
          }
        }),

      updateCapabilities: (capabilities) =>
        set((state) => {
          if (!state.profile) return {}
          return {
            profile: {
              ...state.profile,
              capabilities,
            },
          }
        }),

      getCapabilities: () => {
        const state = get()
        return state.profile?.capabilities || DEFAULT_CAPABILITIES
      },

      isSegment: (segment) => {
        const state = get()
        return state.profile?.userSegment === segment
      },

      clear: () =>
        set(() => ({
          profile: null,
        })),
    }),
    {
      name: 'user-profile-storage',
      storage: createJSONStorage(() => ({
        getItem: async (key: string) => {
          const value = await AsyncStorage.getItem(key)
          return value
        },
        setItem: async (key: string, value: string) => {
          await AsyncStorage.setItem(key, value)
        },
        removeItem: async (key: string) => {
          await AsyncStorage.removeItem(key)
        },
      })),
    }
  )
)
