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
          max: 10,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 3_000,
        }),
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
