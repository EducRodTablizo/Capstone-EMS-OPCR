import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ScheduleModule } from '@nestjs/schedule'
import { DatabaseModule } from './database/database.module'
import { AuditModule } from './audit/audit.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule,
    DatabaseModule,
    AuditModule,
  ],
})
export class AppModule {}
