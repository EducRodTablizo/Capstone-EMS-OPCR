export interface DocumentaryChecklistValue {
  studentID?: boolean
  enrollmentForm?: boolean
  clearance?: boolean
}

export interface ServiceSpecificData {
  documentaryCompliance?: DocumentaryChecklistValue
  [key: string]: unknown
}

export interface TransactionFormValues {
  service_id: string
  assigned_to: string
  client_type: 'Student' | 'Visitor' | 'Organization'
  client_name: string
  student_number: string
  course: string
  year_level: string
  contact_number: string
  organization: string
  remarks: string
  service_specific_data: ServiceSpecificData
}
