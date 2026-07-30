/**
 * Planning & Standard System Integration API Service Layer (Capstone 2)
 *
 * This module isolates all API communication, payload mappers, and score computations
 * for the "Admin Service Performance Review" (Evaluation Period) dashboard.
 *
 * Architecture:
 * - Feature Flag: `USE_EXTERNAL_PLANNING_API` (toggle between Capstone 2 PSS API & Local Fallback Engine)
 * - Raw Transaction Outgoing Payload Mapper: Prepares timeIn/timeOut data for external calculations
 * - Local Fallback Engine: Calculates net working hours/minutes (skipping weekends & PH public holidays)
 * - Scoring Engine: Computes 5-star ratings for Timeliness, Effectiveness, Quality, and overall Percentage
 */

import type { Transaction, OfficeCode } from '@/types'
import { PH_HOLIDAYS_LIST } from '@/utils/workingCalendar'

// ─── Feature Flag Configuration ───────────────────────────────────────────────
export const USE_EXTERNAL_PLANNING_API = false
export const EXTERNAL_PLANNING_API_BASE_URL = 'https://api.planning-standard.pup.edu.ph/v1'

// ─── Period Filter Types ──────────────────────────────────────────────────────
export type EvaluationPeriodType =
  | 'ALL_TIME'
  | 'SEM_2'
  | 'SEM_1'
  | 'Q1'
  | 'Q2'
  | 'Q3'
  | 'Q4'
  | 'ANNUAL'

export type ServiceSortOption =
  | 'DEFAULT'       // Citizen's Charter official order
  | 'RATING_DESC'   // Highest Overall Rating
  | 'RATING_ASC'    // Lowest Overall Rating
  | 'ALPHA_ASC'     // A to Z
  | 'ALPHA_DESC'    // Z to A

export interface PeriodDateRange {
  label: string
  sublabel: string
  startDate: Date
  endDate: Date
}

// ─── Outgoing Payload (To Planning & Standard System) ────────────────────────
export interface OutgoingTransactionPayload {
  transactionId: string
  serviceId: string
  serviceName: string
  timeIn: string
  timeOut: string
}

export interface OutgoingPlanningPayload {
  officeId: string
  period: EvaluationPeriodType
  startDate: string
  endDate: string
  transactions: OutgoingTransactionPayload[]
}

// ─── Incoming Payload (From Planning & Standard System) ──────────────────────
export interface IncomingServicePerformanceResult {
  serviceId: string
  serviceName: string
  slaTargetMinutes: number
  totalVolume: number
  netWorkingDurationMinutes: number
  isCompliant: boolean
  isBreached: boolean
}

export interface IncomingPlanningApiResponse {
  officeId: string
  period: EvaluationPeriodType
  results: IncomingServicePerformanceResult[]
}

// ─── Computed Service Performance Record (Dashboard UI Model) ─────────────────
export interface ServicePerformanceSummary {
  serviceId: string
  serviceName: string
  category: string
  officeCode: OfficeCode
  citizensCharterIndex: number
  totalVolume: number
  timelinessScore: number      // 1.0 to 5.0 stars
  effectivenessScore: number   // 1.0 to 5.0 stars
  qualityScore: number         // 1.0 to 5.0 stars
  overallPercentage: number    // 0% to 100%
  compliantCount: number
  breachedCount: number
  avgWorkingMinutes: number
  slaTargetMinutes: number
}

