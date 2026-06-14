import { Injectable, Inject } from '@nestjs/common'
import { Pool } from 'pg'
import { PG_POOL } from '../database/database.module'

interface CalendarRow {
  calendar_year: number
  holidays: string[]
  working_hours: {
    start: string
    end: string
    timezone: string
    days: number[]
  }
}

/**
 * Calendar Service
 * Reads working calendar from pss_calendar_cache (seeded from workingCalendar.ts).
 * Computes net working seconds between two timestamps,
 * excluding holidays and non-business hours.
 *
 * Phase 4: Calendar data will be refreshed from PSS via Kafka.
 */
@Injectable()
export class CalendarService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getCalendar(year: number): Promise<CalendarRow | null> {
    const result = await this.pool.query<CalendarRow>(
      `SELECT calendar_year, holidays, working_hours FROM pss_calendar_cache WHERE calendar_year = $1`,
      [year],
    )
    return result.rows[0] ?? null
  }

  /**
   * Compute net working seconds between two timestamps.
   * Excludes: weekends, Philippine holidays, hours outside 08:00–17:00 MNL.
   */
  async computeWorkingSeconds(from: Date, to: Date): Promise<number> {
    const year = from.getFullYear()
    const calendar = await this.getCalendar(year)
    const holidays = new Set<string>(calendar?.holidays ?? [])
    const workHours = calendar?.working_hours ?? { start: '08:00', end: '17:00', days: [1, 2, 3, 4, 5] }
    const workDays = new Set<number>(workHours.days)
    const [startH, startM] = workHours.start.split(':').map(Number)
    const [endH, endM] = workHours.end.split(':').map(Number)
    const dayStart = startH * 3600 + startM * 60
    const dayEnd = endH * 3600 + endM * 60

    let total = 0
    let cursor = new Date(from)

    while (cursor < to) {
      const dateStr = cursor.toISOString().split('T')[0]
      const dayOfWeek = cursor.getDay()

      if (workDays.has(dayOfWeek) && !holidays.has(dateStr)) {
        // Determine the working window for this day
        const dayBaseMs = new Date(dateStr).getTime()
        const winStart = new Date(dayBaseMs + dayStart * 1000)
        const winEnd = new Date(dayBaseMs + dayEnd * 1000)

        const effectiveStart = cursor > winStart ? cursor : winStart
        const effectiveEnd = to < winEnd ? to : winEnd

        if (effectiveEnd > effectiveStart) {
          total += (effectiveEnd.getTime() - effectiveStart.getTime()) / 1000
        }
      }

      // Advance to next day 00:00
      cursor = new Date(cursor)
      cursor.setDate(cursor.getDate() + 1)
      cursor.setHours(0, 0, 0, 0)
    }

    return Math.round(total)
  }
}
