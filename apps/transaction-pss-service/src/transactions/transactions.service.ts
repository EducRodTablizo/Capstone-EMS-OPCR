import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { TransactionsRepository } from './transactions.repository'
import { AuditRelayService } from './audit-relay.service'
import { ServicesService } from '../services/services.service'
import { Transaction, TransactionStatus, DocumentaryStatus, ActionType } from '@ems/types'
import { CreateTransactionDto } from '@ems/dto'

type Headers = Record<string, string | undefined>

@Injectable()
export class TransactionsService {
  constructor(
    private readonly repo: TransactionsRepository,
    private readonly auditRelay: AuditRelayService,
    private readonly services: ServicesService,
  ) {}

  getTransactions(officeId: string | undefined, headers: Headers) {
    return this.repo.findAll(officeId, headers)
  }

  async getTransaction(id: string, headers: Headers) {
    const txn = await this.repo.findById(id, headers)
    if (!txn) throw new NotFoundException(`Transaction ${id} not found`)
    return txn
  }

  async createTransaction(
    dto: CreateTransactionDto,
    headers: Headers,
  ): Promise<Transaction> {
    // Validate service exists
    const service = await this.services.getServiceById(dto.service_id)
    if (!service) throw new NotFoundException(`Service ${dto.service_id} not found`)

    const txn = await this.repo.create(dto, headers)

    this.auditRelay.relay(txn, ActionType.CREATE, {
      id: headers['x-user-id'] ?? '',
      name: headers['x-user-name'] ?? '',
    }, {
      newValue: 'pending',
      remarks: 'Transaction created',
    })

    return txn
  }

  async assignTransaction(
    id: string,
    assignedTo: string,
    headers: Headers,
  ): Promise<Transaction> {
    const existing = await this.repo.findById(id, headers)
    if (!existing) throw new NotFoundException(`Transaction ${id} not found`)
    if (existing.status === 'completed') {
      throw new ForbiddenException('Completed transactions are read-only')
    }

    const txn = await this.repo.assign(id, assignedTo, headers)

    this.auditRelay.relay(txn, ActionType.ASSIGNMENT, {
      id: headers['x-user-id'] ?? '',
      name: headers['x-user-name'] ?? '',
    }, {
      oldValue: existing.assigned_to_name ?? 'Unassigned',
      newValue: txn.assigned_to_name ?? assignedTo,
      oldStatus: existing.status,
    })

    return txn
  }

  async updateStatus(
    id: string,
    status: TransactionStatus,
    remarks: string | undefined,
    overrideDocumentName: string | undefined,
    headers: Headers,
  ): Promise<Transaction> {
    const existing = await this.repo.findById(id, headers)
    if (!existing) throw new NotFoundException(`Transaction ${id} not found`)
    if (existing.status === 'completed') {
      throw new ForbiddenException('Completed transactions are read-only')
    }
    if (existing.is_locked) {
      throw new ForbiddenException('Transaction is locked')
    }

    const txn = await this.repo.updateStatus(id, status, remarks, overrideDocumentName, headers)

    this.auditRelay.relay(txn, ActionType.STATUS_CHANGE, {
      id: headers['x-user-id'] ?? '',
      name: headers['x-user-name'] ?? '',
    }, {
      oldStatus: existing.status,
      oldValue: existing.status,
      newValue: status,
      remarks,
    })

    return txn
  }

  async overrideTimeIn(
    id: string,
    newTimeIn: string,
    reason: string,
    headers: Headers,
  ): Promise<Transaction> {
    const existing = await this.repo.findById(id, headers)
    if (!existing) throw new NotFoundException(`Transaction ${id} not found`)
    if (existing.status === 'completed') {
      throw new ForbiddenException('Completed transactions are read-only')
    }

    const txn = await this.repo.overrideTimeIn(id, newTimeIn, reason, headers)

    this.auditRelay.relay(txn, ActionType.STATUS_CHANGE, {
      id: headers['x-user-id'] ?? '',
      name: headers['x-user-name'] ?? '',
    }, {
      oldStatus: existing.status,
      oldValue: existing.time_in,
      newValue: newTimeIn,
      remarks: `Time-In Overridden to ${newTimeIn}. Reason: ${reason}`,
    })

    return txn
  }

  async uploadOverrideDocument(
    id: string,
    documentName: string,
    headers: Headers,
  ): Promise<Transaction> {
    const existing = await this.repo.findById(id, headers)
    if (!existing) throw new NotFoundException(`Transaction ${id} not found`)
    if (existing.status === 'completed') {
      throw new ForbiddenException('Completed transactions are read-only')
    }

    const txn = await this.repo.updateOverrideDocument(id, documentName, headers)

    this.auditRelay.relay(txn, ActionType.STATUS_CHANGE, {
      id: headers['x-user-id'] ?? '',
      name: headers['x-user-name'] ?? '',
    }, {
      oldStatus: existing.status,
      remarks: `Supporting document uploaded: ${documentName}`,
    })

    return txn
  }

  async updateDocumentaryStatus(
    id: string,
    documentaryStatus: DocumentaryStatus,
    remarks: string | undefined,
    headers: Headers,
  ): Promise<Transaction> {
    const existing = await this.repo.findById(id, headers)
    if (!existing) throw new NotFoundException(`Transaction ${id} not found`)
    if (existing.status === 'completed') {
      throw new ForbiddenException('Completed transactions are read-only')
    }

    const txn = await this.repo.updateDocumentaryStatus(id, documentaryStatus, headers)

    this.auditRelay.relay(txn, ActionType.DOCUMENTARY_CHANGE, {
      id: headers['x-user-id'] ?? '',
      name: headers['x-user-name'] ?? '',
    }, {
      oldDocumentary: existing.documentary_status,
      oldValue: existing.documentary_status,
      newValue: documentaryStatus,
      remarks,
    })

    return txn
  }
}
