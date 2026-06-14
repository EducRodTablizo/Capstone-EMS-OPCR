import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { SlaController } from './sla.controller'
import { SlaService } from './sla.service'
import { PssComputeService } from './pss-compute.service'
import { CalendarService } from './calendar.service'

@Module({
  imports: [HttpModule],
  controllers: [SlaController],
  providers: [SlaService, PssComputeService, CalendarService],
})
export class SlaModule {}
