import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { AuditController } from './audit.controller'
import { AuditService } from './audit.service'
import { AuditRepository } from './audit.repository'
import { ArmsDispatchService } from './arms-dispatch.service'

@Module({
  imports: [HttpModule],
  controllers: [AuditController],
  providers: [AuditService, AuditRepository, ArmsDispatchService],
})
export class AuditModule {}
