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

-- Foreign Server mapping to postgres-identity container
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

-- Foreign Server mapping to postgres-transaction container
CREATE SERVER transaction_server
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host 'postgres-transaction', port '5432', dbname 'ems_transaction');

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
