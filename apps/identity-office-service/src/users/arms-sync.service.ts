import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'

/**
 * Arms Sync Service
 * Optional: enriches user profile from ARMS user directory.
 * Called when JWT claims don't contain enough profile data.
 * Falls back gracefully if ARMS is unreachable.
 */
@Injectable()
export class ArmsSyncService {
  private readonly baseUrl = process.env.ARMS_BASE_URL ?? 'http://arms.pup.edu.ph/api'
  private readonly token = process.env.ARMS_SERVICE_TOKEN ?? ''

  constructor(private readonly http: HttpService) {}

  async getUserProfile(userId: string): Promise<Record<string, unknown> | null> {
    try {
      const res = await firstValueFrom(
        this.http.get(`${this.baseUrl}/users/${userId}`, {
          headers: { Authorization: `Bearer ${this.token}` },
          timeout: 3000,
        }),
      )
      return res.data as Record<string, unknown>
    } catch {
      // ARMS unavailable — not fatal, JWT claims are sufficient for EMS operations
      return null
    }
  }
}
