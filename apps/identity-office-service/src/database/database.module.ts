import { Module, Global } from '@nestjs/common'
import { Pool } from 'pg'

/**
 * Shared PostgreSQL pool for this service.
 * All repositories inject the Pool token.
 *
 * RLS context is set per-request via setRlsContext() helper.
 * The existing PostgreSQL RLS policies + triggers remain in force.
 */
export const PG_POOL = 'PG_POOL'

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () => {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 10,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 3_000,
        })
        pool.on('error', (err) => {
          console.error('[DB Pool] unexpected error on idle client', err)
        })
        return pool
      },
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}

/**
 * setRlsContext — sets PostgreSQL session variables required by RLS policies.
 * Must be called inside a transaction before any data-modifying query.
 *
 * Reads x-user-* headers injected by the API Gateway.
 */
export async function setRlsContext(
  client: { query: (sql: string, params?: unknown[]) => Promise<unknown> },
  headers: Record<string, string | string[] | undefined>,
) {
  const userId = String(headers['x-user-id'] ?? '')
  const officeId = String(headers['x-office-id'] ?? '')
  const role = String(headers['x-user-role'] ?? '')

  await client.query(`SET LOCAL ems.current_office_id = $1`, [officeId])
  await client.query(`SET LOCAL ems.current_role = $1`, [role])
  await client.query(`SET LOCAL ems.acting_user_id = $1`, [userId])
}

useFactory: () => {
  console.log('DATABASE_URL =', process.env.DATABASE_URL)

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 3_000,
  })

  return pool
}