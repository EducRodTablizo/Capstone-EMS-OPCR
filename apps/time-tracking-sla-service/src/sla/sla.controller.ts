import { Controller, Post, Body, Logger } from '@nestjs/common'
import { SlaService } from './sla.service'

@Controller('sla')
export class SlaController {
  private readonly logger = new Logger(SlaController.name)
  constructor(private readonly svc: SlaService) {}

  /**
   * POST /sla/result
   * PSS webhook callback — delivers the authoritative SLA computation result.
   * Validated by API Gateway (x-pss-callback-secret header checked there).
   */
  @Post('result')
  handlePssCallback(@Body() body: {
    transaction_id: string
    sla_status: string
    is_breached: boolean
    computed_at: string
    pss_response_json?: Record<string, unknown>
  }) {
    this.logger.log(`[SLA] PSS callback for ${body.transaction_id}: ${body.sla_status}`)
    return this.svc.handlePssCallback(body)
  }

  /**
   * POST /sla/compute-local
   * Internal: called when a transaction is completed, to compute SLA locally.
   * (In Phase 4: this will be triggered by a Kafka consumer instead)
   */
  @Post('compute-local')
  computeLocal(@Body() body: {
    transaction_id: string
    time_in: string
    time_out: string
    sla_target_seconds: number
  }) {
    return this.svc.computeLocal(body)
  }
}