// ─── Period Helper Functions ──────────────────────────────────────────────────
export function getPeriodDateRange(period: EvaluationPeriodType, year = 2026): PeriodDateRange {
  switch (period) {
    case 'ALL_TIME':
      return {
        label: 'All Time (All Transactions)',
        sublabel: 'All Completed System Transactions',
        startDate: new Date(0),
        endDate: new Date(253402300799000), // Year 9999
      }
    case 'Q1':
      return {
        label: 'Q1 (Jan–Mar)',
        sublabel: `Jan 1, ${year} – Mar 31, ${year}`,
        startDate: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
        endDate: new Date(Date.UTC(year, 2, 31, 23, 59, 59)),
      }
    case 'Q2':
      return {
        label: 'Q2 (Apr–Jun)',
        sublabel: `Apr 1, ${year} – Jun 30, ${year}`,
        startDate: new Date(Date.UTC(year, 3, 1, 0, 0, 0)),
        endDate: new Date(Date.UTC(year, 5, 30, 23, 59, 59)),
      }
    case 'Q3':
      return {
        label: 'Q3 (Jul–Sep)',
        sublabel: `Jul 1, ${year} – Sep 30, ${year}`,
        startDate: new Date(Date.UTC(year, 6, 1, 0, 0, 0)),
        endDate: new Date(Date.UTC(year, 8, 30, 23, 59, 59)),
      }
    case 'Q4':
      return {
        label: 'Q4 (Oct–Dec)',
        sublabel: `Oct 1, ${year} – Dec 31, ${year}`,
        startDate: new Date(Date.UTC(year, 9, 1, 0, 0, 0)),
        endDate: new Date(Date.UTC(year, 11, 31, 23, 59, 59)),
      }
    case 'SEM_1':
      // Sem 1: Aug 1 to Jan 31 of next year
      return {
        label: 'Sem 1 (Aug 1–Jan 31)',
        sublabel: `Aug 1, ${year} – Jan 31, ${year + 1}`,
        startDate: new Date(Date.UTC(year, 7, 1, 0, 0, 0)),
        endDate: new Date(Date.UTC(year + 1, 0, 31, 23, 59, 59)),
      }
    case 'SEM_2':
      // Sem 2: Feb 1 to Jul 31 (Includes July 2026 transactions!)
      return {
        label: 'Sem 2 (Feb 1–Jul 31)',
        sublabel: `Feb 1, ${year} – Jul 31, ${year}`,
        startDate: new Date(Date.UTC(year, 1, 1, 0, 0, 0)),
        endDate: new Date(Date.UTC(year, 6, 31, 23, 59, 59)),
      }
    case 'ANNUAL':
    default:
      return {
        label: 'Full Year (Jan 1–Dec 31)',
        sublabel: `Jan 1, ${year} – Dec 31, ${year}`,
        startDate: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
        endDate: new Date(Date.UTC(year, 11, 31, 23, 59, 59)),
      }
  }
}

// ─── Local Fallback Engine: Working Hours & Holiday Duration Calculator ───────

const HOLIDAY_SET = new Set(PH_HOLIDAYS_LIST.map((h) => h.date))

/**
 * Calculates net working minutes between timeIn and timeOut
 * Excludes weekends (Saturday & Sunday) and PH public holidays.
 * Working hours: 08:00 to 17:00 PHT (9 hours max per day).
 */
export function calculateNetWorkingMinutes(timeInStr: string, timeOutStr: string): number {
  const tIn = new Date(timeInStr)
  const tOut = new Date(timeOutStr)

  if (isNaN(tIn.getTime()) || isNaN(tOut.getTime()) || tOut <= tIn) {
    return 0
  }

  // If total elapsed is very small (less than 1 minute)
  const totalRawSeconds = Math.max(1, Math.round((tOut.getTime() - tIn.getTime()) / 1000))
  if (totalRawSeconds < 3600) {
    return Math.max(1, Math.round(totalRawSeconds / 60))
  }

  // Iterate day by day for precise business hours calculation
  let curr = new Date(tIn)
  let totalWorkingMinutes = 0

  while (curr < tOut) {
    const dayOfWeek = curr.getDay() // 0 = Sun, 6 = Sat
    const isoDateStr = curr.toISOString().split('T')[0]

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isHoliday = HOLIDAY_SET.has(isoDateStr)

    if (!isWeekend && !isHoliday) {
      // Define 8:00 AM to 5:00 PM for current date
      const workStart = new Date(curr)
      workStart.setHours(8, 0, 0, 0)

      const workEnd = new Date(curr)
      workEnd.setHours(17, 0, 0, 0)

      const startBound = curr < workStart ? workStart : curr
      const endBound = tOut < workEnd ? tOut : workEnd

      if (startBound < endBound) {
        const diffMs = endBound.getTime() - startBound.getTime()
        totalWorkingMinutes += Math.round(diffMs / 60000)
      }
    }

    // Move to next midnight
    curr.setDate(curr.getDate() + 1)
    curr.setHours(0, 0, 0, 0)
  }

  return Math.max(1, totalWorkingMinutes)
}

// ─── Metric & Star Rating Calculations ───────────────────────────────────────

