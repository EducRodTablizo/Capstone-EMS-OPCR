/**
 * EMS-003: Cross-office data modification strictly blocked.
 * Returns true if the acting user is allowed to modify the given office's data.
 */
import { useAuth } from '@/auth/AuthContext'

export function useOfficeGuard() {
  const { user } = useAuth()

  function canModify(targetOfficeId: string): boolean {
    if (!user) return false
    // OPCR Evaluator: read-only, never modify
    if (user.role === 'opcr_evaluator') return false
    // Staff and Admin: only their own office
    return user.office_id === targetOfficeId
  }

  function canRead(targetOfficeId: string): boolean {
    if (!user) return false
    // OPCR Evaluator: cross-office read-only
    if (user.role === 'opcr_evaluator') return true
    // Others: own office only
    return user.office_id === targetOfficeId
  }

  function assertCanModify(targetOfficeId: string): void {
    if (!canModify(targetOfficeId)) {
      throw new Error('Access denied: You cannot modify data outside your assigned office.')
    }
  }

  return { canModify, canRead, assertCanModify, userOfficeId: user?.office_id }
}
