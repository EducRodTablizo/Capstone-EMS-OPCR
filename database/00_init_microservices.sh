#!/bin/bash
set -e

echo "Creating microservice databases..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE ems_identity;
    CREATE DATABASE ems_transaction;
    CREATE DATABASE ems_time_tracking;
    CREATE DATABASE ems_audit_log;
    CREATE DATABASE ems_dashboard;
EOSQL

echo "Setting up ems_identity database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "ems_identity" <<-'EOSQL'
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TYPE user_role AS ENUM ('subsystem_admin', 'staff', 'opcr_evaluator');
    CREATE TYPE office_code AS ENUM ('ADMIN_OFFICE', 'ACADEMIC_OFFICE', 'OSAS');

    CREATE TABLE offices (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name        VARCHAR(150) NOT NULL,
        code        office_code NOT NULL UNIQUE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE users (
        id          UUID PRIMARY KEY,
        name        VARCHAR(200) NOT NULL,
        email       VARCHAR(200) NOT NULL UNIQUE,
        role        user_role NOT NULL,
        office_id   UUID NOT NULL REFERENCES offices(id),
        is_active   BOOLEAN NOT NULL DEFAULT TRUE,
        synced_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_users_office ON users(office_id);
    CREATE INDEX idx_users_role ON users(role);

    CREATE OR REPLACE FUNCTION fn_sync_user(
        p_id        UUID,
        p_name      VARCHAR,
        p_email     VARCHAR,
        p_role      user_role,
        p_office_id UUID,
        p_office_code office_code DEFAULT NULL
    ) RETURNS VOID
    LANGUAGE plpgsql
    AS $$
    BEGIN
        INSERT INTO users (id, name, email, role, office_id, synced_at)
        VALUES (p_id, p_name, p_email, p_role, p_office_id, NOW())
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            role = EXCLUDED.role,
            office_id = EXCLUDED.office_id,
            is_active = TRUE,
            synced_at = NOW();
    END;
    $$;

    -- Seed offices
    INSERT INTO offices (id, name, code) VALUES
        ('00000000-0000-0000-0000-000000000001', 'Administrative Office',                   'ADMIN_OFFICE'),
        ('00000000-0000-0000-0000-000000000002', 'Academic Office',                         'ACADEMIC_OFFICE'),
        ('00000000-0000-0000-0000-000000000003', 'Office of Student Affairs and Services',  'OSAS')
    ON CONFLICT DO NOTHING;

    -- Seed baseline teachers
    INSERT INTO users (id, name, email, role, office_id) VALUES
        ('22000000-0000-0000-0000-000000000001', 'Prof. Juan Dela Cruz', 'jdelacruz_teacher@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000001'),
        ('22000000-0000-0000-0000-000000000002', 'Prof. Maria Clara', 'mclara_teacher@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000001'),
        ('22000000-0000-0000-0000-000000000003', 'Prof. Crisostomo Ibarra', 'cibarra_teacher@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000001'),
        ('22000000-0000-0000-0000-000000000004', 'Prof. Juan Dela Cruz (Acad)', 'jdelacruz_teacher_acad@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000002'),
        ('22000000-0000-0000-0000-000000000005', 'Prof. Maria Clara (Acad)', 'mclara_teacher_acad@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000002'),
        ('22000000-0000-0000-0000-000000000006', 'Prof. Crisostomo Ibarra (Acad)', 'cibarra_teacher_acad@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000002'),
        ('22000000-0000-0000-0000-000000000007', 'Prof. Juan Dela Cruz (OSAS)', 'jdelacruz_teacher_osas@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000003'),
        ('22000000-0000-0000-0000-000000000008', 'Prof. Maria Clara (OSAS)', 'mclara_teacher_osas@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000003'),
        ('22000000-0000-0000-0000-000000000009', 'Prof. Crisostomo Ibarra (OSAS)', 'cibarra_teacher_osas@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000003')
    ON CONFLICT DO NOTHING;
EOSQL

echo "Setting up ems_audit_log database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "ems_audit_log" <<-'EOSQL'
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "postgres_fdw";

    CREATE TYPE office_code AS ENUM ('ADMIN_OFFICE', 'ACADEMIC_OFFICE', 'OSAS');
    CREATE TYPE user_role AS ENUM ('subsystem_admin', 'staff', 'opcr_evaluator');
    CREATE TYPE transaction_status AS ENUM ('pending', 'in_progress', 'completed');
    CREATE TYPE documentary_status AS ENUM ('complete', 'incomplete', 'for_compliance');
    CREATE TYPE sla_status AS ENUM ('compliant', 'non_compliant', 'pending_computation');

    CREATE TYPE action_type AS ENUM (
        'CREATE',
        'STATUS_CHANGE',
        'ASSIGNMENT',
        'DOCUMENTARY_CHANGE',
        'REMARKS_UPDATE'
    );

    -- Foreign Server mapping to ems_identity
    CREATE SERVER identity_server
        FOREIGN DATA WRAPPER postgres_fdw
        OPTIONS (host '127.0.0.1', port '5432', dbname 'ems_identity');

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

    -- Foreign Server mapping to ems_transaction
    CREATE SERVER transaction_server
        FOREIGN DATA WRAPPER postgres_fdw
        OPTIONS (host '127.0.0.1', port '5432', dbname 'ems_transaction');

    CREATE USER MAPPING FOR ems_user
        SERVER transaction_server
        OPTIONS (user 'ems_user', password 'ems_pass');

    CREATE FOREIGN TABLE transactions (
        id                          UUID NOT NULL,
        service_id                  UUID NOT NULL,
        office_id                   UUID NOT NULL,
        assigned_to                 UUID,
        created_by                  UUID NOT NULL,
        time_in                     TIMESTAMPTZ NOT NULL,
        time_out                    TIMESTAMPTZ,
        status                      transaction_status NOT NULL,
        documentary_status          documentary_status NOT NULL,
        processing_time_seconds     INTEGER,
        sla_target_seconds          INTEGER NOT NULL,
        sla_status                  sla_status NOT NULL,
        is_sla_breached             BOOLEAN NOT NULL,
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
        is_locked                   BOOLEAN NOT NULL,
        is_overridden               BOOLEAN NOT NULL,
        override_reason             TEXT,
        override_document_name      VARCHAR(500),
        original_time_in            TIMESTAMPTZ,
        created_at                  TIMESTAMPTZ NOT NULL,
        updated_at                  TIMESTAMPTZ NOT NULL
    ) SERVER transaction_server OPTIONS (schema_name 'public', table_name 'transactions');

    CREATE FOREIGN TABLE services (
        id                  UUID NOT NULL,
        name                VARCHAR(500) NOT NULL,
        category            VARCHAR(100) NOT NULL,
        client_type         VARCHAR(100),
        office_id           UUID NOT NULL,
        sla_target_seconds  INTEGER NOT NULL,
        sla_display         VARCHAR(100),
        is_active           BOOLEAN NOT NULL,
        is_na               BOOLEAN NOT NULL,
        pss_service_code     VARCHAR(100),
        last_synced_from_pss TIMESTAMPTZ,
        created_at          TIMESTAMPTZ NOT NULL
    ) SERVER transaction_server OPTIONS (schema_name 'public', table_name 'services');

    -- Physical tables
    CREATE TABLE transaction_status_history (
        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        transaction_id      UUID NOT NULL,
        old_status          transaction_status,
        new_status          transaction_status NOT NULL,
        documentary_old     documentary_status,
        documentary_new     documentary_status,
        changed_by          UUID NOT NULL,
        changed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        remarks             TEXT,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        action_type         action_type NOT NULL DEFAULT 'STATUS_CHANGE',
        old_value           TEXT,
        new_value           TEXT
    );

    CREATE TABLE arms_audit_dispatch_log (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        transaction_id  UUID NOT NULL,
        action_type     action_type NOT NULL,
        actor_id        UUID NOT NULL,
        payload         JSONB NOT NULL,
        status          VARCHAR(20) NOT NULL DEFAULT 'pending',
        attempts        INTEGER NOT NULL DEFAULT 0,
        last_attempt_at TIMESTAMPTZ,
        sent_at         TIMESTAMPTZ,
        error_message   TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_txn_history_transaction ON transaction_status_history(transaction_id);
    CREATE INDEX idx_txn_history_changed_at ON transaction_status_history(changed_at DESC);
    CREATE INDEX idx_tsh_transaction_action ON transaction_status_history (transaction_id, action_type, changed_at DESC);
    CREATE INDEX idx_arms_dispatch_status ON arms_audit_dispatch_log(status, created_at);
    CREATE INDEX idx_arms_dispatch_txn ON arms_audit_dispatch_log(transaction_id);

    -- Trigger to classify and enforce audit logs
    CREATE OR REPLACE FUNCTION fn_deny_audit_mutation()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    BEGIN
      RAISE EXCEPTION
        'Audit log entries are immutable. DELETE/UPDATE on transaction_status_history is forbidden. (EMS-024)'
        USING ERRCODE = 'restrict_violation';
    END;
    $$;

    CREATE TRIGGER trg_deny_audit_update
      BEFORE UPDATE ON transaction_status_history
      FOR EACH ROW
      EXECUTE FUNCTION fn_deny_audit_mutation();

    CREATE TRIGGER trg_deny_audit_delete
      BEFORE DELETE ON transaction_status_history
      FOR EACH ROW
      EXECUTE FUNCTION fn_deny_audit_mutation();

    CREATE OR REPLACE FUNCTION fn_classify_audit_action()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    BEGIN
      IF NEW.action_type IS NOT NULL AND NEW.action_type <> 'STATUS_CHANGE' THEN
        RETURN NEW;
      END IF;

      IF NEW.old_status IS NULL THEN
        NEW.action_type := 'CREATE';
      ELSIF NEW.old_status <> NEW.new_status THEN
        NEW.action_type := 'STATUS_CHANGE';
      ELSIF NEW.documentary_old IS DISTINCT FROM NEW.documentary_new THEN
        NEW.action_type := 'DOCUMENTARY_CHANGE';
      ELSE
        NEW.action_type := 'REMARKS_UPDATE';
      END IF;

      RETURN NEW;
    END;
    $$;

    CREATE TRIGGER trg_classify_audit_action
      BEFORE INSERT ON transaction_status_history
      FOR EACH ROW
      EXECUTE FUNCTION fn_classify_audit_action();
EOSQL

echo "Setting up ems_transaction database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "ems_transaction" <<-'EOSQL'
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "postgres_fdw";

    CREATE TYPE office_code AS ENUM ('ADMIN_OFFICE', 'ACADEMIC_OFFICE', 'OSAS');
    CREATE TYPE user_role AS ENUM ('subsystem_admin', 'staff', 'opcr_evaluator');
    CREATE TYPE transaction_status AS ENUM ('pending', 'in_progress', 'completed');
    CREATE TYPE documentary_status AS ENUM ('complete', 'incomplete', 'for_compliance');
    CREATE TYPE sla_status AS ENUM ('compliant', 'non_compliant', 'pending_computation');

    CREATE SERVER identity_server
        FOREIGN DATA WRAPPER postgres_fdw
        OPTIONS (host '127.0.0.1', port '5432', dbname 'ems_identity');

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
        OPTIONS (host '127.0.0.1', port '5432', dbname 'ems_audit_log');

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
EOSQL

echo "Setting up ems_time_tracking database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "ems_time_tracking" <<-'EOSQL'
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "postgres_fdw";

    CREATE TYPE office_code AS ENUM ('ADMIN_OFFICE', 'ACADEMIC_OFFICE', 'OSAS');
    CREATE TYPE user_role AS ENUM ('subsystem_admin', 'staff', 'opcr_evaluator');
    CREATE TYPE transaction_status AS ENUM ('pending', 'in_progress', 'completed');
    CREATE TYPE documentary_status AS ENUM ('complete', 'incomplete', 'for_compliance');
    CREATE TYPE sla_status AS ENUM ('compliant', 'non_compliant', 'pending_computation');

    -- Define server for ems_identity database
    CREATE SERVER identity_server
        FOREIGN DATA WRAPPER postgres_fdw
        OPTIONS (host '127.0.0.1', port '5432', dbname 'ems_identity');

    CREATE USER MAPPING FOR ems_user
        SERVER identity_server
        OPTIONS (user 'ems_user', password 'ems_pass');

    CREATE FOREIGN TABLE offices (
        id          UUID NOT NULL,
        name        VARCHAR(150) NOT NULL,
        code        office_code NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL
    ) SERVER identity_server OPTIONS (schema_name 'public', table_name 'offices');

    -- Define server for ems_transaction database
    CREATE SERVER transaction_server
        FOREIGN DATA WRAPPER postgres_fdw
        OPTIONS (host '127.0.0.1', port '5432', dbname 'ems_transaction');

    CREATE USER MAPPING FOR ems_user
        SERVER transaction_server
        OPTIONS (user 'ems_user', password 'ems_pass');

    CREATE FOREIGN TABLE transactions (
        id                          UUID NOT NULL,
        service_id                  UUID NOT NULL,
        office_id                   UUID NOT NULL,
        assigned_to                 UUID,
        created_by                  UUID NOT NULL,
        time_in                     TIMESTAMPTZ NOT NULL,
        time_out                    TIMESTAMPTZ,
        status                      transaction_status NOT NULL,
        documentary_status          documentary_status NOT NULL,
        processing_time_seconds     INTEGER,
        sla_target_seconds          INTEGER NOT NULL,
        sla_status                  sla_status NOT NULL,
        is_sla_breached             BOOLEAN NOT NULL,
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
        is_locked                   BOOLEAN NOT NULL,
        is_overridden               BOOLEAN NOT NULL,
        override_reason             TEXT,
        override_document_name      VARCHAR(500),
        original_time_in            TIMESTAMPTZ,
        created_at                  TIMESTAMPTZ NOT NULL,
        updated_at                  TIMESTAMPTZ NOT NULL
    ) SERVER transaction_server OPTIONS (schema_name 'public', table_name 'transactions');

    CREATE FOREIGN TABLE services (
        id                  UUID NOT NULL,
        name                VARCHAR(500) NOT NULL,
        category            VARCHAR(100) NOT NULL,
        client_type         VARCHAR(100),
        office_id           UUID NOT NULL,
        sla_target_seconds  INTEGER NOT NULL,
        sla_display         VARCHAR(100),
        is_active           BOOLEAN NOT NULL,
        is_na               BOOLEAN NOT NULL,
        pss_service_code     VARCHAR(100),
        last_synced_from_pss TIMESTAMPTZ,
        created_at          TIMESTAMPTZ NOT NULL
    ) SERVER transaction_server OPTIONS (schema_name 'public', table_name 'services');

    -- Local tables
    CREATE TABLE pss_calendar_cache (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        calendar_year   INTEGER NOT NULL,
        holidays        JSONB NOT NULL,
        working_hours   JSONB NOT NULL DEFAULT '{"start":"08:00","end":"17:00","timezone":"Asia/Manila","days":[1,2,3,4,5]}',
        cached_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_calendar_year UNIQUE (calendar_year)
    );

    CREATE TABLE pss_computation_queue (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        transaction_id  UUID NOT NULL,
        time_in         TIMESTAMPTZ,
        time_out        TIMESTAMPTZ,
        duration_secs   INTEGER,
        status          VARCHAR(20) NOT NULL DEFAULT 'queued',
        attempts        INTEGER NOT NULL DEFAULT 0,
        pss_result      VARCHAR(20),
        last_attempt_at TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        arms_dispatched_at TIMESTAMPTZ,
        pss_response_json  JSONB,
        local_result    JSONB
    );

    CREATE INDEX idx_pss_queue_status ON pss_computation_queue(status);
    CREATE INDEX idx_pss_queue_transaction ON pss_computation_queue(transaction_id);

    -- Seed 2026 PH calendar
    INSERT INTO pss_calendar_cache (calendar_year, holidays, working_hours) VALUES (
      2026,
      '["2026-01-01","2026-02-25","2026-04-02","2026-04-03","2026-04-04",
        "2026-04-09","2026-05-01","2026-06-12","2026-08-21","2026-08-31",
        "2026-10-31","2026-11-01","2026-11-02","2026-11-30","2026-12-08",
        "2026-12-24","2026-12-25","2026-12-30","2026-12-31"]'::JSONB,
      '{"start":"08:00","end":"17:00","timezone":"Asia/Manila","days":[1,2,3,4,5]}'::JSONB
    ) ON CONFLICT (calendar_year) DO NOTHING;
EOSQL

echo "Setting up ems_dashboard database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "ems_dashboard" <<-'EOSQL'
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "postgres_fdw";

    CREATE TYPE office_code AS ENUM ('ADMIN_OFFICE', 'ACADEMIC_OFFICE', 'OSAS');
    CREATE TYPE user_role AS ENUM ('subsystem_admin', 'staff', 'opcr_evaluator');
    CREATE TYPE transaction_status AS ENUM ('pending', 'in_progress', 'completed');
    CREATE TYPE documentary_status AS ENUM ('complete', 'incomplete', 'for_compliance');
    CREATE TYPE sla_status AS ENUM ('compliant', 'non_compliant', 'pending_computation');

    -- Define server for ems_transaction database
    CREATE SERVER transaction_server
        FOREIGN DATA WRAPPER postgres_fdw
        OPTIONS (host '127.0.0.1', port '5432', dbname 'ems_transaction');

    CREATE USER MAPPING FOR ems_user
        SERVER transaction_server
        OPTIONS (user 'ems_user', password 'ems_pass');

    CREATE FOREIGN TABLE services (
        id                  UUID NOT NULL,
        name                VARCHAR(500) NOT NULL,
        category            VARCHAR(100) NOT NULL,
        client_type         VARCHAR(100),
        office_id           UUID NOT NULL,
        sla_target_seconds  INTEGER NOT NULL,
        sla_display         VARCHAR(100),
        is_active           BOOLEAN NOT NULL,
        is_na               BOOLEAN NOT NULL,
        pss_service_code     VARCHAR(100),
        last_synced_from_pss TIMESTAMPTZ,
        created_at          TIMESTAMPTZ NOT NULL
    ) SERVER transaction_server OPTIONS (schema_name 'public', table_name 'services');

    CREATE FOREIGN TABLE transactions (
        id                          UUID NOT NULL,
        service_id                  UUID NOT NULL,
        office_id                   UUID NOT NULL,
        assigned_to                 UUID,
        created_by                  UUID NOT NULL,
        time_in                     TIMESTAMPTZ NOT NULL,
        time_out                    TIMESTAMPTZ,
        status                      transaction_status NOT NULL,
        documentary_status          documentary_status NOT NULL,
        processing_time_seconds     INTEGER,
        sla_target_seconds          INTEGER NOT NULL,
        sla_status                  sla_status NOT NULL,
        is_sla_breached             BOOLEAN NOT NULL,
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
        is_locked                   BOOLEAN NOT NULL,
        is_overridden               BOOLEAN NOT NULL,
        override_reason             TEXT,
        override_document_name      VARCHAR(500),
        original_time_in            TIMESTAMPTZ,
        created_at                  TIMESTAMPTZ NOT NULL,
        updated_at                  TIMESTAMPTZ NOT NULL
    ) SERVER transaction_server OPTIONS (schema_name 'public', table_name 'transactions');

    CREATE FOREIGN TABLE pss_sync_log (
        id              UUID NOT NULL,
        sync_type       VARCHAR(50) NOT NULL,
        office_code     office_code,
        status          VARCHAR(20) NOT NULL,
        records_synced  INTEGER,
        error_message   TEXT,
        synced_at       TIMESTAMPTZ NOT NULL
    ) SERVER transaction_server OPTIONS (schema_name 'public', table_name 'pss_sync_log');

    -- Define server for ems_identity database
    CREATE SERVER identity_server
        FOREIGN DATA WRAPPER postgres_fdw
        OPTIONS (host '127.0.0.1', port '5432', dbname 'ems_identity');

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

    -- Define server for ems_audit_log database
    CREATE SERVER audit_server
        FOREIGN DATA WRAPPER postgres_fdw
        OPTIONS (host '127.0.0.1', port '5432', dbname 'ems_audit_log');

    CREATE USER MAPPING FOR ems_user
        SERVER audit_server
        OPTIONS (user 'ems_user', password 'ems_pass');

    CREATE FOREIGN TABLE arms_audit_dispatch_log (
        id              UUID NOT NULL,
        transaction_id  UUID NOT NULL,
        action_type     VARCHAR(50) NOT NULL,
        actor_id        UUID NOT NULL,
        payload         JSONB NOT NULL,
        status          VARCHAR(20) NOT NULL,
        attempts        INTEGER NOT NULL,
        last_attempt_at TIMESTAMPTZ,
        sent_at         TIMESTAMPTZ,
        error_message   TEXT,
        created_at      TIMESTAMPTZ NOT NULL
    ) SERVER audit_server OPTIONS (schema_name 'public', table_name 'arms_audit_dispatch_log');

    CREATE OR REPLACE FUNCTION fn_get_office_stats(p_office_id UUID DEFAULT NULL)
    RETURNS TABLE (
        total_transactions  BIGINT,
        pending             BIGINT,
        in_progress         BIGINT,
        completed           BIGINT,
        compliant           BIGINT,
        non_compliant       BIGINT,
        pending_computation BIGINT,
        sla_breach_count    BIGINT,
        compliance_rate     NUMERIC
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
        RETURN QUERY
        SELECT
            COUNT(*)::BIGINT                                                AS total_transactions,
            COUNT(*) FILTER (WHERE t.status = 'pending')::BIGINT            AS pending,
            COUNT(*) FILTER (WHERE t.status = 'in_progress')::BIGINT        AS in_progress,
            COUNT(*) FILTER (WHERE t.status = 'completed')::BIGINT          AS completed,
            COUNT(*) FILTER (WHERE t.sla_status = 'compliant')::BIGINT      AS compliant,
            COUNT(*) FILTER (WHERE t.sla_status = 'non_compliant')::BIGINT  AS non_compliant,
            COUNT(*) FILTER (WHERE t.sla_status = 'pending_computation')::BIGINT AS pending_computation,
            COUNT(*) FILTER (WHERE t.is_sla_breached = TRUE)::BIGINT        AS sla_breach_count,
            CASE
                WHEN COUNT(*) FILTER (WHERE t.status = 'completed') = 0 THEN 0
                ELSE ROUND(
                    100.0 * COUNT(*) FILTER (WHERE t.sla_status = 'compliant') /
                    NULLIF(COUNT(*) FILTER (WHERE t.status = 'completed'), 0), 2
                )
            END::NUMERIC                                                    AS compliance_rate
        FROM transactions t
        WHERE p_office_id IS NULL OR t.office_id = p_office_id;
    END;
    $$;

    CREATE OR REPLACE FUNCTION fn_get_sla_compliance_by_service(
        p_office_id UUID DEFAULT NULL,
        p_from_date DATE DEFAULT NULL,
        p_to_date   DATE DEFAULT NULL
    )
    RETURNS TABLE (
        service_id          UUID,
        service_name        VARCHAR,
        category            VARCHAR,
        total               BIGINT,
        compliant           BIGINT,
        non_compliant       BIGINT,
        compliance_rate     NUMERIC,
        avg_processing_secs NUMERIC
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
        RETURN QUERY
        SELECT
            s.id,
            s.name,
            s.category,
            COUNT(t.id)::BIGINT,
            COUNT(t.id) FILTER (WHERE t.sla_status = 'compliant')::BIGINT,
            COUNT(t.id) FILTER (WHERE t.sla_status = 'non_compliant')::BIGINT,
            COALESCE(
                ROUND(
                    100.0 * COUNT(t.id) FILTER (WHERE t.sla_status = 'compliant') /
                    NULLIF(COUNT(t.id) FILTER (WHERE t.status = 'completed'), 0), 2
                ),
                0
            )::NUMERIC AS compliance_rate,
            COALESCE(
                ROUND(AVG(t.processing_time_seconds) FILTER (WHERE t.status = 'completed'), 2),
                0
            )::NUMERIC AS avg_processing_secs
        FROM services s
        LEFT JOIN transactions t ON t.service_id = s.id
            AND (p_office_id IS NULL OR t.office_id = p_office_id)
            AND (p_from_date IS NULL OR t.created_at::DATE >= p_from_date)
            AND (p_to_date IS NULL OR t.created_at::DATE <= p_to_date)
        WHERE p_office_id IS NULL OR s.office_id = p_office_id
        GROUP BY s.id, s.name, s.category
        ORDER BY compliance_rate ASC NULLS LAST;
    END;
    $$;
EOSQL

echo "All databases initialized and FDW configured successfully!"