/**
 * Timeliness Formula (1.0 to 5.0 Stars):
 * - Finished <= 50% of SLA Target = 5.0 Stars
 * - Finished within SLA Target (50% < t <= 100%) = 4.0 Stars
 * - Minor SLA delay/breach (100% < t <= 150%) = 2.5 - 3.0 Stars
 * - Severe SLA delay/breach (> 150%) = 1.0 Star
 */
export function computeTimelinessStars(avgDurationMinutes: number, slaTargetMinutes: number): number {
  if (slaTargetMinutes <= 0) return 5.0
  const ratio = avgDurationMinutes / slaTargetMinutes

  if (ratio <= 0.5) return 5.0
  if (ratio <= 1.0) return 4.0
  if (ratio <= 1.5) return 3.0
  if (ratio <= 2.0) return 2.0
  return 1.0
}

/**
 * Effectiveness Formula (1.0 to 5.0 Stars):
 * Ratio = Non-Breached Transactions / Total Volume
 * Ratio to 5-star scale: 100% = 5.0 Stars, 80% = 4.0 Stars, etc.
 */
export function computeEffectivenessStars(compliantCount: number, totalVolume: number): number {
  if (totalVolume <= 0) return 0.0
  const ratio = Math.min(1, Math.max(0, compliantCount / totalVolume))
  const rawStars = 1.0 + ratio * 4.0
  return Math.round(rawStars * 10) / 10
}

/**
 * Quality Formula (1.0 to 5.0 Stars):
 * Derived from compliance ratio and service accuracy metrics.
 */
export function computeQualityStars(compliantCount: number, totalVolume: number, avgTimeliness: number): number {
  if (totalVolume <= 0) return 0.0
  const complianceRatio = compliantCount / totalVolume
  const timelinessWeight = avgTimeliness / 5.0
  const composite = complianceRatio * 0.7 + timelinessWeight * 0.3
  const rawStars = 1.0 + composite * 4.0
  return Math.round(rawStars * 10) / 10
}

/**
 * Overall Composite Percentage Score (%):
 * ((Timeliness + Effectiveness + Quality) / 15) * 100%
 */
export function computeOverallPercentage(timeliness: number, effectiveness: number, quality: number): number {
  const sum = timeliness + effectiveness + quality
  const pct = (sum / 15.0) * 100
  return Math.min(100, Math.round(pct * 10) / 10)
}

// ─── Service Layer Integration Functions ─────────────────────────────────────

/**
 * Maps raw client transactions to external PSS payload format.
 */
export function mapOutgoingPayload(
  officeId: string,
  period: EvaluationPeriodType,
  transactions: Transaction[]
): OutgoingPlanningPayload {
  const range = getPeriodDateRange(period)
  return {
    officeId,
    period,
    startDate: range.startDate.toISOString(),
    endDate: range.endDate.toISOString(),
    transactions: transactions.map((t) => ({
      transactionId: t.id,
      serviceId: t.service_id,
      serviceName: t.service_name,
      timeIn: t.time_in,
      timeOut: t.time_out || t.updated_at,
    })),
  }
}

/**
 * Primary Service API function to evaluate service performance data based strictly on system transactions.
 */
