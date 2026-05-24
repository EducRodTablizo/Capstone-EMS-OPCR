import type { SlaStatus, Transaction } from '@/types'
import { formatDuration } from './timeUtils'

/**
 * Determine SLA status from processing time and target.
 * EMS-011: automated, not manually editable.
 */
export function computeSlaStatus(
  processingTimeSeconds: number | null,
  slaTargetSeconds: number
): SlaStatus {
  if (processingTimeSeconds === null) return 'pending_computation'
  if (processingTimeSeconds <= slaTargetSeconds) return 'compliant'
  return 'non_compliant'
}

/**
 * EMS-012: flag as breached when non_compliant
 */
export function isSlaBreached(
  processingTimeSeconds: number | null,
  slaTargetSeconds: number
): boolean {
  if (processingTimeSeconds === null) return false
  return processingTimeSeconds > slaTargetSeconds
}

export function slaVariance(transaction: Transaction): string {
  if (transaction.processing_time_seconds === null) return '—'
  const diff = transaction.sla_target_seconds - transaction.processing_time_seconds
  const abs = Math.abs(diff)
  if (diff >= 0) return `−${formatDuration(abs)} under`
  return `+${formatDuration(abs)} over`
}

export function slaPercent(transaction: Transaction): number {
  if (!transaction.processing_time_seconds || !transaction.sla_target_seconds) return 0
  return Math.round((transaction.processing_time_seconds / transaction.sla_target_seconds) * 100)
}
