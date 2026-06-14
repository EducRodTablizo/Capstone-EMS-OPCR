/**
 * Real API client — hits the NestJS API Gateway (http://localhost:3001/api).
 *
 * Toggle between mock and real API via browser console:
 *   window.__EMS_USE_REAL_API__ = true   // switch to real API
 *   window.__EMS_USE_REAL_API__ = false  // revert to mock
 *   localStorage.setItem('ems_use_real_api', 'true') // persist across reloads
 *
 * All functions have identical signatures to mockApi.ts for drop-in replacement.
 */

import type {
  User, Service, Transaction, TransactionStatusHistory,
  CreateTransactionDto, UpdateTransactionStatusDto, UpdateDocumentaryStatusDto,
  DashboardStats, LoginResponse, LoginDto,
} from '@/types'
import { getToken, clearToken } from '@/utils/jwt'

const BASE = 'http://localhost:3001/api'

// ─── HTTP Client ─────────────────────────────────────────────────────────────

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401) {
    clearToken()
    throw new Error('Session expired. Please log in again.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error((body as { message?: string }).message ?? `HTTP ${response.status}`)
  }

  return response.json() as Promise<T>
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * loginApi — EMS does NOT own authentication.
 * In production: user logs in to ARMS → ARMS issues JWT → frontend stores it.
 * Here we call GET /auth/me to validate the stored token and return user data.
 *
 * For local dev: the stored token from mockApi.loginApi() is reused.
 * For production: redirect to ARMS login if no token.
 */
export async function loginApi(_dto: LoginDto): Promise<LoginResponse> {
  // In production this should redirect to ARMS login portal.
  // For demo/dev: fall back to mockApi which generates a mock token.
  throw new Error(
    'EMS does not handle login. Use ARMS login portal or run in mock mode.',
  )
}

export async function getMeApi(): Promise<User> {
  return apiRequest<User>('/auth/me')
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUsersApi(officeId?: string): Promise<User[]> {
  const qs = officeId ? `?officeId=${officeId}` : ''
  return apiRequest<User[]>(`/users${qs}`)
}

// ─── Services ────────────────────────────────────────────────────────────────

export async function getServicesApi(officeId?: string): Promise<Service[]> {
  const qs = officeId ? `?officeId=${officeId}` : ''
  return apiRequest<Service[]>(`/services${qs}`)
}

// ─── Transactions ────────────────────────────────────────────────────────────

export async function getTransactionsApi(officeId?: string): Promise<Transaction[]> {
  const qs = officeId ? `?officeId=${officeId}` : ''
  return apiRequest<Transaction[]>(`/transactions${qs}`)
}

export async function getTransactionApi(id: string): Promise<Transaction> {
  return apiRequest<Transaction>(`/transactions/${id}`)
}

export async function createTransactionApi(
  dto: CreateTransactionDto,
  _createdBy: User, // user info comes from JWT in real API
): Promise<Transaction> {
  return apiRequest<Transaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}

export async function assignTransactionApi(
  id: string,
  assignedTo: string,
  _actingUser: User,
): Promise<Transaction> {
  return apiRequest<Transaction>(`/transactions/${id}/assignment`, {
    method: 'PATCH',
    body: JSON.stringify({ assigned_to: assignedTo }),
  })
}

export async function updateTransactionStatusApi(
  id: string,
  dto: UpdateTransactionStatusDto,
  _actingUser: User,
): Promise<Transaction> {
  return apiRequest<Transaction>(`/transactions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  })
}

export async function updateDocumentaryStatusApi(
  id: string,
  dto: UpdateDocumentaryStatusDto,
  _actingUser: User,
): Promise<Transaction> {
  return apiRequest<Transaction>(`/transactions/${id}/documentary-status`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  })
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function getTransactionHistoryApi(
  transactionId: string,
): Promise<TransactionStatusHistory[]> {
  return apiRequest<TransactionStatusHistory[]>(`/transactions/${transactionId}/history`)
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

export async function getAuditLogApi(
  officeId?: string,
  filters?: { actionType?: string; from?: string; to?: string },
): Promise<TransactionStatusHistory[]> {
  const params = new URLSearchParams()
  if (officeId) params.set('officeId', officeId)
  if (filters?.actionType) params.set('actionType', filters.actionType)
  if (filters?.from) params.set('from', filters.from)
  if (filters?.to) params.set('to', filters.to)

  const result = await apiRequest<
    { data: TransactionStatusHistory[]; total: number } | TransactionStatusHistory[]
  >(`/audit-log${params.toString() ? '?' + params.toString() : ''}`)

  // Handle paginated or flat response
  return Array.isArray(result) ? result : result.data
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboardStatsApi(officeId?: string): Promise<DashboardStats> {
  const qs = officeId ? `?officeId=${officeId}` : ''
  return apiRequest<DashboardStats>(`/dashboard/stats${qs}`)
}
