import { Controller, Get, Param, Query, Headers, NotFoundException } from '@nestjs/common'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  /** GET /users?officeId= */
  @Get()
  getUsers(
    @Query('officeId') officeId: string | undefined,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    return this.svc.getUsers(officeId, headers)
  }

  /** GET /users/:id */
  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.svc.getUserById(id)
    if (!user) throw new NotFoundException(`User ${id} not found`)
    return user
  }
}
