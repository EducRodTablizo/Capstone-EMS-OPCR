/**
 * API Router — switches between mock and real API.
 *
 * How to enable real API (in browser console or before page load):
 *   window.__EMS_USE_REAL_API__ = true
 *   localStorage.setItem('ems_use_real_api', 'true')
 *
 * How to revert to mock:
 *   window.__EMS_USE_REAL_API__ = false
 *   localStorage.removeItem('ems_use_real_api')
 *
 * Default: mock API (so the app works without a backend running).
 */

import * as mockApi from './mockApi'
import * as realApi from './realApi'

declare global {
  interface Window {
    __EMS_USE_REAL_API__: boolean
  }
}

function isRealApiEnabled(): boolean {
  // Check runtime toggle first
  if (typeof window !== 'undefined' && window.__EMS_USE_REAL_API__ === true) {
    return true
  }
  // Then check persisted preference
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('ems_use_real_api') === 'true'
  }
  return false
}

function api<K extends keyof typeof mockApi>(fnName: K): typeof mockApi[K] {
  return (isRealApiEnabled() ? realApi : mockApi)[fnName] as typeof mockApi[K]
}

// ─── Re-exports — same interface as mockApi ───────────────────────────────────

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
