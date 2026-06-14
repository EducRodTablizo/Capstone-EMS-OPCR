import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'

/**
 * RLS Headers Interceptor
 * Extracts the authenticated user from req.user (set by JwtAuthGuard)
 * and injects x-user-* headers for downstream services to set RLS context.
 *
 * Each downstream service reads these headers and executes:
 *   SET LOCAL ems.current_office_id = '<value>';
 *   SET LOCAL ems.current_role = '<value>';
 *   SET LOCAL ems.acting_user_id = '<value>';
 */
@Injectable()
export class RlsHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      user?: {
        id?: string
        office_id?: string
        role?: string
        name?: string
        email?: string
      }
      headers: Record<string, string>
    }>()

    if (request.user) {
      request.headers['x-user-id'] = request.user.id ?? ''
      request.headers['x-office-id'] = request.user.office_id ?? ''
      request.headers['x-user-role'] = request.user.role ?? ''
      request.headers['x-user-name'] = request.user.name ?? ''
      request.headers['x-user-email'] = request.user.email ?? ''
    }

    return next.handle()
  }
}
