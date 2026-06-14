import { Injectable } from '@nestjs/common'
import { UsersRepository } from './users.repository'
import { ArmsSyncService } from './arms-sync.service'
import type { User } from '@ems/types'

@Injectable()
export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly armsSync: ArmsSyncService,
  ) {}

  async getUsers(officeId: string | undefined, headers: Record<string, string | undefined>): Promise<User[]> {
    // Sync the requesting user from JWT on every authenticated request
    const userId = headers['x-user-id']
    if (userId) {
      await this.syncCallerFromJwt(headers).catch(() => {
        // Non-blocking: if sync fails, request still proceeds
      })
    }

    return officeId
      ? this.repo.findByOffice(officeId, headers)
      : this.repo.findAll(headers)
  }

  async getUserById(id: string): Promise<User | null> {
    return this.repo.findById(id)
  }

  /**
   * Sync caller from JWT headers → fn_sync_user() upserts into EMS users table.
   * Called on every authenticated request to keep EMS user data fresh.
   */
  private async syncCallerFromJwt(headers: Record<string, string | undefined>): Promise<void> {
    const payload = {
      sub: headers['x-user-id'] ?? '',
      name: headers['x-user-name'] ?? '',
      email: headers['x-user-email'] ?? '',
      role: headers['x-user-role'] ?? '',
      office_id: headers['x-office-id'] ?? '',
      office_code: headers['x-office-code'] ?? '',
      office_name: headers['x-office-name'] ?? '',
    }
    if (payload.sub && payload.email) {
      await this.repo.syncFromJwt(payload)
    }
  }
}
