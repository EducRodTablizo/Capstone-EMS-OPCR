import { Module, Global } from '@nestjs/common'
import { Pool } from 'pg'

export const PG_POOL = 'PG_POOL'

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () =>
        new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 15,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 3_000,
        }),
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}

export async function setRlsContext(
  client: { query: (sql: string, params?: unknown[]) => Promise<unknown> },
  headers: Record<string, string | string[] | undefined>,
) {
  const userId = String(headers['x-user-id'] ?? '')
  const officeId = String(headers['x-office-id'] ?? '')
  const role = String(headers['x-user-role'] ?? '')

  await client.query(
    `SELECT set_config('ems.current_office_id', $1, true)`,
    [officeId],
  )

  await client.query(
    `SELECT set_config('ems.current_role', $1, true)`,
    [role],
  )

  await client.query(
    `SELECT set_config('ems.acting_user_id', $1, true)`,
    [userId],
  )
}
/*
export async function setRlsContext(
  client: { query: (sql: string, params?: unknown[]) => Promise<unknown> },
  headers: Record<string, string | string[] | undefined>,
) {
  return
} /*{
  await client.query(`SET LOCAL ems.current_office_id = $1`, [String(headers['x-office-id'] ?? '')])
  await client.query(`SET LOCAL ems.current_role = $1`, [String(headers['x-user-role'] ?? '')])
  await client.query(`SET LOCAL ems.acting_user_id = $1`, [String(headers['x-user-id'] ?? '')])
}*/ 