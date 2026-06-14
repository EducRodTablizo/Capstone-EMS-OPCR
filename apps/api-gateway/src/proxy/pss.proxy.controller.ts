import { Controller, Get, Post, Body, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import type { Request, Response } from 'express'
import { JwtAuthGuard } from '../auth/jwt.guard'
import { RlsHeadersInterceptor } from '../common/rls-headers.interceptor'

const TXN_SVC = process.env.TRANSACTION_SVC_URL ?? 'http://localhost:3003'

@UseGuards(JwtAuthGuard)
@UseInterceptors(RlsHeadersInterceptor)
@Controller('pss')
export class PssProxyController {
  constructor(private readonly http: HttpService) {}

  /** GET /api/pss/status — PSS connectivity and last sync info */
  @Get('status')
  async getPssStatus(@Req() req: Request, @Res() res: Response) {
    const r = await firstValueFrom(this.http.get(`${TXN_SVC}/pss/status`, { headers: this.rls(req) }))
    return res.status(r.status).json(r.data)
  }

  /** POST /api/pss/sync — trigger manual PSS service catalog sync */
  @Post('sync')
  async triggerSync(@Body() body: unknown, @Req() req: Request, @Res() res: Response) {
    const r = await firstValueFrom(this.http.post(`${TXN_SVC}/pss/sync`, body, { headers: this.rls(req) }))
    return res.status(r.status).json(r.data)
  }

  private rls(req: Request) {
    return {
      'x-user-id': req.headers['x-user-id'] ?? '',
      'x-office-id': req.headers['x-office-id'] ?? '',
      'x-user-role': req.headers['x-user-role'] ?? '',
    }
  }
}
