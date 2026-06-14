import { Injectable, Inject } from '@nestjs/common'
import { Pool } from 'pg'
import { PG_POOL } from '../database/database.module'
import type { Office } from '@ems/types'

@Injectable()
export class OfficesService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getOffices(): Promise<Office[]> {
    const result = await this.pool.query<Office>(
      `SELECT id, name, code FROM offices ORDER BY name`,
    )
    return result.rows
  }
}
