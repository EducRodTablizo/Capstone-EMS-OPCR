import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ServicesController } from './services.controller'
import { ServicesService } from './services.service'
import { PssSyncService } from './pss-sync.service'
import { PssController } from './pss.controller'

@Module({
  imports: [HttpModule],
  controllers: [ServicesController, PssController],
  providers: [ServicesService, PssSyncService],
  exports: [ServicesService],
})
export class ServicesModule {}
