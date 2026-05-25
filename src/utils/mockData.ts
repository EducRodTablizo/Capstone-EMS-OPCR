import type { User, Office, Service, Transaction, TransactionStatusHistory } from '@/types'
import { parseSlaToSeconds } from './timeUtils'

// ─── Offices ─────────────────────────────────────────────────────────────────

export const OFFICES: Office[] = [
  { id: 'off-1', name: 'Administrative Office', code: 'ADMIN_OFFICE' },
  { id: 'off-2', name: 'Academic Office', code: 'ACADEMIC_OFFICE' },
  { id: 'off-3', name: 'Office of Student Affairs and Services', code: 'OSAS' },
]

// ─── Users (mock ARMS-synced) ─────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  // Administrative Office
  {
    id: 'usr-1', name: 'Maria Santos', email: 'msantos@pup.edu.ph',
    role: 'subsystem_admin', office_id: 'off-1', office_code: 'ADMIN_OFFICE',
    office_name: 'Administrative Office', is_active: true, created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-2', name: 'Jose Reyes', email: 'jreyes@pup.edu.ph',
    role: 'staff', office_id: 'off-1', office_code: 'ADMIN_OFFICE',
    office_name: 'Administrative Office', is_active: true, created_at: '2026-01-02T00:00:00Z',
  },
  {
    id: 'usr-3', name: 'Ana Cruz', email: 'acruz@pup.edu.ph',
    role: 'staff', office_id: 'off-1', office_code: 'ADMIN_OFFICE',
    office_name: 'Administrative Office', is_active: true, created_at: '2026-01-03T00:00:00Z',
  },
  // Academic Office
  {
    id: 'usr-4', name: 'Ramon Dela Cruz', email: 'rdelacruz@pup.edu.ph',
    role: 'subsystem_admin', office_id: 'off-2', office_code: 'ACADEMIC_OFFICE',
    office_name: 'Academic Office', is_active: true, created_at: '2026-01-04T00:00:00Z',
  },
  {
    id: 'usr-5', name: 'Lucia Gonzales', email: 'lgonzales@pup.edu.ph',
    role: 'staff', office_id: 'off-2', office_code: 'ACADEMIC_OFFICE',
    office_name: 'Academic Office', is_active: true, created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'usr-6', name: 'Paolo Ramos', email: 'pramos@pup.edu.ph',
    role: 'staff', office_id: 'off-2', office_code: 'ACADEMIC_OFFICE',
    office_name: 'Academic Office', is_active: true, created_at: '2026-01-06T00:00:00Z',
  },
  // OSAS
  {
    id: 'usr-7', name: 'Elena Bautista', email: 'ebautista@pup.edu.ph',
    role: 'subsystem_admin', office_id: 'off-3', office_code: 'OSAS',
    office_name: 'OSAS', is_active: true, created_at: '2026-01-07T00:00:00Z',
  },
  {
    id: 'usr-8', name: 'Marco Flores', email: 'mflores@pup.edu.ph',
    role: 'staff', office_id: 'off-3', office_code: 'OSAS',
    office_name: 'OSAS', is_active: true, created_at: '2026-01-08T00:00:00Z',
  },
  // OPCR Evaluator (cross-office)
  {
    id: 'usr-9', name: 'Dr. Ricardo Lim', email: 'rlim@pup.edu.ph',
    role: 'opcr_evaluator', office_id: 'off-1', office_code: 'ADMIN_OFFICE',
    office_name: 'Administrative Office', is_active: true, created_at: '2026-01-09T00:00:00Z',
  },
]

