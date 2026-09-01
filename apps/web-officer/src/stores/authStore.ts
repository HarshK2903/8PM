import { create } from 'zustand'

export interface User {
  id: string
  email: string
  full_name: string
  role: 'bidder' | 'officer' | 'admin'
  organization?: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  loadFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    localStorage.setItem('gemverify_token', token)
    localStorage.setItem('gemverify_user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('gemverify_token')
    localStorage.removeItem('gemverify_user')
    set({ user: null, token: null, isAuthenticated: false })
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('gemverify_token')
    const userStr = localStorage.getItem('gemverify_user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User
        set({ user, token, isAuthenticated: true })
      } catch {
        localStorage.removeItem('gemverify_token')
        localStorage.removeItem('gemverify_user')
      }
    }
  },
}))
