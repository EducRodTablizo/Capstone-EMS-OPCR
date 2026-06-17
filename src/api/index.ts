/**
 * API Router — switches between mock and real API.
 *
 * Dev mode (Vite dev server, import.meta.env.DEV = true):
 *   Always uses realApi.ts → hits API Gateway at http://localhost:3001/api
 *   No toggle needed — hybrid mode is automatic.
 *
 * Production build (import.meta.env.DEV = false):
 *   Uses realApi.ts by default.
 *   Can override via browser console for debugging:
 *     window.__EMS_USE_REAL_API__ = false  → revert to mock
 *     localStorage.setItem('ems_use_real_api', 'false')
 */

import * as mockApi from './mockApi'
import * as realApi from './realApi'

declare global {
  interface Window {
    __EMS_USE_REAL_API__: boolean
  }
}

function isRealApiEnabled(): boolean {
  // Dev mode: always use real API (hybrid mode)
  if (import.meta.env.DEV) return true

  // Production: check runtime toggle (for debugging)
  if (typeof window !== 'undefined' && window.__EMS_USE_REAL_API__ === false) {
    return false
  }
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('ems_use_real_api')
    if (stored === 'false') return false
  }
  return true // default to real API in production too
}

function api<K extends keyof typeof mockApi>(fnName: K): typeof mockApi[K] {
  return (isRealApiEnabled() ? realApi : mockApi)[fnName] as typeof mockApi[K]
}

// ─── Re-exports — identical signatures to mockApi ─────────────────────────────

export const loginApi = (...args: Parameters<typeof mockApi.loginApi>) =>
  api('loginApi')(...args)

export const getUsersApi = (...args: Parameters<typeof mockApi.getUsersApi>) =>
  api('getUsersApi')(...args)

export const getServicesApi = (...args: Parameters<typeof mockApi.getServicesApi>) =>
  api('getServicesApi')(...args)

export const getTransactionsApi = (...args: Parameters<typeof mockApi.getTransactionsApi>) =>
  api('getTransactionsApi')(...args)

export const getTransactionApi = (...args: Parameters<typeof mockApi.getTransactionApi>) =>
  api('getTransactionApi')(...args)

export const createTransactionApi = (...args: Parameters<typeof mockApi.createTransactionApi>) =>
  api('createTransactionApi')(...args)

export const assignTransactionApi = (...args: Parameters<typeof mockApi.assignTransactionApi>) =>
  api('assignTransactionApi')(...args)

export const updateTransactionStatusApi = (...args: Parameters<typeof mockApi.updateTransactionStatusApi>) =>
  api('updateTransactionStatusApi')(...args)

export const updateDocumentaryStatusApi = (...args: Parameters<typeof mockApi.updateDocumentaryStatusApi>) =>
  api('updateDocumentaryStatusApi')(...args)

export const getTransactionHistoryApi = (...args: Parameters<typeof mockApi.getTransactionHistoryApi>) =>
  api('getTransactionHistoryApi')(...args)

export const getAuditLogApi = (...args: Parameters<typeof mockApi.getAuditLogApi>) =>
  api('getAuditLogApi')(...args)

export const getDashboardStatsApi = (...args: Parameters<typeof mockApi.getDashboardStatsApi>) =>
  api('getDashboardStatsApi')(...args)
