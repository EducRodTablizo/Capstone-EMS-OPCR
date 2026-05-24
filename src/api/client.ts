import axios from 'axios'
import { getToken, removeToken } from '@/utils/jwt'

// Base URL points to NestJS backend
// In production: set VITE_API_URL env variable, or configure proxy in vite.config.ts
const BASE_URL = typeof window !== 'undefined'
  ? (window as unknown as { __EMS_API_URL__?: string }).__EMS_API_URL__ ?? 'http://localhost:3001/api'
  : 'http://localhost:3001/api'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Attach JWT on every request
apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 → logout
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
