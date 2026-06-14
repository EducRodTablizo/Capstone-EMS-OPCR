import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { Cron } from '@nestjs/schedule'
import { firstValueFrom } from 'rxjs'
import { AuditRepository } from './audit.repository'

/**
 * ARMS Dispatch Service
 * Dispatches audit events to the ARMS Audit Ingest endpoint.
 * Implements the final leg of the audit flow:
 *   Audit Log Service → POST {ARMS_URL}/api/audit/ingest → ARMS
 *
 * Includes retry logic with exponential backoff.
 * On success: updates arms_audit_dispatch_log.status = 'sent'
 * On failure: marks 'failed', retry cron picks up in 60s
 *
 * Max retries: 3 (configurable via ARMS_DISPATCH_MAX_RETRIES)
 */
@Injectable()
export class ArmsDispatchService {
  private readonly logger = new Logger(ArmsDispatchService.name)
  private readonly armsBaseUrl = process.env.ARMS_BASE_URL ?? 'http://arms.pup.edu.ph/api'
  private readonly serviceToken = process.env.ARMS_SERVICE_TOKEN ?? ''
  private readonly maxRetries = parseInt(process.env.ARMS_DISPATCH_MAX_RETRIES ?? '3', 10)

  constructor(
    private readonly http: HttpService,
    private readonly repo: AuditRepository,
  ) {}

  async dispatch(
    logId: string,
    payload: Record<string, unknown>,
    attempts: number,
  ): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post(
          `${this.armsBaseUrl}/audit/ingest`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${this.serviceToken}`,
              'Content-Type': 'application/json',
            },
            timeout: 5_000,
          },
        ),
      )

      await this.repo.updateDispatchLog(logId, {
        status: 'sent',
        attempts: attempts + 1,
      })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const nextAttempts = attempts + 1
      const newStatus = nextAttempts >= this.maxRetries ? 'failed' : 'pending'

      await this.repo.updateDispatchLog(logId, {
        status: newStatus,
        error: message,
        attempts: nextAttempts,
      })

      if (newStatus === 'failed') {
        this.logger.error(`[ARMS] Max retries reached for log ${logId}: ${message}`)
      } else {
        this.logger.warn(`[ARMS] Dispatch attempt ${nextAttempts} failed for log ${logId}: ${message}`)
      }
      return false
    }
  }

  /**
   * Retry cron — runs every 60 seconds.
   * Picks up pending/failed dispatch logs under retry limit.
   */
  @Cron('*/60 * * * * *')
  async retryPendingDispatches() {
    const pending = await this.repo.getPendingDispatches()
    if (pending.length === 0) return

    this.logger.log(`[ARMS Retry] Processing ${pending.length} pending dispatches`)
    for (const entry of pending) {
      await this.dispatch(entry.id, entry.payload as Record<string, unknown>, entry.attempts)
    }
  }
}
