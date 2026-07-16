CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgres_fdw";

CREATE TYPE office_code AS ENUM ('ADMIN_OFFICE', 'ACADEMIC_OFFICE', 'OSAS');
CREATE TYPE user_role AS ENUM ('subsystem_admin', 'staff', 'opcr_evaluator');
CREATE TYPE transaction_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE documentary_status AS ENUM ('complete', 'incomplete', 'for_compliance');
CREATE TYPE sla_status AS ENUM ('compliant', 'non_compliant', 'pending_computation');

CREATE SERVER identity_server
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host 'postgres-identity', port '5432', dbname 'ems_identity');

CREATE USER MAPPING FOR ems_user
    SERVER identity_server
    OPTIONS (user 'ems_user', password 'ems_pass');

CREATE FOREIGN TABLE offices (
    id          UUID NOT NULL,
    name        VARCHAR(150) NOT NULL,
    code        office_code NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL
) SERVER identity_server OPTIONS (schema_name 'public', table_name 'offices');

CREATE FOREIGN TABLE users (
    id          UUID NOT NULL,
    name        VARCHAR(200) NOT NULL,
    email       VARCHAR(200) NOT NULL,
    role        user_role NOT NULL,
    office_id   UUID NOT NULL,
    is_active   BOOLEAN NOT NULL,
    synced_at   TIMESTAMPTZ NOT NULL
) SERVER identity_server OPTIONS (schema_name 'public', table_name 'users');

CREATE SERVER audit_server
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host 'postgres-audit-log', port '5432', dbname 'ems_audit_log');

CREATE USER MAPPING FOR ems_user
    SERVER audit_server
    OPTIONS (user 'ems_user', password 'ems_pass');

CREATE FOREIGN TABLE transaction_status_history (
    id                  UUID NOT NULL DEFAULT uuid_generate_v4(),
    transaction_id      UUID NOT NULL,
    old_status          transaction_status,
    new_status          transaction_status NOT NULL,
    documentary_old     documentary_status,
    documentary_new     documentary_status,
    changed_by          UUID NOT NULL,
    changed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    remarks             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action_type         VARCHAR(50) NOT NULL DEFAULT 'STATUS_CHANGE',
    old_value           TEXT,
    new_value           TEXT
) SERVER audit_server OPTIONS (schema_name 'public', table_name 'transaction_status_history');

