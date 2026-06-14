import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { Cron } from '@nestjs/schedule'
import { Inject } from '@nestjs/common'
import { Pool } from 'pg'
import { firstValueFrom } from 'rxjs'
import { PG_POOL } from '../database/database.module'

/**
 * PSS Compute Service
 * Offloads SLA computation to PSS for authoritative results.
 *
 * Phase 1-3:
 *   - EMS computes locally (CalendarService)
 *   - PSS compute requests are queued in pss_computation_queue
 *   - Cron sends queued requests to PSS
 *   - PSS calls back to POST /api/sla/result (api-gateway → time-sla-service)
 *
 * Phase 4:
 *   - PSS publishes SLA results on Kafka topic `pss.sla.computed`
 *   - Cron replaced by Kafka consumer
 */
@Injectable()
export class PssComputeService {
  private readonly logger = new Logger(PssComputeService.name)
  private readonly pssBaseUrl = process.env.PSS_BASE_URL ?? 'http://pss.pup.edu.ph/api'
  private readonly pssApiKey = process.env.PSS_API_KEY ?? ''
  private readonly callbackUrl = process.env.EMS_GATEWAY_URL
    ? `${process.env.EMS_GATEWAY_URL}/api/sla/result`
    : 'http://api-gateway:3001/api/sla/result'

  constructor(
    private readonly http: HttpService,
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}

  /**
   * Cron: flush pss_computation_queue every 5 minutes.
   * Sends pending items to PSS /api/sla/compute.
   */
  @Cron('*/5 * * * *')
  async flushComputeQueue() {
    const pending = await this.pool.query<{
      id: string; transaction_id: string; service_id: string;
      office_code: string; time_in: string; time_out: string;
      duration_seconds: number; sla_target_seconds: number;
    }>(
      `SELECT q.id, q.transaction_id, t.service_id, o.code AS office_code,
              t.time_in, t.time_out,
              EXTRACT(EPOCH FROM (t.time_out - t.time_in))::INTEGER AS duration_seconds,
              s.sla_target_seconds
       FROM pss_computation_queue q
       JOIN transactions t ON q.transaction_id = t.id
       JOIN services s ON t.service_id = s.id
       JOIN offices o ON t.office_id = o.id
       WHERE q.status = 'pending' AND t.time_out IS NOT NULL
       LIMIT 20`,
    )

    for (const item of pending.rows) {
      try {
        await firstValueFrom(
          this.http.post(
            `${this.pssBaseUrl}/sla/compute`,
            {
              transaction_id: item.transaction_id,
              service_id: item.service_id,
              office_code: item.office_code,
              time_in: item.time_in,
              time_out: item.time_out,
              duration_seconds: item.duration_seconds,
              sla_target_seconds: item.sla_target_seconds,
              callback_url: this.callbackUrl,
            },
            {
              headers: { 'x-api-key': this.pssApiKey },
              timeout: 10_000,
            },
          ),
        )

        await this.pool.query(
          `UPDATE pss_computation_queue SET status = 'sent' WHERE id = $1`,
          [item.id],
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        this.logger.warn(`[PSS Compute] Failed to send ${item.transaction_id}: ${message}`)
      }
    }
  }
}
