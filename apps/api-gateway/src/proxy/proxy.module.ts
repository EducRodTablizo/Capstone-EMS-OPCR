import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { AuthModule } from '../auth/auth.module'
import { UsersProxyController } from './users.proxy.controller'
import { TransactionsProxyController } from './transactions.proxy.controller'
import { AuditProxyController, DashboardProxyController } from './audit.proxy.controller'
import { PssProxyController } from './pss.proxy.controller'
import { SlaProxyController } from './sla.proxy.controller'

@Module({
  imports: [
    HttpModule.register({ timeout: 15_000 }),
    AuthModule,
  ],
  controllers: [
    UsersProxyController,
    TransactionsProxyController,
    AuditProxyController,
    DashboardProxyController,
    PssProxyController,
    SlaProxyController,
  ],
})
export class ProxyModule {}
