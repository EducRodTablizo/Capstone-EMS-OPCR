import { Controller, Get, Query } from '@nestjs/common'
import { ServicesService } from './services.service'

@Controller('services')
export class ServicesController {
  constructor(private readonly svc: ServicesService) {}

  @Get()
  getServices(@Query('officeId') officeId: string | undefined) {
    return this.svc.getServices(officeId)
  }
}
