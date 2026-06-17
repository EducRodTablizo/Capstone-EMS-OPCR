/*import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
//temporary commented out until we implement JWT auth
/**
 * JWT Auth Guard — applies the 'jwt' Passport strategy.
 * Attach to any controller or route that requires authentication.
 * Returns 401 if token is missing, expired, or invalid.
 *//*
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {} */

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()

    req.user = {
      id: 'dev-user',
      role: 'admin',
      office_id: 'office-1',
      office_name: 'Administrative Office',
    }

    return true
  }
}