import { Injectable, Inject } from '@nestjs/common'
import { Pool } from 'pg'
import { PG_POOL, setRlsContext } from '../database/database.module'
import type { User } from '@ems/types'

@Injectable()
export class UsersRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findByOffice(officeId: string, headers: Record<string, string | undefined>): Promise<User[]> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      await setRlsContext(client, headers)

      const result = await client.query<User>(
        `SELECT u.id, u.name, u.email, u.role, u.office_id,
                o.code AS office_code, o.name AS office_name,
                u.is_active, u.synced_at AS created_at
         FROM users u
         LEFT JOIN offices o ON u.office_id = o.id
         WHERE u.office_id = $1 AND u.is_active = TRUE
         ORDER BY u.name`,
        [officeId],
      )
      await client.query('COMMIT')
      return result.rows
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  async findAll(headers: Record<string, string | undefined>): Promise<User[]> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      await setRlsContext(client, headers)

      const result = await client.query<User>(
        `SELECT u.id, u.name, u.email, u.role, u.office_id,
                o.code AS office_code, o.name AS office_name,
                u.is_active, u.synced_at AS created_at
         FROM users u
         LEFT JOIN offices o ON u.office_id = o.id
         WHERE u.is_active = TRUE
         ORDER BY o.name, u.name`,
      )
      await client.query('COMMIT')
      return result.rows
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query<User>(
      `SELECT id, name, email, role, office_id, office_code, office_name, is_active, created_at
       FROM users WHERE id = $1`,
      [id],
    )
    return result.rows[0] ?? null
  }

  async syncFromJwt(payload: {
    sub: string; name: string; email: string; role: string;
    office_id: string; office_code: string; office_name: string;
  }): Promise<void> {
    // Uses existing fn_sync_user() PostgreSQL function (from 02_functions.sql)
    await this.pool.query(
      `SELECT fn_sync_user($1, $2, $3, $4::user_role, $5, $6)`,
      [payload.sub, payload.name, payload.email, payload.role,
       payload.office_id, payload.office_code],
    )
  }
}
