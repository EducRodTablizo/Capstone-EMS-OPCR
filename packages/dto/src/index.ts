import { IsString, IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator'
import type {
  TransactionStatus, DocumentaryStatus, ActionType, UserRole,
} from '@ems/types'

// ─── Auth ─────────────────────────────────────────────────────────────────────
export class ValidateTokenDto {
  @IsString()
  token!: string
}

// ─── User ─────────────────────────────────────────────────────────────────────
export class SyncUserDto {
  @IsUUID() sub!: string
  @IsString() name!: string
  @IsString() email!: string
  @IsString() role!: UserRole
  @IsUUID() office_id!: string
  @IsString() office_code!: string
  @IsString() office_name!: string
}

// ─── Transaction ─────────────────────────────────────────────────────────────
export class CreateTransactionDto {
  @IsUUID() service_id!: string
  @IsOptional() @IsUUID() assigned_to?: string
  @IsString() client_name!: string
  @IsOptional() @IsString() client_type?: string
  @IsOptional() @IsString() student_number?: string
  @IsOptional() @IsString() course?: string
  @IsOptional() @IsString() year_level?: string
  @IsOptional() @IsString() contact_number?: string
  @IsOptional() @IsString() organization?: string
  @IsOptional() @IsString() remarks?: string
  @IsOptional() @IsEnum(['complete','incomplete','for_compliance'])
  documentation_status?: DocumentaryStatus
  @IsOptional() service_specific_data?: Record<string, unknown>
  @IsOptional() intake_data?: Record<string, string>
}

export class UpdateTransactionStatusDto {
  @IsEnum(['pending','in_progress','completed']) status!: TransactionStatus
  @IsOptional() @IsString() remarks?: string
}

export class UpdateDocumentaryStatusDto {
  @IsEnum(['complete','incomplete','for_compliance']) documentary_status!: DocumentaryStatus
  @IsOptional() @IsString() remarks?: string
}

export class AssignTransactionDto {
  @IsUUID() assigned_to!: string
}

// ─── Audit Record (internal — transaction-pss → audit-log) ───────────────────
export class RecordAuditDto {
  @IsUUID() transaction_id!: string
  @IsEnum(['CREATE','STATUS_CHANGE','ASSIGNMENT','DOCUMENTARY_CHANGE','REMARKS_UPDATE'])
  action_type!: ActionType
  @IsEnum(['pending','in_progress','completed']) new_status!: TransactionStatus
  @IsOptional() @IsEnum(['pending','in_progress','completed']) old_status?: TransactionStatus | null
  @IsOptional() @IsEnum(['complete','incomplete','for_compliance'])
  documentary_new?: DocumentaryStatus
  @IsOptional() @IsEnum(['complete','incomplete','for_compliance'])
  documentary_old?: DocumentaryStatus | null
  @IsOptional() @IsString() old_value?: string | null
  @IsOptional() @IsString() new_value?: string | null
  @IsUUID() changed_by!: string
  @IsString() changed_by_name!: string
  @IsOptional() @IsString() remarks?: string | null
  // For ARMS dispatch payload
  @IsString() service_name!: string
  @IsString() client_name!: string
  @IsString() office_id!: string
}

// ─── Audit Log Filters ────────────────────────────────────────────────────────
export class AuditLogFilterDto {
  @IsOptional() @IsUUID() officeId?: string
  @IsOptional() @IsString() actionType?: string
  @IsOptional() @IsDateString() from?: string
  @IsOptional() @IsDateString() to?: string
  @IsOptional() page?: number
  @IsOptional() limit?: number
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export class DashboardQueryDto {
  @IsOptional() @IsUUID() officeId?: string
}

// ─── PSS ─────────────────────────────────────────────────────────────────────
export class PssSyncDto {
  @IsString() officeCode!: string
}

export class SlaComputeDto {
  @IsUUID() transaction_id!: string
  @IsUUID() service_id!: string
  @IsString() office_code!: string
  @IsDateString() time_in!: string
  @IsDateString() time_out!: string
  duration_seconds!: number
  sla_target_seconds!: number
}

export class PssCallbackDto {
  @IsUUID() transaction_id!: string
  @IsEnum(['compliant','non_compliant']) sla_status!: string
  is_breached!: boolean
  @IsDateString() computed_at!: string
}
