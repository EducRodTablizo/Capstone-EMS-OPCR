import { Controller, Get, Query } from '@nestjs/common'
import { DashboardService } from './dashboard.service'

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly svc: DashboardService) {}

  /** GET /dashboard/stats?officeId= */
  @Get('stats')
  getStats(@Query('officeId') officeId: string | undefined) {
    return this.svc.getStats(officeId)
  }

  /** GET /dashboard/pss-status */
  @Get('pss-status')
  getPssStatus() {
    return this.svc.getPssStatus()
  }
}
