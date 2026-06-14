import { Module } from '@nestjs/common'
import { DatabaseModule } from './database/database.module'
import { UsersModule } from './users/users.module'
import { OfficesModule } from './offices/offices.module'

@Module({
  imports: [DatabaseModule, UsersModule, OfficesModule],
})
export class AppModule {}
