import {
  Controller, Post, Get, Body, Param, Query, Headers,
} from '@nestjs/common'
import { AuditService } from './audit.service'

@Controller()
export class AuditController {
  constructor(private readonly svc: AuditService) {}

  /**
   * POST /audit/record
   * Internal endpoint — called by transaction-pss-service only.
   * Not exposed through API Gateway (internal service bus).
   */
  @Post('audit/record')
  record(@Body() body: {
    transaction_id: string
    action_type: string
    new_status: string
    old_status?: string | null
    documentary_new?: string
    documentary_old?: string | null
    old_value?: string | null
    new_value?: string | null
    changed_by: string
    changed_by_name: string
    remarks?: string | null
    service_name: string
    client_name: string
    office_id: string
  }) {
    return this.svc.record(body as Parameters<AuditService['record']>[0])
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
    @Query('officeId') officeId: string | undefined,
    @Query('actionType') actionType: string | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    return this.svc.getAuditLog({
      officeId,
      actionType,
      from,
      to,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    }, headers)
  }

  /** GET /arms/dispatch-status */
  @Get('arms/dispatch-status')
  getDispatchStatus() {
    return this.svc.getDispatchStatus()
  }
}
