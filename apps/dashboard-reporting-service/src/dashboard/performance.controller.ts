import { Controller, Get, Query } from '@nestjs/common'
import { DashboardService } from './dashboard.service'

@Controller('performance')
export class PerformanceController {
  constructor(private readonly svc: DashboardService) {}

  /** GET /performance/by-service?officeId= */
  @Get('by-service')
  getByService(@Query('officeId') officeId: string | undefined) {
    return this.svc.getPerformanceByService(officeId)
  }
}
