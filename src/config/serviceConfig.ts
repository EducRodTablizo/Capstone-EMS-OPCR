export type ServiceFieldType = 'text' | 'textarea' | 'date' | 'number' | 'select' | 'checkboxGroup'

export interface ServiceFieldOption {
  label: string
  value: string
}

export interface ServiceField {
  name: string
  label: string
  type: ServiceFieldType
  placeholder?: string
  required?: boolean
  options?: ServiceFieldOption[]
}

export interface ServiceDocumentationItem {
  name: string
  label: string
}

export interface ServiceClientRequirements {
  studentNumber?: boolean
  course?: boolean
  yearLevel?: boolean
  organization?: boolean
}

export interface ServiceConfig {
  key: string
  name: string
  displayName: string
  category: string
  slaTarget: number
  clientRequirements?: ServiceClientRequirements
  fields: ServiceField[]
  documentation?: ServiceDocumentationItem[]
}

export const SERVICE_CONFIG: Record<string, ServiceConfig> = {
  GOOD_MORAL: {
    key: 'GOOD_MORAL',
    name: 'Issuance of Good Moral Certificate',
    displayName: 'Good Moral Certificate',
    category: 'Good Moral',
    slaTarget: 12,
    clientRequirements: { studentNumber: true, course: true, yearLevel: true },
    fields: [
      {
        name: 'purposeOfRequest',
        label: 'Purpose of Request',
        type: 'text',
        placeholder: 'e.g., Job Application, Scholarship',
        required: true,
      },
      {
        name: 'claimDate',
        label: 'Claim Date',
        type: 'date',
        required: true,
      },
      {
        name: 'numberOfCopies',
        label: 'Number of Copies',
        type: 'number',
        placeholder: '1',
        required: true,
      },
    ],
    documentation: [
      { name: 'studentID', label: 'Valid Student ID' },
      { name: 'enrollmentForm', label: 'Enrollment Form / Registration Form' },
      { name: 'clearance', label: 'Clearance (if required)' },
    ],
  },
  ID_REPLACEMENT: {
    key: 'ID_REPLACEMENT',
    name: 'ID Replacement',
    displayName: 'ID Replacement',
    category: 'ID Services',
    slaTarget: 24,
    clientRequirements: { studentNumber: true, course: true, yearLevel: true },
    fields: [
      {
        name: 'reasonForReplacement',
        label: 'Reason for Replacement',
        type: 'textarea',
        required: true,
      },
      {
        name: 'oldIDAvailable',
        label: 'Old ID Available',
        type: 'select',
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
        required: true,
      },
      {
        name: 'temporaryIDNeeded',
        label: 'Temporary ID Needed',
        type: 'select',
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
        required: true,
      },
    ],
  },
  STUDENT_DEVELOPMENT_PERMISSION: {
    key: 'STUDENT_DEVELOPMENT_PERMISSION',
    name: 'Student Development Permission',
    displayName: 'Student Development Permission',
    category: 'Activity Permit',
    slaTarget: 7,
    clientRequirements: { studentNumber: true, course: true, yearLevel: true },
    fields: [
      {
        name: 'eventName',
        label: 'Activity Name',
        type: 'text',
        required: true,
      },
      {
        name: 'dateRequested',
        label: 'Date Requested',
        type: 'date',
        required: true,
      },
      {
        name: 'requestedBy',
        label: 'Requested By',
        type: 'text',
        required: true,
      },
      {
        name: 'approvalRequired',
        label: 'Approval Required',
        type: 'select',
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
        required: true,
      },
    ],
  },
  FUNDRAISING: {
    key: 'FUNDRAISING',
    name: 'Fundraising',
    displayName: 'Fundraising',
    category: 'Activity Permit',
    slaTarget: 24,
    clientRequirements: { studentNumber: true, course: true, yearLevel: true },
    fields: [
      {
        name: 'eventName',
        label: 'Fundraising Activity',
        type: 'text',
        required: true,
      },
      {
        name: 'fundraisingType',
        label: 'Fundraising Type',
        type: 'text',
        required: true,
      },
      {
        name: 'estimatedAmount',
        label: 'Estimated Amount',
        type: 'number',
        placeholder: '0',
        required: true,
      },
    ],
  },
  ON_CAMPUS_ACTIVITY: {
    key: 'ON_CAMPUS_ACTIVITY',
    name: 'On-Campus Activity',
    displayName: 'On-Campus Activity',
    category: 'Activity Permit',
    slaTarget: 75,
    clientRequirements: { studentNumber: true, course: true, yearLevel: true },
    fields: [
      {
        name: 'facilityRequested',
        label: 'Facility Requested',
        type: 'text',
        required: true,
      },
      {
        name: 'eventName',
        label: 'Event Name',
        type: 'text',
        required: true,
      },
      {
        name: 'dateRequested',
        label: 'Date Requested',
        type: 'date',
        required: true,
      },
      {
        name: 'timeSlot',
        label: 'Time Slot',
        type: 'text',
        required: true,
      },
      {
        name: 'participantsCount',
        label: 'Participants Count',
        type: 'number',
        placeholder: '0',
        required: true,
      },
    ],
  },
  OFF_CAMPUS_ACTIVITY: {
    key: 'OFF_CAMPUS_ACTIVITY',
    name: 'Off-Campus Activity',
    displayName: 'Off-Campus Activity',
    category: 'Activity Permit',
    slaTarget: 75,
    clientRequirements: { studentNumber: true, course: true, yearLevel: true },
    fields: [
      {
        name: 'eventName',
        label: 'Activity Name',
        type: 'text',
        required: true,
      },
      {
        name: 'destination',
        label: 'Destination',
        type: 'text',
        required: true,
      },
      {
        name: 'dateRequested',
        label: 'Date Requested',
        type: 'date',
        required: true,
      },
      {
        name: 'expectedReturnTime',
        label: 'Expected Return Time',
        type: 'text',
        required: true,
      },
    ],
  },
  STUDENT_MEDAL_REQUEST: {
    key: 'STUDENT_MEDAL_REQUEST',
    name: 'Student Medal Request',
    displayName: 'Student Medal Request',
    category: 'Administrative',
    slaTarget: 25,
    clientRequirements: { studentNumber: true, course: true, yearLevel: true },
    fields: [
      {
        name: 'medalType',
        label: 'Medal Type',
        type: 'text',
        required: true,
      },
      {
        name: 'achievementDetails',
        label: 'Achievement Details',
        type: 'textarea',
        required: true,
      },
      {
        name: 'purposeOfRequest',
        label: 'Purpose of Request',
        type: 'text',
        required: true,
      },
    ],
  },
  NEW_ID_APPLICATION: {
    key: 'NEW_ID_APPLICATION',
    name: 'New ID Application',
    displayName: 'New ID Application',
    category: 'ID Services',
    slaTarget: 2873,
    clientRequirements: { studentNumber: true, course: true, yearLevel: true },
    fields: [
      {
        name: 'purposeOfRequest',
        label: 'Purpose of Request',
        type: 'text',
        required: true,
      },
      {
        name: 'numberOfCopies',
        label: 'Number of Copies',
        type: 'number',
        placeholder: '1',
        required: true,
      },
    ],
  },
  FACILITY_RESERVATION: {
    key: 'FACILITY_RESERVATION',
    name: 'Facility Reservation Request',
    displayName: 'Facility Reservation Request',
    category: 'Administrative',
    slaTarget: 12,
    fields: [
      {
        name: 'facilityRequested',
        label: 'Facility Requested',
        type: 'text',
        required: true,
      },
      {
        name: 'eventName',
        label: 'Event Name',
        type: 'text',
        required: true,
      },
      {
        name: 'dateRequested',
        label: 'Date Requested',
        type: 'date',
        required: true,
      },
      {
        name: 'timeSlot',
        label: 'Time Slot',
        type: 'text',
        required: true,
      },
      {
        name: 'participantsCount',
        label: 'Participants Count',
        type: 'number',
        placeholder: '0',
        required: true,
      },
    ],
  },
  NON_EMERGENCY_MEDICAL: {
    key: 'NON_EMERGENCY_MEDICAL',
    name: 'Non-Emergency Medical Consultation (New Patient)',
    displayName: 'Non-Emergency Medical Consultation (New Patient)',
    category: 'Medical',
    slaTarget: 30,
    fields: [
      {
        name: 'chiefComplaint',
        label: 'Chief Complaint',
        type: 'text',
        required: true,
      },
      {
        name: 'symptoms',
        label: 'Symptoms',
        type: 'textarea',
        required: true,
      },
      {
        name: 'referredBy',
        label: 'Referred By',
        type: 'text',
      },
      {
        name: 'patientType',
        label: 'Patient Type',
        type: 'select',
        required: true,
        options: [
          { label: 'Student', value: 'Student' },
          { label: 'Dependent', value: 'Dependent' },
          { label: 'Visitor', value: 'Visitor' },
        ],
      },
      {
        name: 'medicalHistory',
        label: 'Medical History',
        type: 'textarea',
      },
    ],
  },
  EMERGENCY_WITH_REFERRAL: {
    key: 'EMERGENCY_WITH_REFERRAL',
    name: 'Emergency Medical Consultation — WITH REFERRAL',
    displayName: 'Emergency Medical Consultation — WITH REFERRAL',
    category: 'Medical',
    slaTarget: 22,
    fields: [
      {
        name: 'referralSource',
        label: 'Referral Source',
        type: 'text',
        required: true,
      },
      {
        name: 'emergencyLevel',
        label: 'Emergency Level',
        type: 'select',
        required: true,
        options: [
          { label: 'Minor', value: 'Minor' },
          { label: 'Moderate', value: 'Moderate' },
          { label: 'Major', value: 'Major' },
        ],
      },
      {
        name: 'conditionDescription',
        label: 'Condition Description',
        type: 'textarea',
        required: true,
      },
      {
        name: 'referredHospital',
        label: 'Referred Hospital',
        type: 'text',
        required: true,
      },
    ],
  },
  MEDICAL_CERTIFICATE: {
    key: 'MEDICAL_CERTIFICATE',
    name: 'Medical Certificate — Sick Note / Excuse Slip',
    displayName: 'Medical Certificate — Sick Note / Excuse Slip',
    category: 'Medical',
    slaTarget: 8,
    fields: [
      {
        name: 'illnessReason',
        label: 'Illness / Reason',
        type: 'text',
        required: true,
      },
      {
        name: 'daysExcused',
        label: 'Days Excused',
        type: 'number',
        placeholder: '0',
        required: true,
      },
      {
        name: 'certificatePurpose',
        label: 'Certificate Purpose',
        type: 'text',
        required: true,
      },
    ],
  },
  MEDICAL_CLEARANCE_ENROLLMENT: {
    key: 'MEDICAL_CLEARANCE_ENROLLMENT',
    name: 'Medical Clearance for Enrollment (Normal)',
    displayName: 'Medical Clearance for Enrollment (Normal)',
    category: 'Medical',
    slaTarget: 15,
    clientRequirements: { studentNumber: true, course: true, yearLevel: true },
    fields: [
      {
        name: 'clearanceType',
        label: 'Clearance Type',
        type: 'select',
        required: true,
        options: [
          { label: 'Enrollment Clearance', value: 'enrollment_clearance' },
          { label: 'OJT Clearance', value: 'ojt_clearance' },
          { label: 'Graduation Clearance', value: 'graduation_clearance' },
        ],
      },
      {
        name: 'purpose',
        label: 'Purpose',
        type: 'text',
        required: false,
        placeholder: 'e.g. School enrollment requirements',
      },
    ],
  },
}

export const SERVICE_CONFIG_BY_NAME: Record<string, ServiceConfig> = Object.fromEntries(
  Object.values(SERVICE_CONFIG).map((config) => [config.name, config]),
)

export function getServiceConfigByName(name: string): ServiceConfig | undefined {
  return SERVICE_CONFIG_BY_NAME[name]
}

export const SERVICE_CONFIG_LIST = Object.values(SERVICE_CONFIG)
