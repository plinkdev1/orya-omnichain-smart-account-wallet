import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  displayName: string
  avatar?: string
  kycStatus: 'pending' | 'verified' | 'rejected'
}

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      setUser: (user) =>
        set(() => ({
          user,
          isAuthenticated: true,
        })),
      
      logout: () =>
        set(() => ({
          user: null,
          isAuthenticated: false,
        })),
      
      setLoading: (loading) =>
        set(() => ({
          isLoading: loading,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
)