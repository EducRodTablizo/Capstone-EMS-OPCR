import { Controller, Post, Body, Req, Res } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import type { Request, Response } from 'express'

const TIME_SVC = process.env.TIME_SVC_URL ?? 'http://localhost:3004'

/**
 * SLA Proxy Controller
 * Handles the PSS → EMS webhook callback (POST /api/sla/result).
 * This endpoint is NOT behind JwtAuthGuard — PSS calls it with its own service token.
 * In production, validate the PSS_SLA_CALLBACK_SECRET header.
 */
@Controller('sla')
export class SlaProxyController {
  constructor(private readonly http: HttpService) {}

  /** POST /api/sla/result — PSS webhook: delivers SLA computation result */
  @Post('result')
  async pssCallback(@Body() body: unknown, @Req() req: Request, @Res() res: Response) {
    // Validate PSS callback secret in production
    const secret = req.headers['x-pss-callback-secret']
    const expected = process.env.PSS_SLA_CALLBACK_SECRET ?? 'dev_callback_secret'
    if (secret !== expected) {
      return res.status(401).json({ message: 'Invalid PSS callback secret' })
    }

    const r = await firstValueFrom(
      this.http.post(`${TIME_SVC}/sla/result`, body),
    )
    return res.status(r.status).json(r.data)
  }
}
