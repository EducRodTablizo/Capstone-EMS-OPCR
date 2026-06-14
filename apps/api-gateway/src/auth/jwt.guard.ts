import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/**
 * JWT Auth Guard — applies the 'jwt' Passport strategy.
 * Attach to any controller or route that requires authentication.
 * Returns 401 if token is missing, expired, or invalid.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