CREATE TABLE services (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(500) NOT NULL,
    category            VARCHAR(100) NOT NULL,
    client_type         VARCHAR(100),
    office_id           UUID NOT NULL,
    sla_target_seconds  INTEGER NOT NULL CHECK (sla_target_seconds > 0),
    sla_display         VARCHAR(100),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    is_na               BOOLEAN NOT NULL DEFAULT FALSE,
    pss_service_code     VARCHAR(100),
    last_synced_from_pss TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transactions (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id                  UUID NOT NULL REFERENCES services(id),
    office_id                   UUID NOT NULL,
    assigned_to                 UUID,
    created_by                  UUID NOT NULL,
    time_in                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    time_out                    TIMESTAMPTZ,
    status                      transaction_status NOT NULL DEFAULT 'pending',
    documentary_status          documentary_status NOT NULL DEFAULT 'complete',
    processing_time_seconds     INTEGER,
    sla_target_seconds          INTEGER NOT NULL,
    sla_status                  sla_status NOT NULL DEFAULT 'pending_computation',
    is_sla_breached             BOOLEAN NOT NULL DEFAULT FALSE,
    client_name                 VARCHAR(300) NOT NULL,
    client_type                 VARCHAR(100),
    student_number              VARCHAR(100),
    course                      VARCHAR(100),
    year_level                  VARCHAR(50),
    contact_number              VARCHAR(50),
    organization                VARCHAR(200),
    remarks                     TEXT,
    service_specific_data       JSONB,
    intake_data                 JSONB,
    is_locked                   BOOLEAN NOT NULL DEFAULT FALSE,
    is_overridden               BOOLEAN NOT NULL DEFAULT FALSE,
    override_reason             TEXT,
    override_document_name      VARCHAR(500),
    original_time_in            TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT no_modify_completed CHECK (
        status != 'completed' OR (status = 'completed' AND time_out IS NOT NULL)
    )
);

CREATE TABLE pss_sync_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type       VARCHAR(50) NOT NULL,
    office_code     office_code,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    records_synced  INTEGER DEFAULT 0,
    error_message   TEXT,
    synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pss_intake_schema_cache (
    service_id      UUID PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
    schema_json     JSONB NOT NULL,
    schema_version  VARCHAR(50),
    cached_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX idx_services_office ON services(office_id);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_transactions_office ON transactions(office_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_sla_status ON transactions(sla_status);
CREATE INDEX idx_transactions_breach ON transactions(is_sla_breached) WHERE is_sla_breached = TRUE;
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_assigned ON transactions(assigned_to);
CREATE INDEX idx_pss_sync_type ON pss_sync_log(sync_type, synced_at DESC);
CREATE INDEX idx_transactions_office_created ON transactions (office_id, created_at DESC);

-- Functions
CREATE OR REPLACE FUNCTION fn_compute_processing_time(p_transaction_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_time_in       TIMESTAMPTZ;
    v_time_out      TIMESTAMPTZ;
    v_total_ms      BIGINT;
    v_paused_ms     BIGINT := 0;
    v_rec           RECORD;
    v_pause_start   TIMESTAMPTZ := NULL;
BEGIN
    SELECT time_in, time_out INTO v_time_in, v_time_out
    FROM transactions
    WHERE id = p_transaction_id;

    IF v_time_out IS NULL THEN
        RETURN NULL;
    END IF;

    v_total_ms := EXTRACT(EPOCH FROM (v_time_out - v_time_in)) * 1000;

    FOR v_rec IN
        SELECT changed_at, documentary_new, documentary_old
        FROM transaction_status_history
        WHERE transaction_id = p_transaction_id
        ORDER BY changed_at ASC
    LOOP
        IF v_rec.documentary_new = 'incomplete' THEN
            v_pause_start := v_rec.changed_at;
        ELSIF v_pause_start IS NOT NULL AND v_rec.documentary_old = 'incomplete' THEN
            v_paused_ms := v_paused_ms +
                EXTRACT(EPOCH FROM (v_rec.changed_at - v_pause_start)) * 1000;
            v_pause_start := NULL;
        END IF;
    END LOOP;

    IF v_pause_start IS NOT NULL THEN
        v_paused_ms := v_paused_ms +
            EXTRACT(EPOCH FROM (v_time_out - v_pause_start)) * 1000;
    END IF;

    RETURN GREATEST(0, ((v_total_ms - v_paused_ms) / 1000)::INTEGER);
END;
$$;

CREATE OR REPLACE FUNCTION fn_classify_sla(p_transaction_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_processing_secs   INTEGER;
    v_sla_target_secs   INTEGER;
    v_sla_status        sla_status;
    v_is_breached       BOOLEAN;
BEGIN
    SELECT sla_target_seconds INTO v_sla_target_secs
    FROM transactions WHERE id = p_transaction_id;

    v_processing_secs := fn_compute_processing_time(p_transaction_id);

    IF v_processing_secs IS NULL THEN
        v_sla_status := 'pending_computation';
        v_is_breached := FALSE;
    ELSIF v_processing_secs <= v_sla_target_secs THEN
        v_sla_status := 'compliant';
        v_is_breached := FALSE;
    ELSE
        v_sla_status := 'non_compliant';
        v_is_breached := TRUE;
    END IF;

    UPDATE transactions
    SET
        processing_time_seconds = v_processing_secs,
        sla_status = v_sla_status,
        is_sla_breached = v_is_breached,
        updated_at = NOW()
    WHERE id = p_transaction_id;
END;
$$;

CREATE OR REPLACE FUNCTION fn_pss_sync_services(
    p_office_id     UUID,
    p_services_json JSONB
) RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
    v_service JSONB;
    v_count   INTEGER := 0;
BEGIN
    FOR v_service IN SELECT * FROM jsonb_array_elements(p_services_json)
    LOOP
        INSERT INTO services (
            name, category, client_type, office_id,
            sla_target_seconds, sla_display, is_na,
            pss_service_code, last_synced_from_pss
        ) VALUES (
            v_service->>'name',
            v_service->>'category',
            v_service->>'client_type',
            p_office_id,
            (v_service->>'sla_target_seconds')::INTEGER,
            v_service->>'sla_display',
            COALESCE((v_service->>'is_na')::BOOLEAN, FALSE),
            v_service->>'pss_service_code',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name                 = EXCLUDED.name,
            sla_target_seconds   = EXCLUDED.sla_target_seconds,
            sla_display          = EXCLUDED.sla_display,
            is_na                = EXCLUDED.is_na,
            last_synced_from_pss = NOW();
        v_count := v_count + 1;
    END LOOP;

    INSERT INTO pss_sync_log (sync_type, office_code, status, records_synced)
    SELECT 'services',
           (SELECT code FROM offices WHERE id = p_office_id),
           'success',
           v_count;

    RETURN v_count;
END;
$$;

-- Triggers
CREATE OR REPLACE FUNCTION trg_fn_auto_time_in()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.time_in := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_time_in
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_auto_time_in();

CREATE OR REPLACE FUNCTION trg_fn_auto_time_out_and_sla()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.time_out := NOW();
        NEW.updated_at := NOW();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_time_out
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION trg_fn_auto_time_out_and_sla();

CREATE OR REPLACE FUNCTION trg_fn_classify_sla_after_complete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        PERFORM fn_classify_sla(NEW.id);
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_classify_sla
    AFTER UPDATE ON transactions
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION trg_fn_classify_sla_after_complete();

CREATE OR REPLACE FUNCTION fn_prevent_locked_transaction_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.is_locked = FALSE AND NEW.is_locked = TRUE THEN
    RETURN NEW;
  END IF;

  IF OLD.is_locked = TRUE THEN
    IF NEW.status = OLD.status
    AND NEW.documentary_status = OLD.documentary_status
    AND NEW.assigned_to IS NOT DISTINCT FROM OLD.assigned_to
    AND NEW.client_name = OLD.client_name
    AND NEW.remarks IS NOT DISTINCT FROM OLD.remarks
    AND NEW.service_id = OLD.service_id
    AND NEW.office_id = OLD.office_id
    AND NEW.created_by = OLD.created_by
    THEN
      RETURN NEW;
    ELSE
      RAISE EXCEPTION
        'Transaction % is locked (completed) and cannot be modified. (EMS-025)',
        OLD.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_locked_mutation
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION fn_prevent_locked_transaction_mutation();

CREATE OR REPLACE FUNCTION fn_auto_lock_on_completion()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    NEW.is_locked := TRUE;
    IF NEW.time_out IS NULL THEN
      NEW.time_out := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_lock_on_completion
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION fn_auto_lock_on_completion();

CREATE OR REPLACE FUNCTION fn_prevent_na_service_transaction()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_is_na BOOLEAN;
BEGIN
  SELECT is_na INTO v_is_na
  FROM services WHERE id = NEW.service_id;

  IF v_is_na IS TRUE THEN
    RAISE EXCEPTION
      'Service % is marked N/A and cannot be used for new transactions. (EMS-004)',
      NEW.service_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_na_service
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION fn_prevent_na_service_transaction();

CREATE OR REPLACE FUNCTION trg_fn_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_updated_at();

CREATE OR REPLACE FUNCTION trg_fn_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_changed_by UUID;
BEGIN
    v_changed_by := current_setting('ems.acting_user_id', true)::UUID;

    IF (OLD.status IS DISTINCT FROM NEW.status)
    OR (OLD.documentary_status IS DISTINCT FROM NEW.documentary_status)
    THEN
        INSERT INTO transaction_status_history (
            transaction_id, old_status, new_status,
            documentary_old, documentary_new,
            changed_by, changed_at, remarks
        ) VALUES (
            NEW.id, OLD.status, NEW.status,
            OLD.documentary_status, NEW.documentary_status,
            v_changed_by, NOW(),
            current_setting('ems.action_remarks', true)
        );
    END IF;

    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_status_history
    AFTER UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_status_history();

CREATE OR REPLACE FUNCTION trg_fn_history_on_create()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_created_by UUID;
BEGIN
    v_created_by := current_setting('ems.acting_user_id', true)::UUID;

    INSERT INTO transaction_status_history (
        transaction_id, old_status, new_status,
        documentary_old, documentary_new,
        changed_by, changed_at, remarks
    ) VALUES (
        NEW.id, NULL, 'pending',
        NULL, NEW.documentary_status,
        v_created_by, NOW(),
        'Transaction created'
    );
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_history_on_create
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_history_on_create();

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY transactions_office_isolation ON transactions
    USING (
        office_id = current_setting('ems.current_office_id', true)::UUID
        OR current_setting('ems.current_role', true) = 'opcr_evaluator'
    );

-- Seed services
-- Administrative Office Services
INSERT INTO services (name, category, client_type, office_id, sla_target_seconds, sla_display) VALUES
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
('Emergency Medical Consultation — WITH REFERRAL (F&A)',   'Medical', 'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',   840, '14 min'),
('Emergency Medical Consultation — WITHOUT REFERRAL (F&A)','Medical', 'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',   600, '10 min'),
('Non-Emergency Medical Consultation New Patient (F&A)',   'Medical', 'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',  1200, '20 min'),
('Non-Emergency Medical Consultation Follow-up (F&A)',     'Medical', 'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',  1620, '27 min'),
('Annual Medical Clearance — WITH REFERRAL',               'Medical', 'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',   660, '11 min'),
('Annual Medical Clearance — WITHOUT REFERRAL',            'Medical', 'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',   720, '12 min'),
('Emergency Dental Consultation — WITH REFERRAL (F&A)',    'Dental',  'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',   780, '13 min'),
('Emergency Dental Consultation — WITHOUT REFERRAL (F&A)', 'Dental',  'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',   540, '9 min'),
('Non-Emergency Dental Consultation New Patient (F&A)',    'Dental',  'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',  1080, '18 min'),
('Non-Emergency Dental Consultation Follow-up (F&A)',      'Dental',  'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',  1200, '20 min'),
('Dental Clearance — WITH REFERRAL (F&A)',                 'Dental',  'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',   660, '11 min'),
('Dental Clearance — WITHOUT REFERRAL (F&A)',              'Dental',  'Faculty & Admin',     '00000000-0000-0000-0000-000000000001',   540, '9 min'),
('Emergency Dental Consultation — WITH REFERRAL',          'Dental',  'Student',             '00000000-0000-0000-0000-000000000001',   960, '16 min'),
('Emergency Dental Consultation — WITHOUT REFERRAL',       'Dental',  'Student',             '00000000-0000-0000-0000-000000000001',   780, '13 min'),
('Non-Emergency Dental Consultation (New Patient)',         'Dental',  'Student',             '00000000-0000-0000-0000-000000000001',  1860, '31 min'),
('Non-Emergency Dental Consultation (Follow-up)',           'Dental',  'Student',             '00000000-0000-0000-0000-000000000001',  1680, '28 min'),
('Dental Clearance — WITH REFERRAL',                       'Dental',  'Student',             '00000000-0000-0000-0000-000000000001',   660, '11 min'),
('Dental Clearance — WITHOUT REFERRAL',                    'Dental',  'Student',             '00000000-0000-0000-0000-000000000001',   540, '9 min'),
('Campus Equipment / Materials Borrowing',                  'Administrative','General',       '00000000-0000-0000-0000-000000000001',   900, '15 min'),
('Facility Reservation Request',                           'Administrative','General',       '00000000-0000-0000-0000-000000000001',   720, '12 min'),
('Permission to Conduct an Activity (Activity Permit)',     'Administrative','General',       '00000000-0000-0000-0000-000000000001',   420, '7 min'),
('Library Circulation (Borrowing of Library Materials)',    'Administrative','General',       '00000000-0000-0000-0000-000000000001',   120, '2 min'),
('Academic Verification Service',                          'Administrative','General',       '00000000-0000-0000-0000-000000000001',178200,'2 days, 1 hr, 50 min'),
('Re-Admission Processing (Returning Students)',            'Administrative','Student',       '00000000-0000-0000-0000-000000000001',252780,'2 days, 7 hrs, 53 min');

-- Academic Office Services
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

-- OSAS Services
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
('Processing of Request for Correction of Name (OSAS)',    'Grade & Records','Student',       '00000000-0000-0000-0000-000000000003',552060,'6 days, 7 hrs, 1 min');
