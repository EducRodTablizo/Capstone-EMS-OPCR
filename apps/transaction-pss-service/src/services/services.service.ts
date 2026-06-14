import { Injectable, Inject } from '@nestjs/common'
import { Pool } from 'pg'
import { PG_POOL } from '../database/database.module'
import type { Service } from '@ems/types'

@Injectable()
export class ServicesService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getServices(officeId?: string): Promise<Service[]> {
    const query = officeId
      ? `SELECT id, name, category, client_type, office_id, office_code,
                sla_target_seconds, sla_display, is_active, is_na,
                pss_service_code, last_synced_from_pss
         FROM services
         WHERE office_id = $1 AND is_active = TRUE AND is_na = FALSE
         ORDER BY category, name`
      : `SELECT id, name, category, client_type, office_id, office_code,
                sla_target_seconds, sla_display, is_active, is_na,
                pss_service_code, last_synced_from_pss
         FROM services
         WHERE is_active = TRUE AND is_na = FALSE
         ORDER BY category, name`

    const result = await this.pool.query<Service>(
      query,
      officeId ? [officeId] : undefined,
    )
    return result.rows
  }

  async getServiceById(id: string): Promise<Service | null> {
    const result = await this.pool.query<Service>(
      `SELECT * FROM services WHERE id = $1`,
      [id],
    )
    return result.rows[0] ?? null
  }
}
