/**
 * Mock API — simulates NestJS responses.
 * Replace each function body with real apiClient calls when backend is ready.
 */

import type {
  User, Service, Transaction, TransactionStatusHistory,
  CreateTransactionDto, UpdateTransactionStatusDto, UpdateDocumentaryStatusDto,
  DashboardStats, LoginDto, LoginResponse,
} from '@/types'
import {
  MOCK_USERS, MOCK_SERVICES, MOCK_TRANSACTIONS, MOCK_HISTORY, MOCK_CREDENTIALS,
} from '@/utils/mockData'
import { saveToken } from '@/utils/jwt'
import { elapsedSeconds } from '@/utils/timeUtils'
import { computeSlaStatus, isSlaBreached } from '@/utils/slaUtils'

// ─── In-memory store ─────────────────────────────────────────────────────────

const _users = [...MOCK_USERS]
let _transactions: Transaction[] = [...MOCK_TRANSACTIONS]
const _history: TransactionStatusHistory[] = [...MOCK_HISTORY]

const delay = (ms = 300) => new Promise<void>((r) => setTimeout(r, ms))

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function loginApi(dto: LoginDto): Promise<LoginResponse> {
  await delay(500)
  const cred = MOCK_CREDENTIALS[dto.email]
  if (!cred || cred.password !== dto.password) {
    throw new Error('Invalid email or password')
  }
  const user = _users.find((u) => u.id === cred.userId)
  if (!user || !user.is_active) throw new Error('User account is inactive')

  // Build a mock JWT (not cryptographically signed — for demo only)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    office_id: user.office_id,
    office_code: user.office_code,
    office_name: user.office_name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 28800, // 8 hours
  }))
  const signature = btoa('mock_signature')
  const token = `${header}.${payload}.${signature}`

  saveToken(token)
  return { access_token: token, user }
}

// ─── Users (EMS-001) ─────────────────────────────────────────────────────────

export async function getUsersApi(officeId?: string): Promise<User[]> {
  await delay()
  return officeId
    ? _users.filter((u) => u.office_id === officeId && u.is_active)
    : _users.filter((u) => u.is_active)
}

// ─── Services ────────────────────────────────────────────────────────────────

export async function getServicesApi(officeId?: string): Promise<Service[]> {
  await delay()
  return officeId
    ? MOCK_SERVICES.filter((s) => s.office_id === officeId && s.is_active)
    : MOCK_SERVICES.filter((s) => s.is_active)
}

// ─── Transactions ────────────────────────────────────────────────────────────

