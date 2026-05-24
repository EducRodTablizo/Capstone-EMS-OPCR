-- ============================================================
-- EMS SEED DATA — Sprint 1 & 2
-- Offices + Services (from OPCR Citizen Charter SLA CSV)
-- ============================================================

-- ─── Offices ─────────────────────────────────────────────────

INSERT INTO offices (id, name, code) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Administrative Office',                   'ADMIN_OFFICE'),
    ('00000000-0000-0000-0000-000000000002', 'Academic Office',                         'ACADEMIC_OFFICE'),
    ('00000000-0000-0000-0000-000000000003', 'Office of Student Affairs and Services',  'OSAS')
ON CONFLICT DO NOTHING;

-- ─── Services — Administrative Office ────────────────────────

INSERT INTO services (name, category, client_type, office_id, sla_target_seconds, sla_display) VALUES
-- Medical (Students)
('Emergency Medical Consultation — WITH REFERRAL',          'Medical', 'Student',             '00000000-0000-0000-0000-000000000001',  1320, '22 min'),
('Emergency Medical Consultation — WITHOUT REFERRAL',       'Medical', 'Student',             '00000000-0000-0000-0000-000000000001',  1080, '18 min'),
('Non-Emergency Medical Consultation (New Patient)',         'Medical', 'Student & Dependents','00000000-0000-0000-0000-000000000001',  1800, '30 min'),
('Non-Emergency Medical Consultation (Follow-up)',           'Medical', 'Student & Dependents','00000000-0000-0000-0000-000000000001',  1680, '28 min'),
('Follow-up of Students Referred During Enrollment',        'Medical', 'Student',             '00000000-0000-0000-0000-000000000001',  1620, '27 min'),
('Medical Clearance for Enrollment — WITH REFERRAL',        'Medical', 'Student',             '00000000-0000-0000-0000-000000000001',  1320, '22 min'),
('Medical Certificate — Sick Note / Excuse Slip (Consulted at PUP)', 'Medical', 'Student',   '00000000-0000-0000-0000-000000000001',   480, '8 min'),
('Medical Certificate — Sick Note / Excuse Slip (External)', 'Medical', 'Student',           '00000000-0000-0000-0000-000000000001',   300, '5 min'),
('Medical Clearance for Enrollment (Normal)',               'Medical', 'Student',             '00000000-0000-0000-0000-000000000001',   900, '15 min'),
('Medical Clearance for Food Handlers — WITH REFERRAL',     'Medical', 'Student',             '00000000-0000-0000-0000-000000000001',  1020, '17 min'),
('Medical Clearance for Food Handlers — WITHOUT REFERRAL',  'Medical', 'Student',             '00000000-0000-0000-0000-000000000001',   720, '12 min'),
('Medical Clearance for Off-Campus Activities — WITH REFERRAL','Medical','Student',           '00000000-0000-0000-0000-000000000001', 30600, '8 hrs 30 min'),
('Medical Clearance for Off-Campus Activities — WITHOUT REFERRAL','Medical','Student',        '00000000-0000-0000-0000-000000000001', 29580, '8 hrs 23 min'),
('Medical Clearance for OJT — WITH REFERRAL',              'Medical', 'Student',             '00000000-0000-0000-0000-000000000001',   840, '14 min'),
('Medical Clearance for OJT — WITHOUT REFERRAL',            'Medical', 'Student',             '00000000-0000-0000-0000-000000000001',   720, '12 min'),
-- Medical (Faculty & Admin)
('Emergency Medical Consultation — WITH REFERRAL (F&A)',   'Medical', 'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',   840, '14 min'),
('Emergency Medical Consultation — WITHOUT REFERRAL (F&A)','Medical', 'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',   600, '10 min'),
('Non-Emergency Medical Consultation New Patient (F&A)',   'Medical', 'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',  1200, '20 min'),
('Non-Emergency Medical Consultation Follow-up (F&A)',     'Medical', 'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',  1620, '27 min'),
('Annual Medical Clearance — WITH REFERRAL',               'Medical', 'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',   660, '11 min'),
('Annual Medical Clearance — WITHOUT REFERRAL',            'Medical', 'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',   720, '12 min'),
-- Dental (Faculty & Admin)
('Emergency Dental Consultation — WITH REFERRAL (F&A)',    'Dental',  'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',   780, '13 min'),
('Emergency Dental Consultation — WITHOUT REFERRAL (F&A)', 'Dental',  'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',   540, '9 min'),
('Non-Emergency Dental Consultation New Patient (F&A)',    'Dental',  'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',  1080, '18 min'),
('Non-Emergency Dental Consultation Follow-up (F&A)',      'Dental',  'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',  1200, '20 min'),
('Dental Clearance — WITH REFERRAL (F&A)',                 'Dental',  'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',   660, '11 min'),
('Dental Clearance — WITHOUT REFERRAL (F&A)',              'Dental',  'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',   540, '9 min'),
-- Dental (Students)
('Emergency Dental Consultation — WITH REFERRAL',          'Dental',  'Student',             '00000000-0000-0000-0000-000000000001',   960, '16 min'),
('Emergency Dental Consultation — WITHOUT REFERRAL',       'Dental',  'Student',             '00000000-0000-0000-0000-000000000001',   780, '13 min'),
('Non-Emergency Dental Consultation (New Patient)',         'Dental',  'Student',             '00000000-0000-0000-0000-000000000001',  1860, '31 min'),
('Non-Emergency Dental Consultation (Follow-up)',           'Dental',  'Student',             '00000000-0000-0000-0000-000000000001',  1680, '28 min'),
('Dental Clearance — WITH REFERRAL',                       'Dental',  'Student',             '00000000-0000-0000-0000-000000000001',   660, '11 min'),
('Dental Clearance — WITHOUT REFERRAL',                    'Dental',  'Student',             '00000000-0000-0000-0000-000000000001',   540, '9 min'),
-- Administrative (General/Student)
('Campus Equipment / Materials Borrowing',                  'Administrative','General',       '00000000-0000-0000-0000-000000000001',   900, '15 min'),
('Facility Reservation Request',                           'Administrative','General',       '00000000-0000-0000-0000-000000000001',   720, '12 min'),
('Permission to Conduct an Activity (Activity Permit)',     'Administrative','General',       '00000000-0000-0000-0000-000000000001',   420, '7 min'),
('Library Circulation (Borrowing of Library Materials)',    'Administrative','General',       '00000000-0000-0000-0000-000000000001',   120, '2 min'),
('Academic Verification Service',                          'Administrative','General',       '00000000-0000-0000-0000-000000000001',178200,'2 days, 1 hr, 50 min'),
('Re-Admission Processing (Returning Students)',            'Administrative','Student',       '00000000-0000-0000-0000-000000000001',252780,'2 days, 7 hrs, 53 min');

