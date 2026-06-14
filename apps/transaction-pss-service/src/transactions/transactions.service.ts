import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { TransactionsRepository } from './transactions.repository'
import { AuditRelayService } from './audit-relay.service'
import { ServicesService } from '../services/services.service'
import type { Transaction } from '@ems/types'

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
    dto: {
      service_id: string; assigned_to?: string; client_name: string;
      client_type?: string; student_number?: string; course?: string;
      year_level?: string; contact_number?: string; organization?: string;
      remarks?: string; documentation_status?: string;
      service_specific_data?: Record<string, unknown>;
      intake_data?: Record<string, string>;
    },
    headers: Headers,
  ): Promise<Transaction> {
    // Validate service exists
    const service = await this.services.getServiceById(dto.service_id)
    if (!service) throw new NotFoundException(`Service ${dto.service_id} not found`)

    const txn = await this.repo.create(dto, headers)

    this.auditRelay.relay(txn, 'CREATE', {
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

    this.auditRelay.relay(txn, 'ASSIGNMENT', {
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
    status: string,
    remarks: string | undefined,
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

    const txn = await this.repo.updateStatus(id, status, remarks, headers)

    this.auditRelay.relay(txn, 'STATUS_CHANGE', {
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

  async updateDocumentaryStatus(
    id: string,
    documentaryStatus: string,
    remarks: string | undefined,
    headers: Headers,
  ): Promise<Transaction> {
    const existing = await this.repo.findById(id, headers)
    if (!existing) throw new NotFoundException(`Transaction ${id} not found`)
    if (existing.status === 'completed') {
      throw new ForbiddenException('Completed transactions are read-only')
    }

    const txn = await this.repo.updateDocumentaryStatus(id, documentaryStatus, headers)

    this.auditRelay.relay(txn, 'DOCUMENTARY_CHANGE', {
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
