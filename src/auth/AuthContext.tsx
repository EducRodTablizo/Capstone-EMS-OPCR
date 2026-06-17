import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import type { JwtPayload, User, LoginDto } from '@/types'
import { getCurrentUser, removeToken } from '@/utils/jwt'
import { loginApi, getUsersApi } from '@/api'

export interface AuthContextValue {
  user: User | null
  jwtPayload: JwtPayload | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (dto: LoginDto) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Development Auth Provider (inner) ───────────────────────────────────────
/**
 * DevAuthInner — active when import.meta.env.DEV === true.
 *
 * Fetches the injected dev user from the API Gateway (DEV_AUTH_MODE=true).
 * No ARMS login required. No token management.
 * Provides into the same AuthContext so all useAuth() calls work unchanged.
 *
 * Configure the dev user in apps/api-gateway/.env:
 *   DEV_AUTH_MODE=true
 *   DEV_USER_ID, DEV_USER_NAME, DEV_USER_ROLE, DEV_OFFICE_ID, etc.
 */
function DevAuthInner({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3001/api/auth/me', {
      headers: { 'Content-Type': 'application/json' },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Auth/me ${r.status}`)
        return r.json() as Promise<User>
      })
      .then((devUser) => {
        console.info('[DevAuth] Dev user injected:', devUser.name, `(${devUser.role})`)
        setUser(devUser)
      })
      .catch(() => {
        console.warn(
          '[DevAuth] API Gateway not reachable at http://localhost:3001.',
          'Run: cd apps/api-gateway && npm run start:dev',
        )
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (_dto: LoginDto) => {
    console.info('[DevAuth] login() is bypassed in dev mode.')
  }, [])

  const logout = useCallback(() => setUser(null), [])

  return (
    <AuthContext.Provider
      value={{ user, jwtPayload: null, isLoading, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Production Auth Provider (inner) ────────────────────────────────────────
/**
 * ProdAuthInner — active in production builds.
 *
 * Full ARMS JWT authentication flow:
 *   1. Reads stored JWT from localStorage
 *   2. Validates via getCurrentUser() (decodes payload)
 *   3. Loads user profile via getUsersApi()
 * ARMS integration is fully preserved — no changes to this flow.
 */
function ProdAuthInner({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [jwtPayload, setJwtPayload] = useState<JwtPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const payload = getCurrentUser()
    if (payload) {
      setJwtPayload(payload)
      getUsersApi()
        .then((users) => {
          const found = users.find((u) => u.id === payload.sub)
          if (found) setUser(found)
        })
        .finally(() => setIsLoading(false))
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
    <AuthContext.Provider
      value={{ user, jwtPayload, isLoading, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Unified AuthProvider ─────────────────────────────────────────────────────
/**
 * AuthProvider — selects DevAuthInner or ProdAuthInner based on Vite's build mode.
 *
 * import.meta.env.DEV = true  → DevAuthInner (Vite dev server, DEV_AUTH_MODE)
 * import.meta.env.DEV = false → ProdAuthInner (production build, ARMS JWT)
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (import.meta.env.DEV) {
    return <DevAuthInner>{children}</DevAuthInner>
  }
  return <ProdAuthInner>{children}</ProdAuthInner>
}

// ─── useAuth ──────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