// Mock credentials for demo login
export const MOCK_CREDENTIALS: Record<string, { password: string; userId: string }> = {
  'msantos@pup.edu.ph': { password: 'admin123', userId: 'usr-1' },
  'jreyes@pup.edu.ph': { password: 'staff123', userId: 'usr-2' },
  'rdela@pup.edu.ph': { password: 'admin123', userId: 'usr-4' },
  'lgonzales@pup.edu.ph': { password: 'staff123', userId: 'usr-5' },
  'ebautista@pup.edu.ph': { password: 'admin123', userId: 'usr-7' },
  'mflores@pup.edu.ph': { password: 'staff123', userId: 'usr-8' },
  'rlim@pup.edu.ph': { password: 'opcr123', userId: 'usr-9' },
  // convenience aliases
  'admin@ems.ph': { password: 'admin123', userId: 'usr-1' },
  'staff@ems.ph': { password: 'staff123', userId: 'usr-2' },
  'opcr@ems.ph': { password: 'opcr123', userId: 'usr-9' },
}

// ─── Services (from OPCR SLA CSV) ────────────────────────────────────────────

const svc = (
  id: string,
  name: string,
  category: string,
  clientType: string,
  officeId: string,
  officeCode: string,
  slaDisplay: string,
): Service => ({
  id,
  name,
  category: category as Service['category'],
  client_type: clientType,
  office_id: officeId,
  office_code: officeCode as Service['office_code'],
  sla_target_seconds: parseSlaToSeconds(slaDisplay),
  sla_display: slaDisplay,
  is_active: true,
})

