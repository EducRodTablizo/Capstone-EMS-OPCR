import {
  Controller, Get, Post, Patch, Param, Body, Query, Headers,
} from '@nestjs/common'
import { TransactionsService } from './transactions.service'
import {
  CreateTransactionDto,
  AssignTransactionDto,
  UpdateTransactionStatusDto,
  UpdateDocumentaryStatusDto,
} from '@ems/dto'

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly svc: TransactionsService) {}

  /** GET /transactions?officeId= */
  @Get()
  list(
    @Query('officeId') officeId: string | undefined,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    return this.svc.getTransactions(officeId, headers)
  }

  /** GET /transactions/:id */
  @Get(':id')
  get(
    @Param('id') id: string,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    return this.svc.getTransaction(id, headers)
  }

  /** POST /transactions */
  @Post()
  create(
    @Body() body: CreateTransactionDto,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    return this.svc.createTransaction(body, headers)
  }

  /** PATCH /transactions/:id/assignment */
  @Patch(':id/assignment')
  assign(
    @Param('id') id: string,
    @Body() body: AssignTransactionDto,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    return this.svc.assignTransaction(id, body.assigned_to, headers)
  }

  /** PATCH /transactions/:id/status */
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateTransactionStatusDto,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    return this.svc.updateStatus(id, body.status, body.remarks, headers)
  }

  /** PATCH /transactions/:id/documentary-status */
  @Patch(':id/documentary-status')
  updateDocumentary(
    @Param('id') id: string,
    @Body() body: UpdateDocumentaryStatusDto,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    return this.svc.updateDocumentaryStatus(id, body.documentary_status, body.remarks, headers)
  }
}