-- ─── Services — Academic Office ──────────────────────────────

INSERT INTO services (name, category, client_type, office_id, sla_target_seconds, sla_display) VALUES
('Processing of Application for Change of Enrollment (Adding of Subject)', 'Enrollment','Student','00000000-0000-0000-0000-000000000002', 1080,'18 min'),
('Processing of Application for Cross-Enrollment',         'Enrollment','Student',             '00000000-0000-0000-0000-000000000002',   600,'10 min'),
('Processing of Manual Enrollment',                        'Enrollment','Student',             '00000000-0000-0000-0000-000000000002',228600,'2 days, 6 hrs, 30 min'),
('Processing of Application for Overload of Subjects',     'Enrollment','Student',             '00000000-0000-0000-0000-000000000002',   420,'7 min'),
('Processing of Application for Change of Enrollment (Change of Schedule)', 'Enrollment','Student','00000000-0000-0000-0000-000000000002',234000,'2 days, 7 hrs'),
('Processing of Application for Correction of Grade Entry','Grade & Records','Student',        '00000000-0000-0000-0000-000000000002',228480,'2 days, 6 hrs, 38 min'),
('Processing of Application for Shifting',                 'Grade & Records','Student',        '00000000-0000-0000-0000-000000000002',  1620,'27 min'),
('Processing of Online Petition of Subject',               'Grade & Records','Student',        '00000000-0000-0000-0000-000000000002', 94800,'1 day, 2 hrs, 20 min'),
('Processing of Online Request for Tutorial of Subject',   'Grade & Records','Student',        '00000000-0000-0000-0000-000000000002', 94800,'1 day, 2 hrs, 20 min'),
('Processing of Request for Certification (Grades, GWA)',  'Grade & Records','Student',        '00000000-0000-0000-0000-000000000002',  2220,'37 min'),
('Processing of Request for Correction of Name per PSA',   'Grade & Records','Student',        '00000000-0000-0000-0000-000000000002',552060,'6 days, 7 hrs, 1 min'),
('Processing of Course Accreditation — SHS to Bridge',     'Accreditation','Student',          '00000000-0000-0000-0000-000000000002',120720,'1 day, 5 hrs, 42 min'),
('Processing of Course Accreditation (Transferees)',        'Accreditation','Student (Transferee)','00000000-0000-0000-0000-000000000002',119800,'1 day, 5 hrs, 30 min');

-- ─── Services — OSAS ─────────────────────────────────────────

