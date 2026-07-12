import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  email: string
  plan: string
  role: string
  daily_query_count: number
}

interface AuthState {
  token:   string | null
  user:    User | null
  hydrated: boolean
  setAuth: (token: string, user: User) => void
  logout:  () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token:   null,
      user:    null,
      hydrated: false,
      setAuth: (token, user) => set({ token, user }),
      logout:  () => set({ token: null, user: null })
    }),
    {
      name: 'neeti-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<AuthState>),
        hydrated: true
      })
    }
  )
)
