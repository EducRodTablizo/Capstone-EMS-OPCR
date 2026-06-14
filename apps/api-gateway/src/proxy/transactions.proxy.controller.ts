import {
  Controller, Get, Post, Patch, Param, Body, Query,
  Req, Res, UseGuards, UseInterceptors,
} from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import type { Request, Response } from 'express'
import { JwtAuthGuard } from '../auth/jwt.guard'
import { RlsHeadersInterceptor } from '../common/rls-headers.interceptor'

const TXN_SVC = process.env.TRANSACTION_SVC_URL ?? 'http://localhost:3003'

@UseGuards(JwtAuthGuard)
@UseInterceptors(RlsHeadersInterceptor)
@Controller()
export class TransactionsProxyController {
  constructor(private readonly http: HttpService) {}

  /** GET /api/services?officeId= */
  @Get('services')
  async getServices(@Query('officeId') officeId: string | undefined, @Req() req: Request, @Res() res: Response) {
    const params = officeId ? `?officeId=${officeId}` : ''
    const r = await firstValueFrom(this.http.get(`${TXN_SVC}/services${params}`, { headers: this.rls(req) }))
    return res.status(r.status).json(r.data)
  }

  /** GET /api/transactions?officeId= */
  @Get('transactions')
  async list(@Query('officeId') officeId: string | undefined, @Req() req: Request, @Res() res: Response) {
    const params = officeId ? `?officeId=${officeId}` : ''
    const r = await firstValueFrom(this.http.get(`${TXN_SVC}/transactions${params}`, { headers: this.rls(req) }))
    return res.status(r.status).json(r.data)
  }

  /** GET /api/transactions/:id */
  @Get('transactions/:id')
  async get(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const r = await firstValueFrom(this.http.get(`${TXN_SVC}/transactions/${id}`, { headers: this.rls(req) }))
    return res.status(r.status).json(r.data)
  }

  /** POST /api/transactions */
  @Post('transactions')
  async create(@Body() body: unknown, @Req() req: Request, @Res() res: Response) {
    const r = await firstValueFrom(this.http.post(`${TXN_SVC}/transactions`, body, { headers: this.rls(req) }))
    return res.status(r.status).json(r.data)
  }

  /** PATCH /api/transactions/:id/assignment */
  @Patch('transactions/:id/assignment')
  async assign(@Param('id') id: string, @Body() body: unknown, @Req() req: Request, @Res() res: Response) {
    const r = await firstValueFrom(this.http.patch(`${TXN_SVC}/transactions/${id}/assignment`, body, { headers: this.rls(req) }))
    return res.status(r.status).json(r.data)
  }

  /** PATCH /api/transactions/:id/status */
  @Patch('transactions/:id/status')
  async updateStatus(@Param('id') id: string, @Body() body: unknown, @Req() req: Request, @Res() res: Response) {
    const r = await firstValueFrom(this.http.patch(`${TXN_SVC}/transactions/${id}/status`, body, { headers: this.rls(req) }))
    return res.status(r.status).json(r.data)
  }

  /** PATCH /api/transactions/:id/documentary-status */
  @Patch('transactions/:id/documentary-status')
  async updateDocumentary(@Param('id') id: string, @Body() body: unknown, @Req() req: Request, @Res() res: Response) {
    const r = await firstValueFrom(this.http.patch(`${TXN_SVC}/transactions/${id}/documentary-status`, body, { headers: this.rls(req) }))
    return res.status(r.status).json(r.data)
  }

  private rls(req: Request) {
    return {
      'x-user-id': req.headers['x-user-id'] ?? '',
      'x-office-id': req.headers['x-office-id'] ?? '',
      'x-user-role': req.headers['x-user-role'] ?? '',
      'x-user-name': req.headers['x-user-name'] ?? '',
    }
  }
}
