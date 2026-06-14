import { Controller, Get } from '@nestjs/common'
import { OfficesService } from './offices.service'

@Controller('offices')
export class OfficesController {
  constructor(private readonly svc: OfficesService) {}

  @Get()
  getOffices() {
    return this.svc.getOffices()
  }
}
