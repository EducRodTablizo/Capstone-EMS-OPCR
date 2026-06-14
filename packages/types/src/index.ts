// ─── Shared Types — mirrors src/types/index.ts ───────────────────────────────
// Used by all NestJS microservices via packages/types

export type UserRole = 'subsystem_admin' | 'staff' | 'opcr_evaluator'
export type OfficeCode = 'ADMIN_OFFICE' | 'ACADEMIC_OFFICE' | 'OSAS'
export type TransactionStatus = 'pending' | 'in_progress' | 'completed'
export type DocumentaryStatus = 'complete' | 'incomplete' | 'for_compliance'
export type SlaStatus = 'compliant' | 'non_compliant' | 'pending_computation'
export type ActionType =
  | 'CREATE'
  | 'STATUS_CHANGE'
  | 'ASSIGNMENT'
  | 'DOCUMENTARY_CHANGE'
  | 'REMARKS_UPDATE'

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
