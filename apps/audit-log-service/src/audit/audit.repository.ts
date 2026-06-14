import { Injectable, Inject } from '@nestjs/common'
import { Pool } from 'pg'
import { PG_POOL, setRlsContext } from '../database/database.module'
import type { TransactionStatusHistory, ActionType, TransactionStatus, DocumentaryStatus } from '@ems/types'

type AuditRow = TransactionStatusHistory

@Injectable()
export class AuditRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async record(dto: {
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
  }): Promise<string> {
    const result = await this.pool.query<{ id: string }>(
      `INSERT INTO transaction_status_history (
        transaction_id, action_type, old_status, new_status,
        documentary_old, documentary_new, old_value, new_value,
        changed_by, changed_by_name, remarks
      ) VALUES (
        $1, $2::action_type,
        $3::transaction_status, $4::transaction_status,
        $5::documentary_status, $6::documentary_status,
        $7, $8, $9, $10, $11
      ) RETURNING id`,
      [
        dto.transaction_id, dto.action_type,
        dto.old_status ?? null, dto.new_status,
        dto.documentary_old ?? null, dto.documentary_new ?? null,
        dto.old_value ?? null, dto.new_value ?? null,
        dto.changed_by, dto.changed_by_name, dto.remarks ?? null,
      ],
    )
    return result.rows[0].id
  }

  async findByTransaction(transactionId: string): Promise<TransactionStatusHistory[]> {
    const result = await this.pool.query<AuditRow>(
      `SELECT h.*, u.name AS changed_by_name
       FROM transaction_status_history h
       LEFT JOIN users u ON h.changed_by = u.id::text
       WHERE h.transaction_id = $1
       ORDER BY h.changed_at ASC`,
      [transactionId],
    )
    return result.rows
  }

  async findAll(
    filters: {
      officeId?: string
      actionType?: string
      from?: string
      to?: string
      page?: number
      limit?: number
    },
    headers: Record<string, string | undefined>,
  ): Promise<{ data: TransactionStatusHistory[]; total: number }> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      await setRlsContext(client, headers)

      const conditions: string[] = []
      const params: unknown[] = []
      let idx = 1

      if (filters.officeId) {
        conditions.push(`t.office_id = $${idx++}`)
        params.push(filters.officeId)
      }
      if (filters.actionType && filters.actionType !== 'ALL') {
        conditions.push(`h.action_type = $${idx++}`)
        params.push(filters.actionType)
      }
      if (filters.from) {
        conditions.push(`h.changed_at >= $${idx++}`)
        params.push(filters.from)
      }
      if (filters.to) {
        conditions.push(`h.changed_at <= $${idx++}`)
        params.push(filters.to)
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      const limit = filters.limit ?? 50
      const offset = ((filters.page ?? 1) - 1) * limit

      const countResult = await client.query<{ total: string }>(
        `SELECT COUNT(*) AS total
         FROM transaction_status_history h
         JOIN transactions t ON h.transaction_id = t.id
         ${where}`,
        params,
      )
      const total = parseInt(countResult.rows[0]?.total ?? '0', 10)

      params.push(limit, offset)
      const dataResult = await client.query<AuditRow>(
        `SELECT h.*, t.office_id, t.office_name, t.client_name, t.service_name
         FROM transaction_status_history h
         JOIN transactions t ON h.transaction_id = t.id
         ${where}
         ORDER BY h.changed_at DESC
         LIMIT $${idx++} OFFSET $${idx}`,
        params,
      )

      await client.query('COMMIT')
      return { data: dataResult.rows, total }
    } catch (err) {
      await client.query('ROLLBACK'); throw err
    } finally { client.release() }
  }

  async createDispatchLog(entry: {
    transaction_id: string
    action_type: ActionType
    actor_id: string
    payload: Record<string, unknown>
  }): Promise<string> {
    const result = await this.pool.query<{ id: string }>(
      `INSERT INTO arms_audit_dispatch_log (transaction_id, action_type, actor_id, payload)
       VALUES ($1, $2::action_type, $3, $4::jsonb) RETURNING id`,
      [entry.transaction_id, entry.action_type, entry.actor_id, JSON.stringify(entry.payload)],
    )
    return result.rows[0].id
  }

  async updateDispatchLog(
    id: string,
    update: { status: string; error?: string; attempts: number },
  ): Promise<void> {
    await this.pool.query(
      `UPDATE arms_audit_dispatch_log
       SET status = $1, attempts = $2,
           last_attempt_at = NOW(),
           sent_at = CASE WHEN $1 = 'sent' THEN NOW() ELSE sent_at END,
           error_message = $3
       WHERE id = $4`,
      [update.status, update.attempts, update.error ?? null, id],
    )
  }

  async getPendingDispatches(): Promise<Array<{
    id: string; transaction_id: string; action_type: string;
    actor_id: string; payload: Record<string, unknown>; attempts: number;
  }>> {
    const result = await this.pool.query(
      `SELECT id, transaction_id, action_type, actor_id, payload, attempts
       FROM arms_audit_dispatch_log
       WHERE status IN ('pending', 'failed') AND attempts < 3
         AND (last_attempt_at IS NULL OR last_attempt_at < NOW() - INTERVAL '60 seconds')
       ORDER BY created_at
       LIMIT 50`,
    )
    return result.rows
  }

  async getDispatchHealth(): Promise<Array<{
    status: string; count: string; oldest_pending: Date | null
  }>> {
    const result = await this.pool.query(
      `SELECT * FROM fn_get_arms_dispatch_health()`,
    )
    return result.rows
  }
}
