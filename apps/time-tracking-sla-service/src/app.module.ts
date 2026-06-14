import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ScheduleModule } from '@nestjs/schedule'
import { DatabaseModule } from './database/database.module'
import { SlaModule } from './sla/sla.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule,
    DatabaseModule,
    SlaModule,
  ],
})
export class AppModule {}
