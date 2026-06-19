import { Injectable, Inject } from '@nestjs/common'
import { Pool } from 'pg'
import { PG_POOL } from '../database/database.module'
import type { Service } from '@ems/types'

@Injectable()
export class ServicesService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getServices(officeId?: string): Promise<Service[]> {
    const query = officeId
      ? `SELECT s.id, s.name, s.category, s.client_type, s.office_id, o.code AS office_code,
                s.sla_target_seconds, s.sla_display, s.is_active, s.is_na,
                s.pss_service_code, s.last_synced_from_pss
         FROM services s
         JOIN offices o ON s.office_id = o.id
         WHERE s.office_id = $1 AND s.is_active = TRUE AND s.is_na = FALSE
         ORDER BY s.category, s.name`
      : `SELECT s.id, s.name, s.category, s.client_type, s.office_id, o.code AS office_code,
                s.sla_target_seconds, s.sla_display, s.is_active, s.is_na,
                s.pss_service_code, s.last_synced_from_pss
         FROM services s
         JOIN offices o ON s.office_id = o.id
         WHERE s.is_active = TRUE AND s.is_na = FALSE
         ORDER BY s.category, s.name`

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