INSERT INTO services (name, category, client_type, office_id, sla_target_seconds, sla_display) VALUES
('Application for New Identification Card',                'ID Services','Student',            '00000000-0000-0000-0000-000000000003',173180,'2 days, 23 min'),
('Application for Replacement of Lost Identification Card','ID Services','Student',            '00000000-0000-0000-0000-000000000003',173180,'2 days, 23 min'),
('Issuance of Lost and Replacement of Identification Card','ID Services','Student',            '00000000-0000-0000-0000-000000000003',  8100,'2 hrs, 15 min'),
('Consultation Service',                                   'Consultation','Student',           '00000000-0000-0000-0000-000000000003',  1680,'28 min'),
('Counseling Service',                                     'Counseling','Student',             '00000000-0000-0000-0000-000000000003',  2640,'44 min'),
('Issuance of Recommendation Letter',                      'Recommendation','Student / Alumni','00000000-0000-0000-0000-000000000003',  3000,'50 min'),
('Issuance of Student/Alumni Referral and Recommendation', 'Recommendation','Student / Alumni','00000000-0000-0000-0000-000000000003',  3180,'53 min'),
('Permission to Conduct an Activity (OSAS)',               'Activity Permit','Student / Organization','00000000-0000-0000-0000-000000000003', 420,'7 min'),
('Processing of Request for On-Campus Student Activities', 'Activity Permit','Student / Organization','00000000-0000-0000-0000-000000000003', 4500,'1 hr, 15 min'),
('Processing of Student Application for Off-Campus Activities','Activity Permit','Student / Organization','00000000-0000-0000-0000-000000000003',449100,'5 days, 3 hrs, 25 min'),
('Processing of Application for Student Fund-Raising',     'Activity Permit','Student / Organization','00000000-0000-0000-0000-000000000003',551280,'6 days, 7 hrs, 5 min'),
('Issuance of Permission — Student Dev. Center NOT Available', 'Activity Permit','Student / Organization','00000000-0000-0000-0000-000000000003', 3900,'1 hr, 5 min'),
('Issuance of Permission — Student Dev. Center Available', 'Activity Permit','Student / Organization','00000000-0000-0000-0000-000000000003', 3300,'55 min'),
('Processing of Request for Academic Verification Service','Verification','Student / Alumni',  '00000000-0000-0000-0000-000000000003',172620,'2 days, 57 min'),
('Processing of Request for Application for Graduation',   'Records','Student',               '00000000-0000-0000-0000-000000000003',180780,'2 days, 2 hrs, 33 min'),
('Processing of Request for Informative Copy of Grades',   'Records','Student',               '00000000-0000-0000-0000-000000000003', 90480,'1 day, 1 hr, 18 min'),
('Processing of Request for Leave of Absence',             'Records','Student',               '00000000-0000-0000-0000-000000000003',228360,'2 days, 6 hrs, 29 min'),
('Processing for Re-Admission (Returning Students)',        'Records','Student',               '00000000-0000-0000-0000-000000000003',229260,'2 days, 6 hrs, 41 min'),
('Processing of Request for Correction of Name (OSAS)',    'Grade & Records','Student',       '00000000-0000-0000-0000-000000000003',552060,'6 days, 7 hrs, 1 min'),
('Credentials Service (Course/Subject Description)',        'Credentials','Student / Alumni',  '00000000-0000-0000-0000-000000000003',299020,'3 days, 3 hrs, 43 min'),
('Credentials Service (Certificates of Attendance, etc.)', 'Credentials','Student / Alumni',  '00000000-0000-0000-0000-000000000003',299020,'3 days, 3 hrs, 43 min'),
('Credentials Service (CAV / APOSTILLE)',                  'Credentials','Student / Alumni',  '00000000-0000-0000-0000-000000000003',239800,'2 days, 7 hrs, 10 min'),
('Credentials Service (Transcript of Records)',            'Credentials','Student / Alumni',  '00000000-0000-0000-0000-000000000003',714200,'8 days, 5 hrs, 20 min'),
('Request for Certificate of Good Moral Character',        'Good Moral','Student',            '00000000-0000-0000-0000-000000000003',   720,'12 min'),
('Issuance of Good Moral Certificate',                     'Good Moral','Student',            '00000000-0000-0000-0000-000000000003',  5100,'1 hr, 25 min');

-- ─── Demo Users (for development) ────────────────────────────
-- In production, users are synced from ARMS via JWT

INSERT INTO users (id, name, email, role, office_id) VALUES
('11000000-0000-0000-0000-000000000001', 'Maria Santos',    'msantos@pup.edu.ph',    'subsystem_admin', '00000000-0000-0000-0000-000000000001'),
('11000000-0000-0000-0000-000000000002', 'Jose Reyes',      'jreyes@pup.edu.ph',     'staff',           '00000000-0000-0000-0000-000000000001'),
('11000000-0000-0000-0000-000000000003', 'Ana Cruz',        'acruz@pup.edu.ph',      'staff',           '00000000-0000-0000-0000-000000000001'),
('11000000-0000-0000-0000-000000000004', 'Ramon Dela Cruz', 'rdelacruz@pup.edu.ph',  'subsystem_admin', '00000000-0000-0000-0000-000000000002'),
('11000000-0000-0000-0000-000000000005', 'Lucia Gonzales',  'lgonzales@pup.edu.ph',  'staff',           '00000000-0000-0000-0000-000000000002'),
('11000000-0000-0000-0000-000000000006', 'Paolo Ramos',     'pramos@pup.edu.ph',     'staff',           '00000000-0000-0000-0000-000000000002'),
('11000000-0000-0000-0000-000000000007', 'Elena Bautista',  'ebautista@pup.edu.ph',  'subsystem_admin', '00000000-0000-0000-0000-000000000003'),
('11000000-0000-0000-0000-000000000008', 'Marco Flores',    'mflores@pup.edu.ph',    'staff',           '00000000-0000-0000-0000-000000000003'),
('11000000-0000-0000-0000-000000000009', 'Dr. Ricardo Lim', 'rlim@pup.edu.ph',       'opcr_evaluator',  '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;
