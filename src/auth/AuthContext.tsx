import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'import type { JwtPayload, User, LoginDto } from '@/types'
import { getCurrentUser, removeToken } from '@/utils/jwt'
import { loginApi, getUsersApi } from '@/api/mockApi'

interface AuthContextValue {
  user: User | null
  jwtPayload: JwtPayload | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (dto: LoginDto) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [jwtPayload, setJwtPayload] = useState<JwtPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const payload = getCurrentUser()
    if (payload) {
      setJwtPayload(payload)
      // Hydrate full user object from mock store
      getUsersApi().then((users) => {
        const found = users.find((u) => u.id === payload.sub)
        if (found) setUser(found)
      }).finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (dto: LoginDto) => {
    const res = await loginApi(dto)
    const payload = getCurrentUser()
    setJwtPayload(payload)
    setUser(res.user)
  }, [])

  const logout = useCallback(() => {
    removeToken()
    setUser(null)
    setJwtPayload(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user, jwtPayload, isLoading,
      isAuthenticated: !!user,
      login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
