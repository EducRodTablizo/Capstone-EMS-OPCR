import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'
import { PerformanceController } from './performance.controller'
import { HealthController } from './health.controller'

@Module({
  imports: [HttpModule],
  controllers: [DashboardController, PerformanceController, HealthController],
  providers: [DashboardService],
})
export class DashboardModule {}
