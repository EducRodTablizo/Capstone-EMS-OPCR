import { format, formatDistanceStrict, parseISO, differenceInSeconds } from 'date-fns'

/**
 * Format seconds into human-readable duration string.
 * e.g. 3720 → "1 hr 2 min"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) return '—'

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 && days === 0) parts.push(`${secs}s`)

  return parts.length ? parts.join(' ') : '< 1s'
}

/**
 * Parse SLA display string (e.g. "22 min", "2 days, 1 hr, 50 min") → seconds
 */
export function parseSlaToSeconds(slaStr: string): number {
  let total = 0
  const dayMatch = slaStr.match(/(\d+)\s*day/i)
  const hrMatch = slaStr.match(/(\d+)\s*hr/i)
  const minMatch = slaStr.match(/(\d+)\s*min/i)
  const secMatch = slaStr.match(/(\d+)\s*sec/i)

  if (dayMatch) total += parseInt(dayMatch[1]) * 86400
  if (hrMatch) total += parseInt(hrMatch[1]) * 3600
  if (minMatch) total += parseInt(minMatch[1]) * 60
  if (secMatch) total += parseInt(secMatch[1])

  return total
}

/**
 * Compute processing time in seconds excluding incomplete (paused) windows.
 * Uses status history array.
 */
export function computeProcessingTime(
  timeIn: string,
  timeOut: string | null,
  pausePeriods: Array<{ start: string; end: string | null }>
): number {
  const start = parseISO(timeIn).getTime()
  const end = timeOut ? parseISO(timeOut).getTime() : Date.now()

  let totalPaused = 0
  for (const period of pausePeriods) {
    const pauseStart = parseISO(period.start).getTime()
    const pauseEnd = period.end ? parseISO(period.end).getTime() : end
    totalPaused += Math.max(0, pauseEnd - pauseStart)
  }

  const raw = end - start
  return Math.max(0, Math.round((raw - totalPaused) / 1000))
}

export function formatDateTime(iso: string): string {
  try {
    return format(parseISO(iso), 'MMM d, yyyy h:mm a')
  } catch {
    return iso
  }
}

export function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), 'MMM d, yyyy')
  } catch {
    return iso
  }
}

export function timeAgo(iso: string): string {
  try {
    return formatDistanceStrict(parseISO(iso), new Date(), { addSuffix: true })
  } catch {
    return iso
  }
}

export function elapsedSeconds(timeIn: string): number {
  return differenceInSeconds(new Date(), parseISO(timeIn))
}
