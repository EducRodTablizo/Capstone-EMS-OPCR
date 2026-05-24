import { jwtDecode } from 'jwt-decode'
import type { JwtPayload } from '@/types'

const TOKEN_KEY = 'ems_access_token'

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwtDecode<JwtPayload>(token)
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token)
  if (!payload) return true
  return Date.now() >= payload.exp * 1000
}

export function getCurrentUser(): JwtPayload | null {
  const token = getToken()
  if (!token) return null
  if (isTokenExpired(token)) {
    removeToken()
    return null
  }
  return decodeToken(token)
}
