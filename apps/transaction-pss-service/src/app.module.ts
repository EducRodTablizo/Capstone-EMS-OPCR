import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ScheduleModule } from '@nestjs/schedule'
import { DatabaseModule } from './database/database.module'
import { ServicesModule } from './services/services.module'
import { TransactionsModule } from './transactions/transactions.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule,
    DatabaseModule,
    ServicesModule,
    TransactionsModule,
  ],
})
export class AppModule {}
