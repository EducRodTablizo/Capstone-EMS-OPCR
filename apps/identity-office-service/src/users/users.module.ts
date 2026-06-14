import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { UsersRepository } from './users.repository'
import { ArmsSyncService } from './arms-sync.service'

@Module({
  imports: [HttpModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, ArmsSyncService],
  exports: [UsersService],
})
export class UsersModule {}
