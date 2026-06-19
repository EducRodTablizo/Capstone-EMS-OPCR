import type {
  User, Service, Transaction, TransactionStatusHistory,
  CreateTransactionDto, UpdateTransactionStatusDto, UpdateDocumentaryStatusDto,
  DashboardStats, LoginDto,
} from '@/types'
import { apiClient } from './client'

// ─── Authentication ──────────────────────────────────────────────────────────

export async function loginApi(dto: LoginDto): Promise<{ token: string; user: User }> {
  const response = await apiClient.post<{ token: string; user: User }>('/auth/login', dto)
  return response.data
}

export async function getMeApi(): Promise<User> {
  const response = await apiClient.get<User>('/auth/me')
  return response.data
}

// ─── Users (EMS-001) ─────────────────────────────────────────────────────────

export async function getUsersApi(officeId?: string): Promise<User[]> {
  const response = await apiClient.get<User[]>(
    officeId ? `/users?officeId=${officeId}` : '/users'
  )
  return response.data
}

// ─── Services ────────────────────────────────────────────────────────────────

export async function getServicesApi(officeId?: string): Promise<Service[]> {
  const response = await apiClient.get<Service[] | { data: Service[] }>(
    officeId ? `/services?officeId=${officeId}` : '/services'
  )
  const resData = response.data
  return Array.isArray(resData) ? resData : resData?.data ?? []
}

// ─── Transactions ────────────────────────────────────────────────────────────

export async function getTransactionsApi(officeId?: string): Promise<Transaction[]> {
  const response = await apiClient.get<Transaction[] | { data: Transaction[] }>(
    officeId ? `/transactions?officeId=${officeId}` : '/transactions'
  )
  const resData = response.data
  return Array.isArray(resData) ? resData : resData?.data ?? []
}

export async function getTransactionApi(id: string): Promise<Transaction> {
  const response = await apiClient.get<Transaction>(`/transactions/${id}`)
  return response.data
}


export async function createTransactionApi(
  dto: CreateTransactionDto,
  _createdBy: User, // kept for signature compatibility
): Promise<Transaction> {
  const response = await apiClient.post<Transaction>('/transactions', dto)
  return response.data
}

export async function assignTransactionApi(
  id: string,
  assignedTo: string,
  _actingUser: User, // kept for signature compatibility
): Promise<Transaction> {
  const response = await apiClient.patch<Transaction>(`/transactions/${id}/assignment`, {
    assigned_to: assignedTo,
  })
  return response.data
}

export async function updateTransactionStatusApi(
  id: string,
  dto: UpdateTransactionStatusDto,
  _actingUser: User, // kept for signature compatibility
): Promise<Transaction> {
  const response = await apiClient.patch<Transaction>(`/transactions/${id}/status`, dto)
  return response.data
}

export async function updateDocumentaryStatusApi(
  id: string,
  dto: UpdateDocumentaryStatusDto,
  _actingUser: User, // kept for signature compatibility
): Promise<Transaction> {
  const response = await apiClient.patch<Transaction>(`/transactions/${id}/documentary-status`, dto)
  return response.data
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function getTransactionHistoryApi(transactionId: string): Promise<TransactionStatusHistory[]> {
  const response = await apiClient.get<TransactionStatusHistory[] | { data: TransactionStatusHistory[] }>(`/transactions/${transactionId}/history`)
  const resData = response.data
  return Array.isArray(resData) ? resData : resData?.data ?? []
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

export async function getAuditLogApi(
  officeId?: string,
  filters?: { actionType?: string; from?: string; to?: string },
): Promise<TransactionStatusHistory[]> {
  const params = new URLSearchParams()
  if (officeId) params.append('officeId', officeId)
  if (filters?.actionType) params.append('actionType', filters.actionType)
  if (filters?.from) params.append('from', filters.from)
  if (filters?.to) params.append('to', filters.to)

  const qs = params.toString()
  const response = await apiClient.get<TransactionStatusHistory[] | { data: TransactionStatusHistory[] }>(`/audit-log${qs ? '?' + qs : ''}`)
  const resData = response.data
  return Array.isArray(resData) ? resData : resData?.data ?? []
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export async function getDashboardStatsApi(officeId?: string): Promise<DashboardStats> {
  const qs = officeId ? `?officeId=${officeId}` : ''
  const response = await apiClient.get<DashboardStats>(`/dashboard/stats${qs}`)
  return response.data
}

// ─── Override Functions ──────────────────────────────────────────────────────

export async function overrideTimeInApi(
  id: string,
  newTimeIn: string,
  reason: string,
  documentName: string | null,
  _actingUser: User, // kept for signature compatibility
): Promise<Transaction> {
  // Fetch current transaction
  const txn = await getTransactionApi(id)

  // Persist the override action as a status update with remarks to log it in audit history
  try {
    await apiClient.patch(`/transactions/${id}/status`, {
      status: txn.status,
      remarks: `Time-In Overridden to ${newTimeIn}. Reason: ${reason}${documentName ? ` (Doc: ${documentName})` : ''}`,
    })
  } catch (err) {
    console.error('Failed to persist override remarks to backend:', err)
  }

  // Return the locally updated transaction object with the new time_in
  return {
    ...txn,
    time_in: newTimeIn,
    is_overridden: true,
    override_reason: reason,
    override_document_name: documentName || undefined,
  }
}

export async function uploadOverrideDocumentApi(
  id: string,
  documentName: string,
  _actingUser: User, // kept for signature compatibility
): Promise<Transaction> {
  const txn = await getTransactionApi(id)

  try {
    await apiClient.patch(`/transactions/${id}/status`, {
      status: txn.status,
      remarks: `Supporting document uploaded: ${documentName}`,
    })
  } catch (err) {
    console.error('Failed to persist upload remarks to backend:', err)
  }

  return {
    ...txn,
    override_document_name: documentName,
  }
}
