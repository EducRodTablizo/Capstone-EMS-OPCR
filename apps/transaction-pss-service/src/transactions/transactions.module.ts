import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { TransactionsController } from './transactions.controller'
import { TransactionsService } from './transactions.service'
import { TransactionsRepository } from './transactions.repository'
import { AuditRelayService } from './audit-relay.service'
import { ServicesModule } from '../services/services.module'

@Module({
  imports: [HttpModule, ServicesModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionsRepository, AuditRelayService],
})
export class TransactionsModule {}
