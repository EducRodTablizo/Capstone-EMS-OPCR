import { Injectable, Inject, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Pool } from 'pg'
import { firstValueFrom } from 'rxjs'
import { PG_POOL } from '../database/database.module'

interface PssService {
  pss_service_code: string
  name: string
  category: string
  client_type: string
  sla_target_seconds: number
  sla_display: string
  is_na?: boolean
  intake_schema?: Record<string, unknown>
}

interface PssCatalogResponse {
  services: PssService[]
  office_code: string
}

/**
 * PSS Sync Service
 * Fetches the PSS service catalog and caches it locally.
 * Phase 1: triggered manually (POST /pss/sync) or by cron.
 * Phase 4: replace cron with Kafka consumer for PSS.catalog.updated event.
 *
 * Fallback strategy:
 * - PSS reachable → sync and update services table
 * - PSS unreachable → serve existing services table (log failure to pss_sync_log)
 */
@Injectable()
export class PssSyncService {
  private readonly logger = new Logger(PssSyncService.name)
  private readonly pssBaseUrl = process.env.PSS_BASE_URL ?? 'http://pss.pup.edu.ph/api'
  private readonly pssApiKey = process.env.PSS_API_KEY ?? ''

  constructor(
    private readonly http: HttpService,
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}

  /**
   * Cron: sync every 6 hours during business hours
   * Phase 4: replace with Kafka consumer
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async scheduledSync() {
    this.logger.log('[PSS] Scheduled catalog sync starting…')
    try {
      await this.syncAllOffices()
    } catch (err) {
      this.logger.error('[PSS] Scheduled sync failed', err)
    }
  }

  async syncForOffice(officeCode: string): Promise<{ synced: number; status: string }> {
    try {
      const res = await firstValueFrom(
        this.http.get<PssCatalogResponse>(
          `${this.pssBaseUrl}/services/catalog?officeCode=${officeCode}`,
          {
            headers: { 'x-api-key': this.pssApiKey },
            timeout: 10_000,
          },
        ),
      )

      const { services } = res.data
      const officeResult = await this.pool.query<{ id: string }>(
        `SELECT id FROM offices WHERE code = $1`,
        [officeCode],
      )
      const officeId = officeResult.rows[0]?.id
      if (!officeId) {
        this.logger.warn(`[PSS] Unknown office code: ${officeCode}`)
        return { synced: 0, status: 'unknown_office' }
      }

      // Use fn_pss_sync_services() from 07_contract_schema.sql
      const syncResult = await this.pool.query<{ fn_pss_sync_services: number }>(
        `SELECT fn_pss_sync_services($1, $2::jsonb) AS synced`,
        [officeId, JSON.stringify(services)],
      )

      // Also cache intake schemas
      for (const svc of services) {
        if (svc.intake_schema) {
          const svcRow = await this.pool.query<{ id: string }>(
            `SELECT id FROM services WHERE pss_service_code = $1 AND office_id = $2`,
            [svc.pss_service_code, officeId],
          )
          if (svcRow.rows[0]) {
            await this.pool.query(
              `INSERT INTO pss_intake_schema_cache (service_id, schema_json)
               VALUES ($1, $2::jsonb)
               ON CONFLICT (service_id) DO UPDATE SET schema_json = $2::jsonb, cached_at = NOW(), expires_at = NOW() + INTERVAL '24 hours'`,
              [svcRow.rows[0].id, JSON.stringify(svc.intake_schema)],
            )
          }
        }
      }

      const count = syncResult.rows[0]?.fn_pss_sync_services ?? services.length
      this.logger.log(`[PSS] Synced ${count} services for ${officeCode}`)
      return { synced: count, status: 'success' }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      this.logger.warn(`[PSS] Sync failed for ${officeCode}: ${message}`)
      await this.pool.query(
        `INSERT INTO pss_sync_log (sync_type, office_code, status, error_message)
         VALUES ('services', $1, 'failed', $2)`,
        [officeCode, message],
      )
      return { synced: 0, status: 'failed' }
    }
  }

  async syncAllOffices(): Promise<void> {
    const offices = await this.pool.query<{ code: string }>(
      `SELECT code FROM offices`,
    )
    for (const office of offices.rows) {
      await this.syncForOffice(office.code)
    }
  }

  async getStatus(): Promise<{
    last_sync: Date | null
    services_count: number
    pss_reachable: boolean
  }> {
    const [syncRow, countRow] = await Promise.all([
      this.pool.query<{ synced_at: Date }>(
        `SELECT synced_at FROM pss_sync_log WHERE sync_type = 'services' AND status = 'success'
         ORDER BY synced_at DESC LIMIT 1`,
      ),
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM services WHERE pss_service_code IS NOT NULL`,
      ),
    ])

    // Ping PSS health endpoint (non-blocking)
    let pss_reachable = false
    try {
      await firstValueFrom(
        this.http.get(`${this.pssBaseUrl}/health`, {
          headers: { 'x-api-key': this.pssApiKey },
          timeout: 3_000,
        }),
      )
      pss_reachable = true
    } catch {
      pss_reachable = false
    }

    return {
      last_sync: syncRow.rows[0]?.synced_at ?? null,
      services_count: parseInt(countRow.rows[0]?.count ?? '0', 10),
      pss_reachable,
    }
  }
}
