/**
 * Dynamic intake field schemas for all 35 OPCR services.
 * Each service maps to a set of required/optional fields that staff
 * must fill in when creating a transaction (EMS-004).
 *
 * The `client_name` top-level field is always present and NOT duplicated here.
 */

export type FieldType = 'text' | 'textarea' | 'select' | 'date' | 'number'

export interface IntakeField {
  key: string
  label: string
  type: FieldType
  required: boolean
  placeholder?: string
  options?: string[]
  helpText?: string
}

export interface ServiceIntakeSchema {
  title: string
  fields: IntakeField[]
}

// ── Reusable field presets ────────────────────────────────────────────────────

const F = {
  studentId: (): IntakeField => ({
    key: 'student_employee_id', label: 'Student / Employee ID',
    type: 'text', required: true, placeholder: 'e.g. 2020-12345-CM-0',
  }),
  program: (): IntakeField => ({
    key: 'program', label: 'Program / Course',
    type: 'text', required: false, placeholder: 'e.g. BSIT, BSCS',
  }),
  yearLevel: (): IntakeField => ({
    key: 'year_level', label: 'Year Level', type: 'select', required: false,
    options: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
  }),
  semester: (): IntakeField => ({
    key: 'semester', label: 'Semester', type: 'select', required: false,
    options: ['1st Semester', '2nd Semester', 'Summer'],
  }),
  schoolYear: (): IntakeField => ({
    key: 'school_year', label: 'School Year', type: 'text', required: false,
    placeholder: 'e.g. 2025-2026',
  }),
  purpose: (required = true): IntakeField => ({
    key: 'purpose', label: 'Purpose', type: 'text', required,
    placeholder: 'State purpose of request…',
  }),
  copies: (): IntakeField => ({
    key: 'copies', label: 'Number of Copies', type: 'number', required: false, placeholder: '1',
  }),
  chiefComplaint: (): IntakeField => ({
    key: 'chief_complaint', label: 'Chief Complaint', type: 'textarea', required: true,
    placeholder: 'Describe symptoms or reason for visit…',
  }),
  vitalsBP: (): IntakeField => ({
    key: 'vitals_bp', label: 'Blood Pressure (mmHg)', type: 'text', required: false,
    placeholder: 'e.g. 120/80',
  }),
  vitalsTemp: (): IntakeField => ({
    key: 'vitals_temp', label: 'Temperature (°C)', type: 'text', required: false,
    placeholder: 'e.g. 36.5',
  }),
  vitalsPulse: (): IntakeField => ({
    key: 'vitals_pulse', label: 'Pulse Rate (bpm)', type: 'text', required: false,
    placeholder: 'e.g. 72',
  }),
  allergies: (): IntakeField => ({
    key: 'allergies', label: 'Known Allergies / Medications', type: 'text', required: false,
    placeholder: 'None if not applicable',
  }),
  referralSource: (required = false): IntakeField => ({
    key: 'referral_source', label: 'Referral From', type: 'text', required,
    placeholder: 'e.g. Physician, referring physician…',
  }),
  dentalComplaint: (): IntakeField => ({
    key: 'dental_complaint', label: 'Dental Complaint', type: 'textarea', required: true,
    placeholder: 'Describe dental concern…',
  }),
  lastDentalVisit: (): IntakeField => ({
    key: 'last_dental_visit', label: 'Last Dental Visit', type: 'date', required: false,
  }),
  reason: (required = true): IntakeField => ({
    key: 'reason', label: 'Reason', type: 'textarea', required, placeholder: 'Explain reason…',
  }),
  organization: (): IntakeField => ({
    key: 'organization', label: 'Organization / Club', type: 'text', required: true,
    placeholder: 'e.g. BSIT Student Council',
  }),
  activityTitle: (): IntakeField => ({
    key: 'activity_title', label: 'Activity Title', type: 'text', required: true,
    placeholder: 'Name of the activity…',
  }),
  venue: (): IntakeField => ({
    key: 'venue', label: 'Venue', type: 'text', required: true,
    placeholder: 'e.g. PUP Gymnasium, AVR',
  }),
  activityDate: (): IntakeField => ({
    key: 'activity_date', label: 'Activity Date', type: 'date', required: true,
  }),
  expectedParticipants: (): IntakeField => ({
    key: 'expected_participants', label: 'Expected No. of Participants',
    type: 'number', required: false, placeholder: 'e.g. 50',
  }),
  facilityName: (): IntakeField => ({
    key: 'facility_name', label: 'Facility / Venue Name', type: 'text', required: true,
    placeholder: 'e.g. Audio-Visual Room, Gymnasium',
  }),
  eventDate: (): IntakeField => ({
    key: 'event_date', label: 'Event Date', type: 'date', required: true,
  }),
  timeStart: (): IntakeField => ({
    key: 'time_start', label: 'Start Time', type: 'text', required: true,
    placeholder: 'e.g. 8:00 AM',
  }),
  timeEnd: (): IntakeField => ({
    key: 'time_end', label: 'End Time', type: 'text', required: true,
    placeholder: 'e.g. 5:00 PM',
  }),
  returnDate: (): IntakeField => ({
    key: 'return_date', label: 'Expected Return Date', type: 'date', required: true,
  }),
  itemsRequested: (): IntakeField => ({
    key: 'items_requested', label: 'Items / Equipment to Borrow', type: 'textarea', required: true,
    placeholder: 'List items with quantities…',
  }),
  idReason: (): IntakeField => ({
    key: 'id_reason', label: 'Reason for Application', type: 'select', required: true,
    options: ['First Issuance', 'Lost ID', 'Damaged ID'],
  }),
  reportNumber: (): IntakeField => ({
    key: 'report_number', label: 'Police / Barangay Report No.', type: 'text', required: false,
    helpText: 'Required for Lost ID applications',
  }),
  addressee: (): IntakeField => ({
    key: 'addressee', label: 'Addressee / Recipient', type: 'text', required: false,
    placeholder: 'e.g. HR Dept., Scholarship Committee',
  }),
  letterType: (): IntakeField => ({
    key: 'letter_type', label: 'Type of Recommendation', type: 'select', required: true,
    options: ['Employment', 'Scholarship', 'Graduate School', 'Study Grant', 'Other'],
  }),
  natureOfConcern: (): IntakeField => ({
    key: 'nature_of_concern', label: 'Nature of Concern', type: 'textarea', required: true,
    placeholder: 'Briefly describe your concern…',
  }),
  fromProgram: (): IntakeField => ({
    key: 'from_program', label: 'Current Program', type: 'text', required: true,
    placeholder: 'e.g. BSIT',
  }),
  toProgram: (): IntakeField => ({
    key: 'to_program', label: 'Program to Shift Into', type: 'text', required: true,
    placeholder: 'e.g. BSCS',
  }),
  homeschool: (): IntakeField => ({
    key: 'home_school', label: 'Home School / University', type: 'text', required: true,
    placeholder: 'e.g. University of the Philippines',
  }),
  subjectCross: (): IntakeField => ({
    key: 'subject_to_enroll', label: 'Subject to Cross-Enroll', type: 'text', required: true,
    placeholder: 'Subject code and title…',
  }),
  subjectsDrop: (): IntakeField => ({
    key: 'subjects_to_drop', label: 'Subject(s) to Drop', type: 'textarea', required: true,
    placeholder: 'List subject codes, one per line…',
  }),
  subjectsAdd: (): IntakeField => ({
    key: 'subjects_to_add', label: 'Subject(s) to Add', type: 'textarea', required: true,
    placeholder: 'List subject codes, one per line…',
  }),
  prevSchool: (): IntakeField => ({
    key: 'previous_school', label: 'Previous School / Institution', type: 'text', required: true,
    placeholder: 'Previous institution name…',
  }),
  subjectsAccredit: (): IntakeField => ({
    key: 'subjects_to_accredit', label: 'Subjects for Accreditation', type: 'textarea', required: true,
    placeholder: 'List subject codes and descriptive titles…',
  }),
  fundRaisingType: (): IntakeField => ({
    key: 'fund_raising_type', label: 'Type of Fund-Raising', type: 'select', required: true,
    options: ['Ticket Sales', 'Solicitation', 'Food / Merchandise', 'Online Fund-Raising', 'Other'],
  }),
  yearGraduated: (): IntakeField => ({
    key: 'year_graduated', label: 'Year Graduated / Last Enrolled', type: 'text', required: false,
    placeholder: 'e.g. 2024',
  }),
  lastEnrolled: (): IntakeField => ({
    key: 'last_enrolled', label: 'Last Semester Enrolled', type: 'text', required: true,
    placeholder: 'e.g. 1st Sem 2023-2024',
  }),
  gwa: (required = false): IntakeField => ({
    key: 'gwa', label: 'General Weighted Average (GWA)', type: 'text', required,
    placeholder: 'e.g. 1.50',
  }),
}