export async function fetchServicePerformanceReview(
  officeCode: OfficeCode | 'ALL',
  period: EvaluationPeriodType,
  sortBy: ServiceSortOption,
  allServices: Array<{ id: string; name: string; category: string; office_code: OfficeCode; office_id?: string; sla_target_seconds: number }>,
  allTransactions: Transaction[]
): Promise<ServicePerformanceSummary[]> {
  const range = getPeriodDateRange(period)

  // Office match targets
  const officeMap: Record<string, string[]> = {
    ADMIN_OFFICE: ['off-1', 'admin_office', 'administrative office'],
    ACADEMIC_OFFICE: ['off-2', 'academic_office', 'academic office'],
    OSAS: ['off-3', 'osas', 'office of student affairs and services'],
  }

  // Strictly filter completed transactions by office and period date window
  const periodCompletedTxns = allTransactions.filter((t) => {
    // Only completed transactions count toward performance review
    if (t.status !== 'completed') return false

    // Date range check
    if (period !== 'ALL_TIME') {
      const timeOutDate = new Date(t.time_out || t.updated_at || t.time_in)
      if (timeOutDate < range.startDate || timeOutDate > range.endDate) {
        return false
      }
    }

    // Office check
    if (officeCode === 'ALL') return true
    const targets = officeMap[officeCode] || [officeCode.toLowerCase()]
    const matchesId = t.office_id && targets.includes(t.office_id.toLowerCase())
    const matchesName = t.office_name && targets.some((target) => t.office_name.toLowerCase().includes(target))
    return matchesId || matchesName
  })

  // Filter service catalog by office
  const scopedServices = allServices.filter((s) => {
    if (officeCode === 'ALL') return true
    if (s.office_code === officeCode) return true
    const targets = officeMap[officeCode] || []
    return s.office_id && targets.includes(s.office_id.toLowerCase())
  })

  // Build performance summary per unique service
  const summaries: ServicePerformanceSummary[] = scopedServices.map((svc, index) => {
    // Find all completed transactions belonging to this service
    const svcTxns = periodCompletedTxns.filter((t) => {
      if (t.service_id && t.service_id === svc.id) return true
      if (!t.service_name) return false
      const tName = t.service_name.trim().toLowerCase()
      const sName = svc.name.trim().toLowerCase()
      return (
        tName === sName ||
        tName.startsWith(sName) ||
        sName.startsWith(tName) ||
        tName.includes(sName) ||
        sName.includes(tName)
      )
    })

    const totalVolume = svcTxns.length
    const slaTargetMinutes = Math.max(1, Math.round(svc.sla_target_seconds / 60))

    let compliantCount = 0
    let breachedCount = 0
    let totalWorkingMinutes = 0

    if (totalVolume > 0) {
      svcTxns.forEach((t) => {
        const workingMins = t.processing_time_seconds
          ? Math.max(1, Math.round(t.processing_time_seconds / 60))
          : calculateNetWorkingMinutes(t.time_in, t.time_out || t.updated_at)

        totalWorkingMinutes += workingMins

        const isCompliant =
          t.sla_status === 'compliant' ||
          (!t.is_sla_breached && t.sla_status !== 'non_compliant' && workingMins <= slaTargetMinutes)

        if (isCompliant) {
          compliantCount++
        } else {
          breachedCount++
        }
      })
    }

    const avgWorkingMinutes = totalVolume > 0 ? Math.round(totalWorkingMinutes / totalVolume) : 0

    // Compute metrics — Maximum rating is 5.0 Stars (100.0%). Compute deductions only if SLA target exceeded or breached.
    let timelinessScore = 5.0
    let effectivenessScore = 5.0
    let qualityScore = 5.0
    let overallPercentage = 100.0

    if (totalVolume > 0 && (breachedCount > 0 || avgWorkingMinutes > slaTargetMinutes)) {
      timelinessScore = computeTimelinessStars(avgWorkingMinutes, slaTargetMinutes)
      effectivenessScore = computeEffectivenessStars(compliantCount, totalVolume)
      qualityScore = computeQualityStars(compliantCount, totalVolume, timelinessScore)
      overallPercentage = computeOverallPercentage(timelinessScore, effectivenessScore, qualityScore)
    }

    return {
      serviceId: svc.id,
      serviceName: svc.name,
      category: svc.category,
      officeCode: svc.office_code,
      citizensCharterIndex: index,
      totalVolume,
      timelinessScore,
      effectivenessScore,
      qualityScore,
      overallPercentage,
      compliantCount,
      breachedCount,
      avgWorkingMinutes,
      slaTargetMinutes,
    }
  })

  // Apply Sorting
  return sortServiceSummaries(summaries, sortBy)
}

function sortServiceSummaries(
  summaries: ServicePerformanceSummary[],
  sortBy: ServiceSortOption
): ServicePerformanceSummary[] {
  const copy = [...summaries]
  switch (sortBy) {
    case 'RATING_DESC':
      return copy.sort((a, b) => b.overallPercentage - a.overallPercentage)
    case 'RATING_ASC':
      return copy.sort((a, b) => a.overallPercentage - b.overallPercentage)
    case 'ALPHA_ASC':
      return copy.sort((a, b) => a.serviceName.localeCompare(b.serviceName))
    case 'ALPHA_DESC':
      return copy.sort((a, b) => b.serviceName.localeCompare(a.serviceName))
    case 'DEFAULT':
    default:
      return copy.sort((a, b) => a.citizensCharterIndex - b.citizensCharterIndex)
  }
}
