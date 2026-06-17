import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/**
 * Hybrid JWT Auth Guard
 *
 * Dev mode  (DEV_AUTH_MODE=true):
 *   Skips JWT validation and injects a configurable dev user from env vars.
 *   The dev user uses real PostgreSQL UUIDs from the seed data so that
 *   office-scoped queries work correctly.
 *
 * Production mode (DEV_AUTH_MODE unset or false):
 *   Delegates to Passport 'jwt' strategy — validates ARMS-issued JWTs.
 *   Existing ARMS integration is fully preserved.
 *
 * Configure dev user in api-gateway/.env:
 *   DEV_AUTH_MODE=true
 *   DEV_USER_ID=11000000-0000-0000-0000-000000000001
 *   DEV_USER_NAME=Maria Santos
 *   DEV_USER_EMAIL=msantos@pup.edu.ph
 *   DEV_USER_ROLE=subsystem_admin
 *   DEV_OFFICE_ID=00000000-0000-0000-0000-000000000001
 *   DEV_OFFICE_CODE=ADMIN_OFFICE
 *   DEV_OFFICE_NAME=Administrative Office
 */

const isDevMode = () =>
  process.env.DEV_AUTH_MODE === 'true' || process.env.NODE_ENV === 'development'

/** The injected dev user — must match UUIDs in database/04_seed.sql */
const getDevUser = () => ({
  id:          process.env.DEV_USER_ID      ?? '11000000-0000-0000-0000-000000000001',
  name:        process.env.DEV_USER_NAME    ?? 'Maria Santos',
  email:       process.env.DEV_USER_EMAIL   ?? 'msantos@pup.edu.ph',
  role:        process.env.DEV_USER_ROLE    ?? 'subsystem_admin',
  office_id:   process.env.DEV_OFFICE_ID   ?? '00000000-0000-0000-0000-000000000001',
  office_code: process.env.DEV_OFFICE_CODE ?? 'ADMIN_OFFICE',
  office_name: process.env.DEV_OFFICE_NAME ?? 'Administrative Office',
})

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwtGuard = new (AuthGuard('jwt'))()

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    if (isDevMode()) {
      // Dev mode: bypass JWT, inject dev user
      const req = context.switchToHttp().getRequest()
      req.user = getDevUser()
      return true
    }

    // Production: full JWT validation via Passport jwt strategy
    return this.jwtGuard.canActivate(context) as boolean | Promise<boolean>
  }
}