export const MOCK_SERVICES: Service[] = [
  // Administrative Office – Medical
  svc('svc-1', 'Emergency Medical Consultation — WITH REFERRAL', 'Medical', 'Student', 'off-1', 'ADMIN_OFFICE', '22 min'),
  svc('svc-2', 'Emergency Medical Consultation — WITHOUT REFERRAL', 'Medical', 'Student', 'off-1', 'ADMIN_OFFICE', '18 min'),
  svc('svc-3', 'Non-Emergency Medical Consultation (New Patient)', 'Medical', 'Student & Dependents', 'off-1', 'ADMIN_OFFICE', '30 min'),
  svc('svc-4', 'Non-Emergency Medical Consultation (Follow-up)', 'Medical', 'Student & Dependents', 'off-1', 'ADMIN_OFFICE', '28 min'),
  svc('svc-5', 'Medical Certificate — Sick Note / Excuse Slip', 'Medical', 'Student', 'off-1', 'ADMIN_OFFICE', '8 min'),
  svc('svc-6', 'Medical Clearance for Enrollment (Normal)', 'Medical', 'Student', 'off-1', 'ADMIN_OFFICE', '15 min'),
  svc('svc-7', 'Medical Clearance for OJT — WITHOUT REFERRAL', 'Medical', 'Student', 'off-1', 'ADMIN_OFFICE', '12 min'),
  svc('svc-8', 'Annual Medical Clearance — WITHOUT REFERRAL', 'Medical', 'Faculty & Admin', 'off-1', 'ADMIN_OFFICE', '12 min'),
  // Administrative Office – Dental
  svc('svc-9', 'Emergency Dental Consultation — WITH REFERRAL', 'Dental', 'Faculty & Admin', 'off-1', 'ADMIN_OFFICE', '13 min'),
  svc('svc-10', 'Non-Emergency Dental Consultation (New Patient)', 'Dental', 'Student', 'off-1', 'ADMIN_OFFICE', '31 min'),
  svc('svc-11', 'Dental Clearance — WITHOUT REFERRAL', 'Dental', 'Student', 'off-1', 'ADMIN_OFFICE', '9 min'),
  // Administrative Office – Admin
  svc('svc-12', 'Campus Equipment / Materials Borrowing', 'Administrative', 'General', 'off-1', 'ADMIN_OFFICE', '15 min'),
  svc('svc-13', 'Facility Reservation Request', 'Administrative', 'General', 'off-1', 'ADMIN_OFFICE', '12 min'),
  svc('svc-14', 'Permission to Conduct an Activity (Activity Permit)', 'Administrative', 'General', 'off-1', 'ADMIN_OFFICE', '7 min'),
  svc('svc-15', 'Library Circulation (Borrowing of Library Materials)', 'Administrative', 'General', 'off-1', 'ADMIN_OFFICE', '2 min'),
  svc('svc-16', 'Academic Verification Service', 'Administrative', 'General', 'off-1', 'ADMIN_OFFICE', '2 days, 1 hr, 50 min'),
  svc('svc-17', 'Re-Admission Processing (Returning Students)', 'Administrative', 'Student', 'off-1', 'ADMIN_OFFICE', '2 days, 7 hrs, 53 min'),
  // Academic Office
  svc('svc-18', 'Processing of Application for Change of Enrollment', 'Enrollment', 'Student', 'off-2', 'ACADEMIC_OFFICE', '18 min'),
  svc('svc-19', 'Processing of Application for Cross-Enrollment', 'Enrollment', 'Student', 'off-2', 'ACADEMIC_OFFICE', '10 min'),
  svc('svc-20', 'Processing of Manual Enrollment', 'Enrollment', 'Student', 'off-2', 'ACADEMIC_OFFICE', '2 days, 6 hrs, 30 min'),
  svc('svc-21', 'Processing of Application for Overload of Subjects', 'Enrollment', 'Student', 'off-2', 'ACADEMIC_OFFICE', '7 min'),
  svc('svc-22', 'Processing of Application for Shifting', 'Grade & Records', 'Student', 'off-2', 'ACADEMIC_OFFICE', '27 min'),
  svc('svc-23', 'Processing of Request for Certification (Grades, GWA)', 'Grade & Records', 'Student', 'off-2', 'ACADEMIC_OFFICE', '37 min'),
  svc('svc-24', 'Processing of Course Accreditation (Transferees)', 'Accreditation', 'Student (Transferee)', 'off-2', 'ACADEMIC_OFFICE', '1 day, 5 hrs, 30 min'),
  // OSAS
  svc('svc-25', 'Application for New Identification Card', 'ID Services', 'Student', 'off-3', 'OSAS', '2 days, 23 min'),
  svc('svc-26', 'Application for Replacement of Lost Identification Card', 'ID Services', 'Student', 'off-3', 'OSAS', '2 days, 23 min'),
  svc('svc-27', 'Consultation Service', 'Consultation', 'Student', 'off-3', 'OSAS', '28 min'),
  svc('svc-28', 'Counseling Service', 'Counseling', 'Student', 'off-3', 'OSAS', '44 min'),
  svc('svc-29', 'Issuance of Recommendation Letter', 'Recommendation', 'Student / Alumni', 'off-3', 'OSAS', '50 min'),
  svc('svc-30', 'Processing of Request for On-Campus Student Activities', 'Activity Permit', 'Student / Organization', 'off-3', 'OSAS', '1 hr, 15 min'),
  svc('svc-31', 'Processing of Application for Student Fund-Raising', 'Activity Permit', 'Student / Organization', 'off-3', 'OSAS', '6 days, 7 hrs, 5 min'),
  svc('svc-32', 'Processing of Request for Informative Copy of Grades', 'Records', 'Student', 'off-3', 'OSAS', '1 day, 1 hr, 18 min'),
  svc('svc-33', 'Request for Certificate of Good Moral Character', 'Good Moral', 'Student', 'off-3', 'OSAS', '12 min'),
  svc('svc-34', 'Issuance of Good Moral Certificate', 'Good Moral', 'Student', 'off-3', 'OSAS', '1 hr, 25 min'),
  svc('svc-35', 'Credentials Service (Transcript of Records)', 'Credentials', 'Student / Alumni', 'off-3', 'OSAS', '8 days, 5 hrs, 20 min'),
]

// ─── Sample Transactions ──────────────────────────────────────────────────────

