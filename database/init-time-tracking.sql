CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgres_fdw";

CREATE TYPE office_code AS ENUM ('ADMIN_OFFICE', 'ACADEMIC_OFFICE', 'OSAS');
CREATE TYPE user_role AS ENUM ('subsystem_admin', 'staff', 'opcr_evaluator');
CREATE TYPE transaction_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE documentary_status AS ENUM ('complete', 'incomplete', 'for_compliance');
CREATE TYPE sla_status AS ENUM ('compliant', 'non_compliant', 'pending_computation');

-- Define server for postgres-identity database container
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

-- Define server for postgres-transaction database container
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