// ── Service schemas keyed by service ID ──────────────────────────────────────

export const SERVICE_INTAKE_SCHEMAS: Record<string, ServiceIntakeSchema> = {

  // ── Administrative Office — Medical ────────────────────────────────────────

  'svc-1': {
    title: 'Emergency Medical Consultation (With Referral)',
    fields: [
      F.studentId(), F.chiefComplaint(),
      F.vitalsBP(), F.vitalsTemp(), F.vitalsPulse(),
      F.referralSource(true), F.allergies(),
    ],
  },
  'svc-2': {
    title: 'Emergency Medical Consultation (Without Referral)',
    fields: [
      F.studentId(), F.chiefComplaint(),
      F.vitalsBP(), F.vitalsTemp(), F.vitalsPulse(),
      F.allergies(),
    ],
  },
  'svc-3': {
    title: 'Non-Emergency Medical Consultation (New Patient)',
    fields: [
      F.studentId(), F.chiefComplaint(),
      F.vitalsBP(), F.vitalsTemp(), F.vitalsPulse(),
      F.allergies(),
    ],
  },
  'svc-4': {
    title: 'Non-Emergency Medical Consultation (Follow-up)',
    fields: [
      F.studentId(), F.chiefComplaint(),
      F.vitalsBP(), F.vitalsTemp(), F.vitalsPulse(),
      {
        key: 'previous_diagnosis', label: 'Previous Diagnosis / Medication',
        type: 'text', required: false, placeholder: 'State previous consultation result…',
      },
    ],
  },
  'svc-5': {
    title: 'Medical Certificate — Sick Note / Excuse Slip',
    fields: [
      F.studentId(), F.purpose(true),
      {
        key: 'absence_dates', label: 'Dates of Absence',
        type: 'text', required: true, placeholder: 'e.g. May 20–22, 2026',
      },
    ],
  },
  'svc-6': {
    title: 'Medical Clearance for Enrollment',
    fields: [F.studentId(), F.program(), F.yearLevel(), F.purpose(false)],
  },
  'svc-7': {
    title: 'Medical Clearance for OJT (Without Referral)',
    fields: [
      F.studentId(), F.program(),
      {
        key: 'ojt_company', label: 'OJT Company / Agency',
        type: 'text', required: true, placeholder: 'e.g. SM Prime Holdings, DOST',
      },
    ],
  },
  'svc-8': {
    title: 'Annual Medical Clearance (Without Referral)',
    fields: [
      F.studentId(),
      {
        key: 'department', label: 'Department / Position',
        type: 'text', required: true, placeholder: 'e.g. Faculty – BSIT Department',
      },
    ],
  },

  // ── Administrative Office — Dental ────────────────────────────────────────

  'svc-9': {
    title: 'Emergency Dental Consultation (With Referral)',
    fields: [F.studentId(), F.dentalComplaint(), F.referralSource(true), F.allergies()],
  },
  'svc-10': {
    title: 'Non-Emergency Dental Consultation (New Patient)',
    fields: [F.studentId(), F.dentalComplaint(), F.lastDentalVisit(), F.allergies()],
  },
  'svc-11': {
    title: 'Dental Clearance (Without Referral)',
    fields: [F.studentId(), F.purpose(true)],
  },

  // ── Administrative Office — Administrative ─────────────────────────────────

  'svc-12': {
    title: 'Campus Equipment / Materials Borrowing',
    fields: [
      F.itemsRequested(), F.purpose(true), F.returnDate(),
      {
        key: 'borrower_contact', label: 'Contact No.', type: 'text',
        required: false, placeholder: 'Mobile number…',
      },
    ],
  },
  'svc-13': {
    title: 'Facility Reservation Request',
    fields: [
      F.facilityName(), F.purpose(true), F.eventDate(),
      F.timeStart(), F.timeEnd(), F.expectedParticipants(),
    ],
  },
  'svc-14': {
    title: 'Permission to Conduct an Activity (Activity Permit)',
    fields: [
      F.organization(), F.activityTitle(), F.venue(),
      F.activityDate(), F.expectedParticipants(), F.purpose(true),
    ],
  },
  'svc-15': {
    title: 'Library Circulation (Borrowing of Library Materials)',
    fields: [
      F.studentId(), F.itemsRequested(),
      {
        key: 'due_date', label: 'Target Return Date', type: 'date', required: true,
      },
    ],
  },
  'svc-16': {
    title: 'Academic Verification Service',
    fields: [
      F.studentId(), F.program(), F.yearLevel(), F.purpose(true),
      {
        key: 'requesting_institution', label: 'Requesting Institution / Addressee',
        type: 'text', required: false, placeholder: 'e.g. CHED, TESDA, Employer',
      },
    ],
  },
  'svc-17': {
    title: 'Re-Admission Processing (Returning Students)',
    fields: [F.studentId(), F.program(), F.lastEnrolled(), F.reason(true)],
  },

  // ── Academic Office ────────────────────────────────────────────────────────

  'svc-18': {
    title: 'Application for Change of Enrollment',
    fields: [
      F.studentId(), F.program(), F.yearLevel(),
      F.semester(), F.schoolYear(),
      F.subjectsDrop(), F.subjectsAdd(), F.reason(true),
    ],
  },
  'svc-19': {
    title: 'Application for Cross-Enrollment',
    fields: [
      F.studentId(), F.program(), F.yearLevel(),
      F.homeschool(), F.subjectCross(), F.reason(true),
    ],
  },
  'svc-20': {
    title: 'Processing of Manual Enrollment',
    fields: [
      F.studentId(), F.program(), F.yearLevel(),
      F.semester(), F.schoolYear(), F.reason(true),
    ],
  },
  'svc-21': {
    title: 'Application for Overload of Subjects',
    fields: [
      F.studentId(), F.program(), F.yearLevel(),
      F.subjectsAdd(), F.gwa(true), F.reason(true),
    ],
  },
  'svc-22': {
    title: 'Application for Shifting',
    fields: [
      F.studentId(), F.fromProgram(), F.toProgram(),
      F.gwa(false), F.reason(true),
    ],
  },
  'svc-23': {
    title: 'Request for Certification (Grades / GWA)',
    fields: [
      F.studentId(), F.program(), F.yearLevel(),
      F.semester(), F.schoolYear(), F.purpose(true), F.copies(),
    ],
  },
  'svc-24': {
    title: 'Course Accreditation (Transferees)',
    fields: [F.studentId(), F.program(), F.prevSchool(), F.subjectsAccredit(), F.purpose(true)],
  },

  // ── OSAS ──────────────────────────────────────────────────────────────────

  'svc-25': {
    title: 'Application for New Identification Card',
    fields: [
      F.studentId(), F.program(), F.yearLevel(), F.idReason(),
      {
        key: 'photo_taken', label: 'ID Photo Already Taken?',
        type: 'select', required: false,
        options: ['Yes', 'No – will take on-site'],
      },
    ],
  },
  'svc-26': {
    title: 'Application for Replacement of Lost Identification Card',
    fields: [
      F.studentId(), F.program(), F.idReason(), F.reportNumber(),
      {
        key: 'affidavit', label: 'Affidavit of Loss Attached?',
        type: 'select', required: true,
        options: ['Yes', 'Not yet – will submit'],
      },
    ],
  },
  'svc-27': {
    title: 'Consultation Service',
    fields: [F.studentId(), F.program(), F.yearLevel(), F.natureOfConcern()],
  },
  'svc-28': {
    title: 'Counseling Service',
    fields: [
      F.studentId(), F.program(), F.yearLevel(), F.natureOfConcern(),
      {
        key: 'referred_by', label: 'Referred By', type: 'select', required: false,
        options: ['Self-referral', 'Faculty', 'Parent', 'Peer', 'Other'],
      },
    ],
  },
  'svc-29': {
    title: 'Issuance of Recommendation Letter',
    fields: [
      F.studentId(), F.program(), F.yearLevel(),
      F.letterType(), F.addressee(),
      {
        key: 'achievements', label: 'Notable Achievements / Involvements',
        type: 'textarea', required: false,
        placeholder: 'Extracurriculars, honors, org positions…',
      },
    ],
  },
  'svc-30': {
    title: 'Processing of On-Campus Student Activities',
    fields: [
      F.organization(), F.activityTitle(), F.venue(), F.activityDate(),
      F.timeStart(), F.timeEnd(), F.expectedParticipants(), F.purpose(true),
    ],
  },
  'svc-31': {
    title: 'Processing of Application for Student Fund-Raising',
    fields: [
      F.organization(), F.activityTitle(), F.fundRaisingType(),
      F.activityDate(), F.venue(), F.expectedParticipants(), F.purpose(true),
    ],
  },
  'svc-32': {
    title: 'Request for Informative Copy of Grades',
    fields: [
      F.studentId(), F.program(), F.yearLevel(),
      F.semester(), F.schoolYear(), F.purpose(true), F.copies(),
    ],
  },
  'svc-33': {
    title: 'Request for Certificate of Good Moral Character',
    fields: [F.studentId(), F.program(), F.yearLevel(), F.purpose(true), F.addressee(), F.copies()],
  },
  'svc-34': {
    title: 'Issuance of Good Moral Certificate',
    fields: [F.studentId(), F.program(), F.yearLevel(), F.purpose(true), F.addressee(), F.copies()],
  },
  'svc-35': {
    title: 'Credentials Service (Transcript of Records)',
    fields: [F.studentId(), F.program(), F.yearGraduated(), F.purpose(true), F.addressee(), F.copies()],
  },
}

export function getIntakeSchema(serviceId: string): ServiceIntakeSchema | null {
  return SERVICE_INTAKE_SCHEMAS[serviceId] ?? null
}
