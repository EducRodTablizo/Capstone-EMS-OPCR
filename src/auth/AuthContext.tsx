import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'
import type { JwtPayload, User, LoginDto, UserRole } from '@/types'
import { getMeApi } from '@/api'

interface AuthContextValue {
  user: User | null
  jwtPayload: JwtPayload | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (dto: LoginDto) => Promise<void>
  logout: () => void
  switchRole: (role: UserRole) => void
}

const DEFAULT_USER: User = {
  id: '11000000-0000-0000-0000-000000000001',
  name: 'System Administrator',
  email: 'admin@ems.ph',
  role: 'subsystem_admin',
  office_id: '00000000-0000-0000-0000-000000000001', // Admin Office UUID from database seed
  office_code: 'ADMIN_OFFICE',
  office_name: 'Administrative Office',
  is_active: true,
  created_at: new Date().toISOString(),
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [jwtPayload, setJwtPayload] = useState<JwtPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      const u = await getMeApi()
      const activeRole = localStorage.getItem('active_role') as UserRole | null
      if (activeRole && u) {
        u.role = activeRole
      }
      setUser(u)
      setIsAuthenticated(!!u)
      if (u) {
        setJwtPayload({
          sub: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          office_id: u.office_id,
          office_code: u.office_code,
          office_name: u.office_name,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 28800,
        })
      }
    } catch (err) {
      console.warn('Failed to load real user profile, falling back to local simulation:', err)
      const activeRole = localStorage.getItem('active_role') as UserRole | null
      const fallback = { ...DEFAULT_USER }
      if (activeRole) {
        fallback.role = activeRole
      }
      setUser(fallback)
      setJwtPayload({
        sub: fallback.id,
        name: fallback.name,
        email: fallback.email,
        role: fallback.role,
        office_id: fallback.office_id,
        office_code: fallback.office_code,
        office_name: fallback.office_name,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 28800,
      })
      setIsAuthenticated(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const login = useCallback(async (dto: LoginDto) => {
    console.log('Bypassed login with', dto)
  }, [])

  const logout = useCallback(() => {
    console.log('Logging out, clearing localStorage...')
    localStorage.removeItem('active_role')
    setUser(null)
    setJwtPayload(null)
    setIsAuthenticated(false)
  }, [])

  const switchRole = useCallback((role: UserRole) => {
    console.log('Switching role to:', role)
    localStorage.setItem('active_role', role)

    setUser((prev) => {
      if (!prev) return null
      return { ...prev, role }
    })
    setJwtPayload((prev) => {
      if (!prev) return null
      return { ...prev, role }
    })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        jwtPayload,
        isLoading,
        isAuthenticated,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