const now = new Date()
const daysAgo = (d: number, h = 0) => new Date(now.getTime() - d * 86400000 - h * 3600000).toISOString()

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn-1', service_id: 'svc-1', service_name: 'Emergency Medical Consultation — WITH REFERRAL',
    service_category: 'Medical', office_id: 'off-1', office_name: 'Administrative Office',
    assigned_to: 'usr-2', assigned_to_name: 'Jose Reyes',
    created_by: 'usr-2', created_by_name: 'Jose Reyes',
    time_in: daysAgo(0, 2), time_out: daysAgo(0, 1.5),
    status: 'completed', documentary_status: 'complete',
    processing_time_seconds: 1860, sla_target_seconds: parseSlaToSeconds('22 min'),
    sla_status: 'non_compliant', is_sla_breached: true,
    client_name: 'Juan dela Torre', remarks: 'Referred to PGH',
    intake_data: null,
    created_at: daysAgo(0, 2), updated_at: daysAgo(0, 1.5),
  },
  {
    id: 'txn-2', service_id: 'svc-5', service_name: 'Medical Certificate — Sick Note / Excuse Slip',
    service_category: 'Medical', office_id: 'off-1', office_name: 'Administrative Office',
    assigned_to: 'usr-3', assigned_to_name: 'Ana Cruz',
    created_by: 'usr-2', created_by_name: 'Jose Reyes',
    time_in: daysAgo(0, 3), time_out: daysAgo(0, 2.9),
    status: 'completed', documentary_status: 'complete',
    processing_time_seconds: 360, sla_target_seconds: parseSlaToSeconds('8 min'),
    sla_status: 'compliant', is_sla_breached: false,
    client_name: 'Maria Gomez', remarks: null,
    intake_data: null,
    created_at: daysAgo(0, 3), updated_at: daysAgo(0, 2.9),
  },
  {
    id: 'txn-3', service_id: 'svc-3', service_name: 'Non-Emergency Medical Consultation (New Patient)',
    service_category: 'Medical', office_id: 'off-1', office_name: 'Administrative Office',
    assigned_to: 'usr-2', assigned_to_name: 'Jose Reyes',
    created_by: 'usr-2', created_by_name: 'Jose Reyes',
    time_in: daysAgo(0, 1), time_out: null,
    status: 'in_progress', documentary_status: 'complete',
    processing_time_seconds: null, sla_target_seconds: parseSlaToSeconds('30 min'),
    sla_status: 'pending_computation', is_sla_breached: false,
    client_name: 'Pedro Santos', remarks: null,
    intake_data: null,
    created_at: daysAgo(0, 1), updated_at: daysAgo(0, 0.5),
  },
  {
    id: 'txn-4', service_id: 'svc-13', service_name: 'Facility Reservation Request',
    service_category: 'Administrative', office_id: 'off-1', office_name: 'Administrative Office',
    assigned_to: null, assigned_to_name: null,
    created_by: 'usr-1', created_by_name: 'Maria Santos',
    time_in: daysAgo(0, 0.5), time_out: null,
    status: 'pending', documentary_status: 'incomplete',
    processing_time_seconds: null, sla_target_seconds: parseSlaToSeconds('12 min'),
    sla_status: 'pending_computation', is_sla_breached: false,
    client_name: 'BSIT Student Council', remarks: 'Waiting for documentary requirements',
    intake_data: null,
    created_at: daysAgo(0, 0.5), updated_at: daysAgo(0, 0.5),
  },
  // Academic Office transactions
  {
    id: 'txn-5', service_id: 'svc-18', service_name: 'Processing of Application for Change of Enrollment',
    service_category: 'Enrollment', office_id: 'off-2', office_name: 'Academic Office',
    assigned_to: 'usr-5', assigned_to_name: 'Lucia Gonzales',
    created_by: 'usr-5', created_by_name: 'Lucia Gonzales',
    time_in: daysAgo(1, 4), time_out: daysAgo(1, 3.7),
    status: 'completed', documentary_status: 'complete',
    processing_time_seconds: 1080, sla_target_seconds: parseSlaToSeconds('18 min'),
    sla_status: 'compliant', is_sla_breached: false,
    client_name: 'Ana Villanueva', remarks: null,
    intake_data: null,
    created_at: daysAgo(1, 4), updated_at: daysAgo(1, 3.7),
  },
  {
    id: 'txn-6', service_id: 'svc-22', service_name: 'Processing of Application for Shifting',
    service_category: 'Grade & Records', office_id: 'off-2', office_name: 'Academic Office',
    assigned_to: 'usr-6', assigned_to_name: 'Paolo Ramos',
    created_by: 'usr-5', created_by_name: 'Lucia Gonzales',
    time_in: daysAgo(0, 2), time_out: null,
    status: 'in_progress', documentary_status: 'for_compliance',
    processing_time_seconds: null, sla_target_seconds: parseSlaToSeconds('27 min'),
    sla_status: 'pending_computation', is_sla_breached: false,
    client_name: 'Carlo Mendoza', remarks: 'Requirements submitted, pending dean approval',
    intake_data: null,
    created_at: daysAgo(0, 2), updated_at: daysAgo(0, 1),
  },
  // OSAS transactions
  {
    id: 'txn-7', service_id: 'svc-33', service_name: 'Request for Certificate of Good Moral Character',
    service_category: 'Good Moral', office_id: 'off-3', office_name: 'OSAS',
    assigned_to: 'usr-8', assigned_to_name: 'Marco Flores',
    created_by: 'usr-8', created_by_name: 'Marco Flores',
    time_in: daysAgo(0, 1), time_out: daysAgo(0, 0.9),
    status: 'completed', documentary_status: 'complete',
    processing_time_seconds: 660, sla_target_seconds: parseSlaToSeconds('12 min'),
    sla_status: 'non_compliant', is_sla_breached: true,
    client_name: 'Rosa Aquino', remarks: 'Student had to retrieve additional form',
    intake_data: null,
    created_at: daysAgo(0, 1), updated_at: daysAgo(0, 0.9),
  },
  {
    id: 'txn-8', service_id: 'svc-28', service_name: 'Counseling Service',
    service_category: 'Counseling', office_id: 'off-3', office_name: 'OSAS',
    assigned_to: 'usr-8', assigned_to_name: 'Marco Flores',
    created_by: 'usr-7', created_by_name: 'Elena Bautista',
    time_in: daysAgo(0, 0.3), time_out: null,
    status: 'pending', documentary_status: 'complete',
    processing_time_seconds: null, sla_target_seconds: parseSlaToSeconds('44 min'),
    sla_status: 'pending_computation', is_sla_breached: false,
    client_name: 'Andres Navarro', remarks: null,
    intake_data: null,
    created_at: daysAgo(0, 0.3), updated_at: daysAgo(0, 0.3),
  },
]

export const MOCK_HISTORY: TransactionStatusHistory[] = [
  {
    id: 'h-1', transaction_id: 'txn-1', old_status: null, new_status: 'pending',
    documentary_old: null, documentary_new: 'complete',
    changed_by: 'usr-2', changed_by_name: 'Jose Reyes',
    changed_at: daysAgo(0, 2), remarks: 'Transaction created',
  },
  {
    id: 'h-2', transaction_id: 'txn-1', old_status: 'pending', new_status: 'in_progress',
    documentary_old: 'complete', documentary_new: 'complete',
    changed_by: 'usr-2', changed_by_name: 'Jose Reyes',
    changed_at: daysAgo(0, 1.9), remarks: null,
  },
  {
    id: 'h-3', transaction_id: 'txn-1', old_status: 'in_progress', new_status: 'completed',
    documentary_old: 'complete', documentary_new: 'complete',
    changed_by: 'usr-2', changed_by_name: 'Jose Reyes',
    changed_at: daysAgo(0, 1.5), remarks: 'Referred to PGH',
  },
]
