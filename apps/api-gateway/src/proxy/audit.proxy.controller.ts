import { Controller, Get, Param, Query, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import type { Request, Response } from 'express'
import { JwtAuthGuard } from '../auth/jwt.guard'
import { RlsHeadersInterceptor } from '../common/rls-headers.interceptor'

const AUDIT_SVC = process.env.AUDIT_SVC_URL ?? 'http://localhost:3006'
const DASHBOARD_SVC = process.env.DASHBOARD_SVC_URL ?? 'http://localhost:3007'

@UseGuards(JwtAuthGuard)
@UseInterceptors(RlsHeadersInterceptor)
@Controller()
export class AuditProxyController {
  constructor(private readonly http: HttpService) {}

  /** GET /api/transactions/:id/history */
  @Get('transactions/:id/history')
  async getHistory(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const r = await firstValueFrom(this.http.get(`${AUDIT_SVC}/history/${id}`, { headers: this.rls(req) }))
    return res.status(r.status).json(r.data)
  }

  /** GET /api/audit-log */
  @Get('audit-log')
  async getAuditLog(@Query() query: Record<string, string>, @Req() req: Request, @Res() res: Response) {
    const qs = new URLSearchParams(query).toString()
    const r = await firstValueFrom(this.http.get(`${AUDIT_SVC}/audit-log${qs ? '?' + qs : ''}`, { headers: this.rls(req) }))
    return res.status(r.status).json(r.data)
  }

  /** GET /api/arms/dispatch-status */
  @Get('arms/dispatch-status')
  async dispatchStatus(@Req() req: Request, @Res() res: Response) {
    const r = await firstValueFrom(this.http.get(`${AUDIT_SVC}/arms/dispatch-status`, { headers: this.rls(req) }))
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

@UseGuards(JwtAuthGuard)
@UseInterceptors(RlsHeadersInterceptor)
@Controller()
export class DashboardProxyController {
  constructor(private readonly http: HttpService) {}

  /** GET /api/dashboard/stats */
  @Get('dashboard/stats')
  async getStats(@Query() query: Record<string, string>, @Req() req: Request, @Res() res: Response) {
    const qs = new URLSearchParams(query).toString()
    const r = await firstValueFrom(this.http.get(`${DASHBOARD_SVC}/dashboard/stats${qs ? '?' + qs : ''}`, { headers: this.rls(req) }))
    return res.status(r.status).json(r.data)
  }

  /** GET /api/performance/by-service */
  @Get('performance/by-service')
  async getPerformance(@Query() query: Record<string, string>, @Req() req: Request, @Res() res: Response) {
    const qs = new URLSearchParams(query).toString()
    const r = await firstValueFrom(this.http.get(`${DASHBOARD_SVC}/performance/by-service${qs ? '?' + qs : ''}`, { headers: this.rls(req) }))
    return res.status(r.status).json(r.data)
  }

  /** GET /api/dashboard/pss-status */
  @Get('dashboard/pss-status')
  async getPssStatus(@Req() req: Request, @Res() res: Response) {
    const r = await firstValueFrom(this.http.get(`${DASHBOARD_SVC}/dashboard/pss-status`, { headers: this.rls(req) }))
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
