/**
 * Real API client — hits the NestJS API Gateway (http://localhost:3001/api).
 * Used automatically in dev mode (import.meta.env.DEV).
 * All functions have identical signatures to mockApi.ts for drop-in replacement.
 */

import type {
  User, Service, Transaction, TransactionStatusHistory,
  CreateTransactionDto, UpdateTransactionStatusDto, UpdateDocumentaryStatusDto,
  DashboardStats, LoginResponse, LoginDto,
} from '@/types'
import { getToken, removeToken } from '@/utils/jwt'

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
    removeToken()
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
 * loginApi — Dev mode: calls GET /api/auth/me (API Gateway injects dev user).
 * Production: ARMS issues JWT → frontend stores it → GET /api/auth/me validates it.
 * EMS does NOT issue JWTs. Login is owned by ARMS.
 */
export async function loginApi(_dto: LoginDto): Promise<LoginResponse> {
  // In dev mode, the DevAuthInner in AuthContext handles user injection automatically.
  // This path is only called via the mock login form — return the dev user from API Gateway.
  const user = await apiRequest<User>('/auth/me')
  return { access_token: 'dev-bypass-token', user }
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
