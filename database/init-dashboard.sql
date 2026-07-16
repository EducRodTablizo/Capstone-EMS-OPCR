CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgres_fdw";

CREATE TYPE office_code AS ENUM ('ADMIN_OFFICE', 'ACADEMIC_OFFICE', 'OSAS');
CREATE TYPE user_role AS ENUM ('subsystem_admin', 'staff', 'opcr_evaluator');
CREATE TYPE transaction_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE documentary_status AS ENUM ('complete', 'incomplete', 'for_compliance');
CREATE TYPE sla_status AS ENUM ('compliant', 'non_compliant', 'pending_computation');

-- Foreign server: postgres-transaction container
CREATE SERVER transaction_server
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host 'postgres-transaction', port '5432', dbname 'ems_transaction');

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

-- Foreign server: postgres-identity container
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

-- Foreign server: postgres-audit-log container
CREATE SERVER audit_server
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host 'postgres-audit-log', port '5432', dbname 'ems_audit_log');

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

-- Analytical functions
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
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE t.status = 'pending')::BIGINT,
        COUNT(*) FILTER (WHERE t.status = 'in_progress')::BIGINT,
        COUNT(*) FILTER (WHERE t.status = 'completed')::BIGINT,
        COUNT(*) FILTER (WHERE t.sla_status = 'compliant')::BIGINT,
        COUNT(*) FILTER (WHERE t.sla_status = 'non_compliant')::BIGINT,
        COUNT(*) FILTER (WHERE t.sla_status = 'pending_computation')::BIGINT,
        COUNT(*) FILTER (WHERE t.is_sla_breached = TRUE)::BIGINT,
        CASE
            WHEN COUNT(*) FILTER (WHERE t.status = 'completed') = 0 THEN 0
            ELSE ROUND(
                100.0 * COUNT(*) FILTER (WHERE t.sla_status = 'compliant') /
                NULLIF(COUNT(*) FILTER (WHERE t.status = 'completed'), 0), 2
            )
        END::NUMERIC
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
        )::NUMERIC,
        COALESCE(
            ROUND(AVG(t.processing_time_seconds) FILTER (WHERE t.status = 'completed'), 2),
            0
        )::NUMERIC
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
