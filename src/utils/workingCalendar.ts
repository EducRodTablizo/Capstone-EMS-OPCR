/**
 * Philippine Working Calendar — EMS Local Cache
 * Working hours: Monday–Friday, 08:00–17:00 PHT (UTC+8)
 * Excludes PH public holidays & special non-working days (2026 calendar).
 *
 * Used by EMS to compute estimated SLA due dates for display purposes only.
 * Source-of-truth SLA rules live in the Planning & Scheduling System (PSS).
 * This cache is refreshed daily in production.
 */

const PHT_OFFSET_MS = 8 * 60 * 60 * 1000 // UTC+8

// PHT working-hour bounds
const WD_START_H = 8   // 08:00 AM PHT
const WD_END_H   = 17  // 05:00 PM PHT

/** PH declared public holidays + special non-working days for 2026 */
const PH_HOLIDAYS: Set<string> = new Set([
  '2026-01-01', // New Year's Day
  '2026-02-25', // EDSA People Power Revolution Anniversary
  '2026-04-02', // Maundy Thursday
  '2026-04-03', // Good Friday
  '2026-04-04', // Black Saturday (Special)
  '2026-04-09', // Araw ng Kagitingan
  '2026-05-01', // Labor Day
  '2026-06-12', // Independence Day
  '2026-08-21', // Ninoy Aquino Day
  '2026-08-31', // National Heroes Day (last Mon of Aug)
  '2026-10-31', // Halloween (Special)
  '2026-11-01', // All Saints' Day
  '2026-11-02', // All Souls' Day (Special)
  '2026-11-30', // Andres Bonifacio Day
  '2026-12-08', // Feast of the Immaculate Conception (Special)
  '2026-12-24', // Christmas Eve (Special)
  '2026-12-25', // Christmas Day
  '2026-12-30', // Rizal Day
  '2026-12-31', // New Year's Eve (Special)
])

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Format a UTC ms timestamp as YYYY-MM-DD in PHT */
function phtDateStr(utcMs: number): string {
  const d = new Date(utcMs + PHT_OFFSET_MS)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

/**
 * UTC ms for PHT midnight (00:00 PHT) of the same PHT date as utcMs.
 * e.g. utcMs = May 25 08:00 UTC (= May 25 16:00 PHT)
 *   → returns May 24 16:00 UTC (= May 25 00:00 PHT)
 */
function phtDayMidnight(utcMs: number): number {
  const d = new Date(utcMs + PHT_OFFSET_MS)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - PHT_OFFSET_MS
}

/** UTC ms for 08:00 PHT on the same PHT date as utcMs */
function dayStart(utcMs: number): number {
  return phtDayMidnight(utcMs) + WD_START_H * 3_600_000
}

/** UTC ms for 17:00 PHT on the same PHT date as utcMs */
function dayEnd(utcMs: number): number {
  return phtDayMidnight(utcMs) + WD_END_H * 3_600_000
}

/** True if utcMs falls within a working day (Mon–Fri, not a PH holiday in PHT) */
function isWorkDay(utcMs: number): boolean {
  const dow = new Date(utcMs + PHT_OFFSET_MS).getUTCDay() // 0=Sun, 6=Sat
  return dow !== 0 && dow !== 6 && !PH_HOLIDAYS.has(phtDateStr(utcMs))
}

/**
 * Advance utcMs to the nearest valid working moment:
 * - Non-working day → next working day 08:00 PHT
 * - Before 08:00 PHT → 08:00 PHT same day (if working day)
 * - At/after 17:00 PHT → next working day 08:00 PHT
 */
function advanceToWork(utcMs: number): number {
  let t = utcMs
  for (let guard = 0; guard < 365; guard++) {
    if (!isWorkDay(t)) {
      // Jump to next PHT day's 08:00
      t = phtDayMidnight(t) + (24 + WD_START_H) * 3_600_000
      continue
    }
    const s = dayStart(t)
    const e = dayEnd(t)
    if (t >= e) {
      t = phtDayMidnight(t) + (24 + WD_START_H) * 3_600_000
      continue
    }
    if (t < s) t = s
    break
  }
  return t
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Add `seconds` of working time to `startUtc`.
 * Only Mon–Fri, 08:00–17:00 PHT counts; weekends, holidays and off-hours are skipped.
 */
export function addWorkingSeconds(startUtc: Date, seconds: number): Date {
  let current = advanceToWork(startUtc.getTime())
  let remaining = seconds * 1_000 // convert to ms

  for (let guard = 0; guard < 100_000 && remaining > 0; guard++) {
    const e = dayEnd(current)
    const avail = e - current
    if (avail >= remaining) {
      current += remaining
      remaining = 0
    } else {
      remaining -= avail
      current = advanceToWork(phtDayMidnight(current) + (24 + WD_START_H) * 3_600_000)
    }
  }
  return new Date(current)
}

/**
 * Compute the working-hours SLA due date for a transaction.
 * @param timeIn       ISO string of transaction time-in
 * @param slaSeconds   SLA target in seconds
 */
export function computeSlaDueDate(timeIn: string, slaSeconds: number): Date {
  return addWorkingSeconds(new Date(timeIn), slaSeconds)
}

export type SlaDeadlineStatus = 'upcoming' | 'due_today' | 'overdue' | 'completed'

/** Classify how urgent the SLA deadline is relative to now */
export function getSlaDeadlineStatus(
  dueDate: Date,
  txnStatus: string,
): SlaDeadlineStatus {
  if (txnStatus === 'completed') return 'completed'
  const now = new Date()
  if (now > dueDate) return 'overdue'
  const eod = new Date(now)
  eod.setHours(23, 59, 59, 999)
  if (dueDate <= eod) return 'due_today'
  return 'upcoming'
}

/** Format a Date as a human-readable PHT date/time string */
export function formatSlaDueDate(date: Date): string {
  try {
    return date.toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    const pht = new Date(date.getTime() + PHT_OFFSET_MS)
    return pht.toISOString().slice(0, 16).replace('T', ' ') + ' PHT'
  }
}

/** PH holidays list for optional UI display */
export const PH_HOLIDAYS_LIST = [
  { date: '2026-01-01', label: "New Year's Day" },
  { date: '2026-02-25', label: 'EDSA People Power Revolution Day' },
  { date: '2026-04-02', label: 'Maundy Thursday' },
  { date: '2026-04-03', label: 'Good Friday' },
  { date: '2026-04-04', label: 'Black Saturday (Special)' },
  { date: '2026-04-09', label: 'Araw ng Kagitingan' },
  { date: '2026-05-01', label: 'Labor Day' },
  { date: '2026-06-12', label: 'Independence Day' },
  { date: '2026-08-21', label: 'Ninoy Aquino Day' },
  { date: '2026-08-31', label: 'National Heroes Day' },
  { date: '2026-10-31', label: 'Halloween (Special)' },
  { date: '2026-11-01', label: "All Saints' Day" },
  { date: '2026-11-02', label: "All Souls' Day (Special)" },
  { date: '2026-11-30', label: 'Andres Bonifacio Day' },
  { date: '2026-12-08', label: 'Feast of the Immaculate Conception (Special)' },
  { date: '2026-12-24', label: 'Christmas Eve (Special)' },
  { date: '2026-12-25', label: 'Christmas Day' },
  { date: '2026-12-30', label: 'Rizal Day' },
  { date: '2026-12-31', label: "New Year's Eve (Special)" },
]
