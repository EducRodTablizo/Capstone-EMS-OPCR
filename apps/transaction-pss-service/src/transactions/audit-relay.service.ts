import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import type { ActionType, Transaction, TransactionStatus, DocumentaryStatus } from '@ems/types'

/**
 * Audit Relay Service
 * Transaction & PSS Service → Audit Log Service (internal HTTP call).
 *
 * Implements the audit flow:
 *   Transaction Service → POST /audit/record → Audit Log Service
 *   Audit Log Service → INSERT locally + dispatch to ARMS
 *
 * Fire-and-forget by default. Non-fatal: transaction response is not delayed
 * if audit relay fails (logged for manual retry).
 */
@Injectable()
export class AuditRelayService {
  private readonly logger = new Logger(AuditRelayService.name)
  private readonly auditSvcUrl = process.env.AUDIT_SVC_URL ?? 'http://localhost:3006'

  constructor(private readonly http: HttpService) {}

  /**
   * Fire-and-forget audit record.
   * Called after every transaction mutation.
   */
  relay(
    txn: Transaction,
    actionType: ActionType,
    actor: { id: string; name: string },
    opts: {
      oldStatus?: TransactionStatus | null
      oldDocumentary?: DocumentaryStatus | null
      oldValue?: string | null
      newValue?: string | null
      remarks?: string | null
    } = {},
  ): void {
    const payload = {
      transaction_id: txn.id,
      action_type: actionType,
      new_status: txn.status,
      old_status: opts.oldStatus ?? null,
      documentary_new: txn.documentary_status,
      documentary_old: opts.oldDocumentary ?? null,
      old_value: opts.oldValue ?? null,
      new_value: opts.newValue ?? null,
      changed_by: actor.id,
      changed_by_name: actor.name,
      remarks: opts.remarks ?? null,
      service_name: txn.service_name,
      client_name: txn.client_name,
      office_id: txn.office_id,
    }

    firstValueFrom(
      this.http.post(`${this.auditSvcUrl}/audit/record`, payload, {
        timeout: 5_000,
      }),
    ).catch((err) => {
      // Non-fatal: log the failure but don't block the transaction response
      this.logger.warn(`[Audit Relay] Failed to dispatch ${actionType} for txn ${txn.id}: ${err.message}`)
    })
  }
}
