import { Injectable, Inject } from '@nestjs/common'
import { Pool, PoolClient } from 'pg'
import { PG_POOL, setRlsContext } from '../database/database.module'
import type { Transaction } from '@ems/types'

// Row shape from DB maps directly to Transaction interface
type TransactionRow = Transaction

@Injectable()
export class TransactionsRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findAll(officeId: string | undefined, headers: Record<string, string | undefined>): Promise<Transaction[]> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      await setRlsContext(client, headers)
      const query = officeId
        ? `SELECT t.*, s.name AS service_name, s.category AS service_category,
                  o.name AS office_name,
                  creator.name AS created_by_name,
                  assignee.name AS assigned_to_name
           FROM transactions t
           JOIN services s ON t.service_id = s.id
           JOIN offices o ON t.office_id = o.id
           JOIN users creator ON t.created_by = creator.id
           LEFT JOIN users assignee ON t.assigned_to = assignee.id
           WHERE t.office_id = $1
           ORDER BY t.created_at DESC`
        : `SELECT t.*, s.name AS service_name, s.category AS service_category,
                  o.name AS office_name,
                  creator.name AS created_by_name,
                  assignee.name AS assigned_to_name
           FROM transactions t
           JOIN services s ON t.service_id = s.id
           JOIN offices o ON t.office_id = o.id
           JOIN users creator ON t.created_by = creator.id
           LEFT JOIN users assignee ON t.assigned_to = assignee.id
           ORDER BY t.created_at DESC`
      const result = await client.query<TransactionRow>(
        query, officeId ? [officeId] : undefined,
      )
      await client.query('COMMIT')
      return result.rows
    } catch (err) {
      await client.query('ROLLBACK'); throw err
    } finally { client.release() }
  }

  async findById(id: string, headers: Record<string, string | undefined>): Promise<Transaction | null> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      await setRlsContext(client, headers)
      const result = await client.query<TransactionRow>(
        `SELECT t.*, s.name AS service_name, s.category AS service_category,
                o.name AS office_name,
                creator.name AS created_by_name,
                assignee.name AS assigned_to_name
         FROM transactions t
         JOIN services s ON t.service_id = s.id
         JOIN offices o ON t.office_id = o.id
         JOIN users creator ON t.created_by = creator.id
         LEFT JOIN users assignee ON t.assigned_to = assignee.id
         WHERE t.id = $1`,
        [id],
      )
      await client.query('COMMIT')
      return result.rows[0] ?? null
    } catch (err) {
      await client.query('ROLLBACK'); throw err
    } finally { client.release() }
  }

  async create(
    dto: {
      service_id: string; assigned_to?: string; client_name: string;
      client_type?: string; student_number?: string; course?: string;
      year_level?: string; contact_number?: string; organization?: string;
      remarks?: string; documentation_status?: string;
      service_specific_data?: Record<string, unknown>;
      intake_data?: Record<string, string>;
    },
    headers: Record<string, string | undefined>,
  ): Promise<Transaction> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      await setRlsContext(client, headers)

      const createdBy = headers['x-user-id'] ?? ''
      const officeId = headers['x-office-id'] ?? ''

      const result = await client.query<TransactionRow>(
        `INSERT INTO transactions (
          service_id, assigned_to, created_by, office_id,
          client_name, client_type, student_number, course, year_level,
          contact_number, organization, remarks, documentary_status,
          service_specific_data, intake_data,
          status, sla_status, time_in
        )
        SELECT
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          COALESCE($13::documentary_status, 'complete'),
          $14::jsonb, $15::jsonb,
          'pending', 'pending_computation', NOW()
        RETURNING *`,
        [
          dto.service_id, dto.assigned_to ?? null, createdBy, officeId,
          dto.client_name, dto.client_type ?? null, dto.student_number ?? null,
          dto.course ?? null, dto.year_level ?? null, dto.contact_number ?? null,
          dto.organization ?? null, dto.remarks ?? null,
          dto.documentation_status ?? null,
          JSON.stringify(dto.service_specific_data ?? {}),
          JSON.stringify(dto.intake_data ?? {}),
        ],
      )

      await client.query('COMMIT')

      // Reload with joins
      return (await this.findById(result.rows[0].id, headers))!
    } catch (err) {
      await client.query('ROLLBACK'); throw err
    } finally { client.release() }
  }

  async assign(
    id: string,
    assignedTo: string,
    headers: Record<string, string | undefined>,
  ): Promise<Transaction> {
    await this.withRls(headers, async (c) => {
      await c.query(
        `UPDATE transactions SET assigned_to = $1, updated_at = NOW() WHERE id = $2`,
        [assignedTo, id],
      )
    })
    return (await this.findById(id, headers))!
  }

  async updateStatus(
    id: string,
    status: string,
    remarks: string | undefined,
    headers: Record<string, string | undefined>,
  ): Promise<Transaction> {
    await this.withRls(headers, async (c) => {
      await c.query(
        `UPDATE transactions
         SET status = $1::transaction_status,
             time_out = CASE WHEN $1 = 'completed' THEN NOW() ELSE time_out END,
             is_locked = CASE WHEN $1 = 'completed' THEN TRUE ELSE is_locked END,
             updated_at = NOW()
         WHERE id = $2 AND status != 'completed'`,
        [status, id],
      )
    })
    return (await this.findById(id, headers))!
  }

  async updateDocumentaryStatus(
    id: string,
    documentaryStatus: string,
    headers: Record<string, string | undefined>,
  ): Promise<Transaction> {
    await this.withRls(headers, async (c) => {
      await c.query(
        `UPDATE transactions
         SET documentary_status = $1::documentary_status, updated_at = NOW()
         WHERE id = $2 AND status != 'completed'`,
        [documentaryStatus, id],
      )
    })
    return (await this.findById(id, headers))!
  }

  private async withRls(
    headers: Record<string, string | undefined>,
    fn: (client: PoolClient) => Promise<void>,
  ): Promise<void> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      await setRlsContext(client, headers)
      await fn(client)
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK'); throw err
    } finally { client.release() }
  }
}
