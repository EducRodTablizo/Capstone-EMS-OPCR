import { Injectable, Inject, Logger } from '@nestjs/common'
import { Pool } from 'pg'
import { PG_POOL } from '../database/database.module'
import { CalendarService } from './calendar.service'
import { PssComputeService } from './pss-compute.service'
import { LocalSlaComputeDto, PssCallbackDto } from '@ems/dto'

export interface SlaResult {
  transaction_id: string
  sla_status: 'compliant' | 'non_compliant' | 'pending_computation'
  is_sla_breached: boolean
  processing_time_seconds: number
}

@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name)

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly calendar: CalendarService,
    private readonly pssCompute: PssComputeService,
  ) {}

  /**
   * Compute SLA for a completed transaction.
   * Phase 1-3: Local computation using pss_calendar_cache + fn_classify_sla().
   * Phase 4: Offload to PSS via POST /api/sla/compute (async, PSS calls back).
   */
  async computeLocal(dto: LocalSlaComputeDto): Promise<SlaResult> {
    const timeIn = new Date(dto.time_in)
    const timeOut = new Date(dto.time_out)

    // Compute working seconds (excludes holidays + non-working hours)
    const workingSeconds = await this.calendar.computeWorkingSeconds(timeIn, timeOut)

    const isBreached = workingSeconds > dto.sla_target_seconds
    const slaStatus = isBreached ? 'non_compliant' : 'compliant'

    // Update transaction with computed values (uses existing fn_classify_sla trigger logic)
    await this.pool.query(
      `UPDATE transactions
       SET processing_time_seconds = $1,
           sla_status = $2::sla_status,
           is_sla_breached = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [workingSeconds, slaStatus, isBreached, dto.transaction_id],
    )

    // Insert into pss_computation_queue for PSS offload (Phase 4: PSS confirms/overrides)
    await this.pool.query(
      `INSERT INTO pss_computation_queue (transaction_id, status, local_result)
       VALUES ($1, 'pending', $2::jsonb)
       ON CONFLICT (transaction_id) DO NOTHING`,
      [dto.transaction_id, JSON.stringify({ sla_status: slaStatus, working_seconds: workingSeconds })],
    )

    return {
      transaction_id: dto.transaction_id,
      sla_status: slaStatus,
      is_sla_breached: isBreached,
      processing_time_seconds: workingSeconds,
    }
  }

  /**
   * PSS callback handler — PSS sends authoritative SLA result.
   * Overrides local computation with PSS-computed values.
   */
  async handlePssCallback(dto: PssCallbackDto & { pss_response_json?: Record<string, unknown> }): Promise<void> {
    await this.pool.query(
      `UPDATE transactions
       SET sla_status = $1::sla_status,
           is_sla_breached = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [dto.sla_status, dto.is_breached, dto.transaction_id],
    )

    await this.pool.query(
      `UPDATE pss_computation_queue
       SET status = 'completed',
           pss_response_json = $1::jsonb,
           arms_dispatched_at = NOW()
       WHERE transaction_id = $2`,
      [JSON.stringify(dto.pss_response_json ?? {}), dto.transaction_id],
    )

    this.logger.log(`[SLA] PSS result applied for ${dto.transaction_id}: ${dto.sla_status}`)
  }
}
