import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsInt, IsBoolean } from 'class-validator'
import {
  TransactionStatus, DocumentaryStatus, ActionType, UserRole, SlaStatus,
} from '@ems/types'

// ─── Auth ─────────────────────────────────────────────────────────────────────
export class ValidateTokenDto {
  @IsString()
  token!: string
}

// ─── User ─────────────────────────────────────────────────────────────────────
export class SyncUserDto {
  @IsString() sub!: string
  @IsString() name!: string
  @IsString() email!: string
  @IsEnum(UserRole) role!: UserRole
  @IsString() office_id!: string
  @IsString() office_code!: string
  @IsString() office_name!: string
}

// ─── Transaction ─────────────────────────────────────────────────────────────
export class CreateTransactionDto {
  @IsString() service_id!: string
  @IsOptional() @IsString() assigned_to?: string
  @IsString() client_name!: string
  @IsOptional() @IsString() client_type?: string
  @IsOptional() @IsString() student_number?: string
  @IsOptional() @IsString() course?: string
  @IsOptional() @IsString() year_level?: string
  @IsOptional() @IsString() contact_number?: string
  @IsOptional() @IsString() organization?: string
  @IsOptional() @IsString() remarks?: string
  @IsOptional() @IsEnum(DocumentaryStatus)
  documentation_status?: DocumentaryStatus
  @IsOptional() service_specific_data?: Record<string, unknown>
  @IsOptional() intake_data?: Record<string, string>
}

export class UpdateTransactionStatusDto {
  @IsEnum(TransactionStatus) status!: TransactionStatus
  @IsOptional() @IsString() remarks?: string
}

export class UpdateDocumentaryStatusDto {
  @IsEnum(DocumentaryStatus) documentary_status!: DocumentaryStatus
  @IsOptional() @IsString() remarks?: string
}

export class AssignTransactionDto {
  @IsString() assigned_to!: string
}

// ─── Audit Record (internal — transaction-pss → audit-log) ───────────────────
export class RecordAuditDto {
  @IsString() transaction_id!: string
  @IsEnum(ActionType)
  action_type!: ActionType
  @IsEnum(TransactionStatus) new_status!: TransactionStatus
  @IsOptional() @IsEnum(TransactionStatus) old_status?: TransactionStatus | null
  @IsOptional() @IsEnum(DocumentaryStatus)
  documentary_new?: DocumentaryStatus
  @IsOptional() @IsEnum(DocumentaryStatus)
  documentary_old?: DocumentaryStatus | null
  @IsOptional() @IsString() old_value?: string | null
  @IsOptional() @IsString() new_value?: string | null
  @IsString() changed_by!: string
  @IsString() changed_by_name!: string
  @IsOptional() @IsString() remarks?: string | null
  // For ARMS dispatch payload
  @IsString() service_name!: string
  @IsString() client_name!: string
  @IsString() office_id!: string
}

// ─── Audit Log Filters ────────────────────────────────────────────────────────
export class AuditLogFilterDto {
  @IsOptional() @IsString() officeId?: string
  @IsOptional() @IsString() actionType?: string
  @IsOptional() @IsDateString() from?: string
  @IsOptional() @IsDateString() to?: string
  @IsOptional() page?: number
  @IsOptional() limit?: number
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export class DashboardQueryDto {
  @IsOptional() @IsString() officeId?: string
}

// ─── PSS ─────────────────────────────────────────────────────────────────────
export class PssSyncDto {
  @IsString() officeCode!: string
}

export class SlaComputeDto {
  @IsString() transaction_id!: string
  @IsString() service_id!: string
  @IsString() office_code!: string
  @IsDateString() time_in!: string
  @IsDateString() time_out!: string
  @IsInt() duration_seconds!: number
  @IsInt() sla_target_seconds!: number
}

export class PssCallbackDto {
  @IsString() transaction_id!: string
  @IsEnum(SlaStatus) sla_status!: SlaStatus
  @IsBoolean() is_breached!: boolean
  @IsDateString() computed_at!: string
}

export class LocalSlaComputeDto {
  @IsString() transaction_id!: string
  @IsDateString() time_in!: string
  @IsDateString() time_out!: string
  @IsInt() sla_target_seconds!: number
}
