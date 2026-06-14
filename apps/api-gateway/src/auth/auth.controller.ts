import { Controller, Get, UseGuards, Request } from '@nestjs/common'
import { JwtAuthGuard } from './jwt.guard'

/**
 * GET /api/auth/me
 * Returns the decoded JWT claims as a User object.
 * No database call needed — data comes from the validated JWT payload.
 *
 * Replaces the frontend `loginApi()` flow:
 * ARMS issues JWT → frontend stores it → EMS validates it here.
 */
@Controller('auth')
export class AuthController {
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req: { user: Record<string, unknown> }) {
    return req.user
  }
}
