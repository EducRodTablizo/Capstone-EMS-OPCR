import {
  Controller, Get, Req, Res, UseGuards, UseInterceptors, Query,
} from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import type { Request, Response } from 'express'
import { JwtAuthGuard } from '../auth/jwt.guard'
import { RlsHeadersInterceptor } from '../common/rls-headers.interceptor'

const IDENTITY_SVC = process.env.IDENTITY_SVC_URL ?? 'http://localhost:3002'

@UseGuards(JwtAuthGuard)
@UseInterceptors(RlsHeadersInterceptor)
@Controller()
export class UsersProxyController {
  constructor(private readonly http: HttpService) {}

  @Get('users')
  async getUsers(
    @Query('officeId') officeId: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const params = officeId ? `?officeId=${officeId}` : ''
    const upstream = await firstValueFrom(
      this.http.get(`${IDENTITY_SVC}/users${params}`, {
        headers: this.extractRlsHeaders(req),
      }),
    )
    return res.status(upstream.status).json(upstream.data)
  }

  @Get('offices')
  async getOffices(@Req() req: Request, @Res() res: Response) {
    const upstream = await firstValueFrom(
      this.http.get(`${IDENTITY_SVC}/offices`, {
        headers: this.extractRlsHeaders(req),
      }),
    )
    return res.status(upstream.status).json(upstream.data)
  }

  private extractRlsHeaders(req: Request) {
    return {
      'x-user-id': req.headers['x-user-id'] ?? '',
      'x-office-id': req.headers['x-office-id'] ?? '',
      'x-user-role': req.headers['x-user-role'] ?? '',
      'x-user-name': req.headers['x-user-name'] ?? '',
    }
  }
}
