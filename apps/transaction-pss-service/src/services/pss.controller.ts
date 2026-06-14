import { Controller, Get, Post, Body } from '@nestjs/common'
import { PssSyncService } from './pss-sync.service'

@Controller('pss')
export class PssController {
  constructor(private readonly pss: PssSyncService) {}

  @Get('status')
  getStatus() {
    return this.pss.getStatus()
  }

  @Post('sync')
  triggerSync(@Body() body: { officeCode?: string }) {
    if (body.officeCode) {
      return this.pss.syncForOffice(body.officeCode)
    }
    return this.pss.syncAllOffices().then(() => ({ status: 'synced' }))
  }
}
