/**
 * DevAuthProvider — Development-only authentication bypass.
 *
 * Provides into the same AuthContext as AuthProvider so all existing
 * useAuth() calls work unchanged throughout the app.
 *
 * Flow:
 *   1. On mount: calls GET /api/auth/me (no JWT needed in DEV_AUTH_MODE)
 *   2. API Gateway returns the configured dev user (real DB UUID)
 *   3. User is set in AuthContext — app renders normally
 *   4. No login page, no token storage, no ARMS redirect
 *
 * Only active when import.meta.env.DEV === true (Vite dev server).
 * ARMS integration in AuthProvider is fully preserved and unchanged.
 *
 * To switch dev user: edit apps/api-gateway/.env (DEV_USER_* vars) and
 * restart the API Gateway.
 */
import React, { useState, useEffect, useCallback } from 'react'
import type { User, LoginDto } from '@/types'
import { AuthContext } from '@/auth/AuthContext'

const DEV_GATEWAY = 'http://localhost:3001/api'

export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // GET /api/auth/me — API Gateway returns the dev user (no JWT validation in dev mode)
    fetch(`${DEV_GATEWAY}/auth/me`, {
      headers: { 'Content-Type': 'application/json' },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Auth/me returned ${r.status}`)
        return r.json() as Promise<User>
      })
      .then((devUser) => {
        console.info('[DevAuth] Injected dev user:', devUser.name, `(${devUser.role})`)
        setUser(devUser)
      })
      .catch((err) => {
        console.warn(
          '[DevAuth] Could not reach API Gateway at http://localhost:3001.',
          'Start the backend with: cd apps/api-gateway && npm run start:dev',
          err,
        )
      })
      .finally(() => setIsLoading(false))
  }, [])

  // login is a no-op in dev mode — user is auto-injected via DEV_AUTH_MODE
  const login = useCallback(async (_dto: LoginDto) => {
    console.warn('[DevAuth] login() no-op in DEV_AUTH_MODE. User is auto-injected.')
  }, [])

  // logout clears local state (no JWT/token to revoke in dev mode)
  const logout = useCallback(() => {
    setUser(null)
    console.info('[DevAuth] Dev user logged out. Reload page to re-inject.')
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        jwtPayload: null, // No JWT in dev mode — claims come directly from API Gateway
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
