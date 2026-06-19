import {
  Controller, Get, Post, Patch, Param, Body, Query, Headers,
} from '@nestjs/common'
import { TransactionsService } from './transactions.service'
import {
  CreateTransactionDto,
  AssignTransactionDto,
  UpdateTransactionStatusDto,
  UpdateDocumentaryStatusDto,
  OverrideTimeInDto,
  OverrideDocumentDto,
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
    console.log('ASSIGN PARAM ID:', id, 'BODY:', body, 'assigned_to TYPE:', typeof body?.assigned_to);
    return this.svc.assignTransaction(id, body.assigned_to, headers)
  }

  /** PATCH /transactions/:id/status */
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateTransactionStatusDto,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    return this.svc.updateStatus(id, body.status, body.remarks, body.override_document_name, headers)
  }

  /** PATCH /transactions/:id/override */
  @Patch(':id/override')
  override(
    @Param('id') id: string,
    @Body() body: OverrideTimeInDto,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    return this.svc.overrideTimeIn(id, body.new_time_in, body.reason, headers)
  }

  /** PATCH /transactions/:id/override-document */
  @Patch(':id/override-document')
  uploadOverrideDocument(
    @Param('id') id: string,
    @Body() body: OverrideDocumentDto,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    return this.svc.uploadOverrideDocument(id, body.override_document_name, headers)
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
