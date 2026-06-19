import {
  Controller, Post, Get, Body, Param, Query, Headers,
} from '@nestjs/common'
import { AuditService } from './audit.service'
import { RecordAuditDto, AuditLogFilterDto } from '@ems/dto'

@Controller()
export class AuditController {
  constructor(private readonly svc: AuditService) {}

  /**
   * POST /audit/record
   * Internal endpoint — called by transaction-pss-service only.
   * Not exposed through API Gateway (internal service bus).
   */
  @Post('audit/record')
  record(@Body() body: RecordAuditDto) {
    return this.svc.record(body)
  }

  /**
   * GET /history/:transactionId
   * Proxied through gateway: GET /api/transactions/:id/history
   */
  @Get('history/:transactionId')
  getHistory(@Param('transactionId') id: string) {
    return this.svc.getHistory(id)
  }

  /**
   * GET /audit-log
   * Proxied through gateway: GET /api/audit-log
   */
  @Get('audit-log')
  getAuditLog(
    @Query() query: AuditLogFilterDto,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    return this.svc.getAuditLog(query, headers)
  }

  /** GET /arms/dispatch-status */
  @Get('arms/dispatch-status')
  getDispatchStatus() {
    return this.svc.getDispatchStatus()
  }
}