export async function getTransactionsApi(officeId?: string): Promise<Transaction[]> {
  await delay()
  const list = officeId
    ? _transactions.filter((t) => t.office_id === officeId)
    : _transactions
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function getTransactionApi(id: string): Promise<Transaction> {
  await delay()
  const txn = _transactions.find((t) => t.id === id)
  if (!txn) throw new Error('Transaction not found')
  return txn
}

// EMS-004: Create transaction — auto time-in
export async function createTransactionApi(
  dto: CreateTransactionDto,
  createdBy: User,
): Promise<Transaction> {
  await delay(400)
  const service = MOCK_SERVICES.find((s) => s.id === dto.service_id)
  if (!service) throw new Error('Service not found')

  const assignee = dto.assigned_to ? _users.find((u) => u.id === dto.assigned_to) : null
  const documentaryStatus = dto.documentation_status ?? 'complete'

  const assignedToId = assignee?.id ?? dto.assigned_to ?? null
  const assignedToName = assignee?.name ?? (dto.assigned_to ?? null)

  const newTxn: Transaction = {
    id: `txn-${Date.now()}`,
    service_id: service.id,
    service_name: service.name,
    service_category: service.category,
    office_id: createdBy.office_id,
    office_name: createdBy.office_name,
    assigned_to: assignedToId,
    assigned_to_name: assignedToName,
    created_by: createdBy.id,
    created_by_name: createdBy.name,
    time_in: new Date().toISOString(), // EMS-004: auto time-in
    time_out: null,
    status: 'pending',
    documentary_status: documentaryStatus,
    processing_time_seconds: null,
    sla_target_seconds: service.sla_target_seconds,
    sla_status: 'pending_computation',
    is_sla_breached: false,
    client_name: dto.client_name,
    client_type: dto.client_type ?? null,
    student_number: dto.student_number ?? null,
    course: dto.course ?? null,
    year_level: dto.year_level ?? null,
    contact_number: dto.contact_number ?? null,
    organization: dto.organization ?? null,
    service_specific_data: dto.service_specific_data ?? null,
    audit_timeline: [
      {
        id: `at-${Date.now()}`,
        event: 'Transaction created',
        timestamp: new Date().toISOString(),
        created_by_name: createdBy.name,
      },
    ],
    remarks: dto.remarks ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  _transactions = [newTxn, ..._transactions]

  // Record initial history
  _history.push({
    id: `h-${Date.now()}`,
    transaction_id: newTxn.id,
    old_status: null, new_status: 'pending',
    documentary_old: null, documentary_new: documentaryStatus,
    changed_by: createdBy.id, changed_by_name: createdBy.name,
    changed_at: newTxn.time_in,
    remarks: 'Transaction created',
  })

  return newTxn
}

// EMS-005: Assign transaction
export async function assignTransactionApi(
  id: string,
  assignedTo: string,
  actingUser: User,
): Promise<Transaction> {
  await delay()
  const idx = _transactions.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error('Transaction not found')

  // EMS-005: only same-office staff; admin can reassign
  const txn = _transactions[idx]
  if (txn.office_id !== actingUser.office_id) throw new Error('Cross-office assignment not allowed')

  const assignee = _users.find((u) => u.id === assignedTo)
  if (!assignee || assignee.office_id !== txn.office_id) {
    throw new Error('Assignee must be in the same office')
  }

  const updated: Transaction = {
    ...txn,
    assigned_to: assignee.id,
    assigned_to_name: assignee.name,
    updated_at: new Date().toISOString(),
  }
  _transactions[idx] = updated
  return updated
}

// EMS-006: Update status — timestamped, EMS-008: auto time-out
export async function updateTransactionStatusApi(
  id: string,
  dto: UpdateTransactionStatusDto,
  actingUser: User,
): Promise<Transaction> {
  await delay()
  const idx = _transactions.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error('Transaction not found')

  const txn = _transactions[idx]
  if (txn.status === 'completed') throw new Error('Completed transactions are read-only')

  const now = new Date().toISOString()

  // EMS-008: auto time-out when completed
  const timeOut = dto.status === 'completed' ? now : txn.time_out

  // EMS-009: compute processing time on completion (excluding incomplete windows)
  let processingTime = txn.processing_time_seconds
  let slaStatus = txn.sla_status
  let isBreach = txn.is_sla_breached

  if (dto.status === 'completed' && timeOut) {
    // Simple computation: elapsed seconds from time_in to time_out
    processingTime = elapsedSeconds(txn.time_in)
    slaStatus = computeSlaStatus(processingTime, txn.sla_target_seconds)
    isBreach = isSlaBreached(processingTime, txn.sla_target_seconds)
  }

  const updated: Transaction = {
    ...txn,
    status: dto.status,
    time_out: timeOut,
    processing_time_seconds: processingTime,
    sla_status: slaStatus,
    is_sla_breached: isBreach,
    updated_at: now,
  }
  _transactions[idx] = updated

  _history.push({
    id: `h-${Date.now()}`,
    transaction_id: id,
    old_status: txn.status, new_status: dto.status,
    documentary_old: txn.documentary_status, documentary_new: txn.documentary_status,
    changed_by: actingUser.id, changed_by_name: actingUser.name,
    changed_at: now, remarks: dto.remarks ?? null,
  })

  return updated
}

// EMS-007: Update documentary status
export async function updateDocumentaryStatusApi(
  id: string,
  dto: UpdateDocumentaryStatusDto,
  actingUser: User,
): Promise<Transaction> {
  await delay()
  const idx = _transactions.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error('Transaction not found')

  const txn = _transactions[idx]
  if (txn.status === 'completed') throw new Error('Completed transactions are read-only')

  const now = new Date().toISOString()
  const updated: Transaction = {
    ...txn,
    documentary_status: dto.documentary_status,
    updated_at: now,
  }
  _transactions[idx] = updated

  _history.push({
    id: `h-${Date.now()}`,
    transaction_id: id,
    old_status: txn.status, new_status: txn.status,
    documentary_old: txn.documentary_status, documentary_new: dto.documentary_status,
    changed_by: actingUser.id, changed_by_name: actingUser.name,
    changed_at: now, remarks: dto.remarks ?? null,
  })

  return updated
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function getTransactionHistoryApi(transactionId: string): Promise<TransactionStatusHistory[]> {
  await delay()
  return _history
    .filter((h) => h.transaction_id === transactionId)
    .sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime())
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export async function getDashboardStatsApi(officeId?: string): Promise<DashboardStats> {
  await delay()
  const list = officeId
    ? _transactions.filter((t) => t.office_id === officeId)
    : _transactions

  const total = list.length
  const pending = list.filter((t) => t.status === 'pending').length
  const in_progress = list.filter((t) => t.status === 'in_progress').length
  const completed = list.filter((t) => t.status === 'completed').length
  const compliant = list.filter((t) => t.sla_status === 'compliant').length
  const non_compliant = list.filter((t) => t.sla_status === 'non_compliant').length
  const pending_computation = list.filter((t) => t.sla_status === 'pending_computation').length
  const sla_breach_count = list.filter((t) => t.is_sla_breached).length
  const compliance_rate = completed > 0 ? Math.round((compliant / completed) * 100) : 0

  return {
    total_transactions: total,
    pending, in_progress, completed,
    compliant, non_compliant, pending_computation,
    sla_breach_count, compliance_rate,
  }
}
