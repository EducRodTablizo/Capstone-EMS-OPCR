// ─── Shared Types — mirrors src/types/index.ts ───────────────────────────────
// Used by all NestJS microservices via packages/types

export enum UserRole {
  ADMIN = 'subsystem_admin',
  STAFF = 'staff',
  EVALUATOR = 'opcr_evaluator',
}

export enum OfficeCode {
  ADMIN_OFFICE = 'ADMIN_OFFICE',
  ACADEMIC_OFFICE = 'ACADEMIC_OFFICE',
  OSAS = 'OSAS',
}

export enum TransactionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum DocumentaryStatus {
  COMPLETE = 'complete',
  INCOMPLETE = 'incomplete',
  FOR_COMPLIANCE = 'for_compliance',
}

export enum SlaStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PENDING_COMPUTATION = 'pending_computation',
}

export enum ActionType {
  CREATE = 'CREATE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  ASSIGNMENT = 'ASSIGNMENT',
  DOCUMENTARY_CHANGE = 'DOCUMENTARY_CHANGE',
  REMARKS_UPDATE = 'REMARKS_UPDATE',
}

export interface JwtPayload {
  sub: string
  name: string
  email: string
  role: UserRole
  office_id: string
  office_code: OfficeCode
  office_name: string
  iat: number
  exp: number
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  office_id: string
  office_code: OfficeCode
  office_name: string
  is_active: boolean
  created_at: string
}

export interface Office {
  id: string
  name: string
  code: OfficeCode
}

export interface Service {
  id: string
  name: string
  category: string
  client_type: string
  office_id: string
  office_code: OfficeCode
  sla_target_seconds: number
  sla_display: string
  is_active: boolean
  is_na?: boolean
  pss_service_code?: string
  last_synced_from_pss?: string
}

export interface Transaction {
  id: string
  service_id: string
  service_name: string
  service_category: string
  office_id: string
  office_name: string
  assigned_to: string | null
  assigned_to_name: string | null
  created_by: string
  created_by_name: string
  time_in: string
  time_out: string | null
  status: TransactionStatus
  documentary_status: DocumentaryStatus
  processing_time_seconds: number | null
  sla_target_seconds: number
  sla_status: SlaStatus
  is_sla_breached: boolean
  client_name: string
  client_type?: string | null
  student_number?: string | null
  course?: string | null
  year_level?: string | null
  contact_number?: string | null
  organization?: string | null
  service_specific_data?: Record<string, unknown> | null
  remarks: string | null
  intake_data?: Record<string, string> | null
  is_locked: boolean
  created_at: string
  updated_at: string
}

export interface TransactionStatusHistory {
  id: string
  transaction_id: string
  action_type: ActionType
  old_status: TransactionStatus | null
  new_status: TransactionStatus
  documentary_old: DocumentaryStatus | null
  documentary_new: DocumentaryStatus | null
  old_value: string | null
  new_value: string | null
  changed_by: string
  changed_by_name: string
  changed_at: string
  remarks: string | null
}

export interface DashboardStats {
  total_transactions: number
  pending: number
  in_progress: number
  completed: number
  compliant: number
  non_compliant: number
  pending_computation: number
  sla_breach_count: number
  compliance_rate: number
}
