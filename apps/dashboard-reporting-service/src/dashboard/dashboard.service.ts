import { Injectable, Inject } from '@nestjs/common'
import { Pool } from 'pg'
import { PG_POOL } from '../database/database.module'
import type { DashboardStats } from '@ems/types'

export interface PerformanceByService {
  service_id: string
  service_name: string
  total: number
  compliant: number
  non_compliant: number
  compliance_rate: number
  avg_processing_seconds: number
}

@Injectable()
export class DashboardService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getStats(officeId?: string): Promise<DashboardStats> {
    // Uses existing fn_get_dashboard_stats() PostgreSQL function (from 02_functions.sql)
    const result = await this.pool.query<DashboardStats>(
      officeId
        ? `SELECT * FROM fn_get_dashboard_stats($1)`
        : `SELECT * FROM fn_get_dashboard_stats(NULL)`,
      officeId ? [officeId] : undefined,
    )

    // Fallback: manual aggregation if function doesn't exist yet
    if (!result.rows[0]) {
      return this.getStatsManual(officeId)
    }

    return result.rows[0]
  }

  private async getStatsManual(officeId?: string): Promise<DashboardStats> {
    const where = officeId ? 'WHERE office_id = $1' : ''
    const params = officeId ? [officeId] : undefined

    const result = await this.pool.query<{
      total: string; pending: string; in_progress: string; completed: string;
      compliant: string; non_compliant: string; pending_computation: string;
      sla_breach_count: string;
    }>(
      `SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE sla_status = 'compliant') AS compliant,
        COUNT(*) FILTER (WHERE sla_status = 'non_compliant') AS non_compliant,
        COUNT(*) FILTER (WHERE sla_status = 'pending_computation') AS pending_computation,
        COUNT(*) FILTER (WHERE is_sla_breached = TRUE) AS sla_breach_count
       FROM transactions ${where}`,
      params,
    )

    const row = result.rows[0]
    const total = parseInt(row.total, 10)
    const completed = parseInt(row.completed, 10)
    const compliant = parseInt(row.compliant, 10)

    return {
      total_transactions: total,
      pending: parseInt(row.pending, 10),
      in_progress: parseInt(row.in_progress, 10),
      completed,
      compliant,
      non_compliant: parseInt(row.non_compliant, 10),
      pending_computation: parseInt(row.pending_computation, 10),
      sla_breach_count: parseInt(row.sla_breach_count, 10),
      compliance_rate: completed > 0 ? Math.round((compliant / completed) * 100) : 0,
    }
  }

  async getPerformanceByService(officeId?: string): Promise<PerformanceByService[]> {
    const where = officeId ? 'WHERE t.office_id = $1 AND t.status = \'completed\'' : 'WHERE t.status = \'completed\''
    const params = officeId ? [officeId] : undefined

    const result = await this.pool.query<PerformanceByService>(
      `SELECT
        s.id AS service_id,
        s.name AS service_name,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE t.sla_status = 'compliant') AS compliant,
        COUNT(*) FILTER (WHERE t.sla_status = 'non_compliant') AS non_compliant,
        ROUND(100.0 * COUNT(*) FILTER (WHERE t.sla_status = 'compliant') / NULLIF(COUNT(*), 0)) AS compliance_rate,
        ROUND(AVG(t.processing_time_seconds))::INTEGER AS avg_processing_seconds
       FROM transactions t
       JOIN services s ON t.service_id = s.id
       ${where}
       GROUP BY s.id, s.name
       ORDER BY total DESC`,
      params,
    )

    return result.rows
  }

  async getPssStatus(): Promise<{
    last_sync: Date | null
    pss_synced_services: number
    arms_dispatch_health: Array<{ status: string; count: string }>
  }> {
    const [syncRow, countRow, healthRow] = await Promise.all([
      this.pool.query<{ synced_at: Date }>(
        `SELECT synced_at FROM pss_sync_log WHERE status = 'success' ORDER BY synced_at DESC LIMIT 1`,
      ),
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM services WHERE pss_service_code IS NOT NULL`,
      ),
      this.pool.query<{ status: string; count: string }>(
        `SELECT status, COUNT(*) AS count FROM arms_audit_dispatch_log
         WHERE created_at > NOW() - INTERVAL '24 hours' GROUP BY status`,
      ),
    ])

    return {
      last_sync: syncRow.rows[0]?.synced_at ?? null,
      pss_synced_services: parseInt(countRow.rows[0]?.count ?? '0', 10),
      arms_dispatch_health: healthRow.rows,
    }
  }
}
