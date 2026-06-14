import { Injectable } from '@nestjs/common'
import { AuditRepository } from './audit.repository'
import { ArmsDispatchService } from './arms-dispatch.service'
import type { TransactionStatusHistory, ActionType, TransactionStatus, DocumentaryStatus } from '@ems/types'

interface RecordAuditDto {
  transaction_id: string
  action_type: ActionType
  new_status: TransactionStatus
  old_status?: TransactionStatus | null
  documentary_new?: DocumentaryStatus
  documentary_old?: DocumentaryStatus | null
  old_value?: string | null
  new_value?: string | null
  changed_by: string
  changed_by_name: string
  remarks?: string | null
  // For ARMS payload enrichment
  service_name: string
  client_name: string
  office_id: string
}

@Injectable()
export class AuditService {
  constructor(
    private readonly repo: AuditRepository,
    private readonly armsDispatch: ArmsDispatchService,
  ) {}

  /**
   * record() — called by Transaction & PSS Service via POST /audit/record
   *
   * Audit Flow (Phase 1–3 HTTP):
   * 1. INSERT into transaction_status_history (local record)
   * 2. INSERT into arms_audit_dispatch_log (dispatch queue)
   * 3. Attempt immediate ARMS dispatch
   *    → success: log.status = 'sent'
   *    → failure: log.status stays 'pending', retry cron handles it
   */
  async record(dto: RecordAuditDto): Promise<{ historyId: string; dispatchId: string }> {
    // Step 1: Write to local history
    const historyId = await this.repo.record({
      transaction_id: dto.transaction_id,
      action_type: dto.action_type,
      new_status: dto.new_status,
      old_status: dto.old_status,
      documentary_new: dto.documentary_new,
      documentary_old: dto.documentary_old,
      old_value: dto.old_value,
      new_value: dto.new_value,
      changed_by: dto.changed_by,
      changed_by_name: dto.changed_by_name,
      remarks: dto.remarks,
    })

    // Step 2: Create ARMS dispatch log entry
    const armsPayload = {
      source: 'EMS',
      event: dto.action_type,
      transaction_id: dto.transaction_id,
      service_name: dto.service_name,
      client_name: dto.client_name,
      office_id: dto.office_id,
      actor_id: dto.changed_by,
      actor_name: dto.changed_by_name,
      old_status: dto.old_status ?? null,
      new_status: dto.new_status,
      old_value: dto.old_value ?? null,
      new_value: dto.new_value ?? null,
      remarks: dto.remarks ?? null,
      occurred_at: new Date().toISOString(),
    }

    const dispatchId = await this.repo.createDispatchLog({
      transaction_id: dto.transaction_id,
      action_type: dto.action_type,
      actor_id: dto.changed_by,
      payload: armsPayload,
    })

    // Step 3: Attempt immediate dispatch (non-blocking on failure)
    this.armsDispatch.dispatch(dispatchId, armsPayload, 0).catch(() => {
      // Retry cron will pick it up
    })

    return { historyId, dispatchId }
  }

  async getHistory(transactionId: string): Promise<TransactionStatusHistory[]> {
    return this.repo.findByTransaction(transactionId)
  }

  async getAuditLog(
    filters: {
      officeId?: string
      actionType?: string
      from?: string
      to?: string
      page?: number
      limit?: number
    },
    headers: Record<string, string | undefined>,
  ) {
    return this.repo.findAll(filters, headers)
  }

  async getDispatchStatus() {
    return this.repo.getDispatchHealth()
  }
}
