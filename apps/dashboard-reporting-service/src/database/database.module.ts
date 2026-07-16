import { Module, Global } from '@nestjs/common'
import { Pool } from 'pg'

export const PG_POOL = 'PG_POOL'

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () => {
        const pool = new Pool({
          connectionString: process.env.DASHBOARD_DATABASE_URL || process.env.DATABASE_URL,
          max: 10,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 5_000,
        })
        pool.on('error', (err) => {
          console.error('[DB Pool] Idle client error (dashboard):', err.message)
        })
        return pool
      },
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
