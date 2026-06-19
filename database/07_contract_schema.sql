-- =============================================================================
-- EMS Contract Schema — PSS / ARMS Integration Tables
-- Sprint 3+ : Supports PSS cache, ARMS audit dispatch, calendar cache
-- Run after : 06_sprint3_triggers.sql
-- =============================================================================

-- ─── PSS Sync Log ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pss_sync_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type       VARCHAR(50) NOT NULL,
    -- 'services' | 'calendar' | 'intake_schema'
    office_code     office_code,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending | success | failed
    records_synced  INTEGER DEFAULT 0,
    error_message   TEXT,
    synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pss_sync_type
  ON pss_sync_log(sync_type, synced_at DESC);

-- ─── PSS Intake Schema Cache ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pss_intake_schema_cache (
    service_id      UUID PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
    schema_json     JSONB NOT NULL,
    schema_version  VARCHAR(50),
    cached_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

-- ─── PSS Calendar Cache ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pss_calendar_cache (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calendar_year   INTEGER NOT NULL,
    holidays        JSONB NOT NULL,
    working_hours   JSONB NOT NULL
        DEFAULT '{"start":"08:00","end":"17:00","timezone":"Asia/Manila","days":[1,2,3,4,5]}',
    cached_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_calendar_year UNIQUE (calendar_year)
);

-- Seed with 2026 PH calendar (mirrors src/utils/workingCalendar.ts)
INSERT INTO pss_calendar_cache (calendar_year, holidays, working_hours) VALUES (
  2026,
  '["2026-01-01","2026-02-25","2026-04-02","2026-04-03","2026-04-04",
    "2026-04-09","2026-05-01","2026-06-12","2026-08-21","2026-08-31",
    "2026-10-31","2026-11-01","2026-11-02","2026-11-30","2026-12-08",
    "2026-12-24","2026-12-25","2026-12-30","2026-12-31"]'::JSONB,
  '{"start":"08:00","end":"17:00","timezone":"Asia/Manila","days":[1,2,3,4,5]}'::JSONB
) ON CONFLICT (calendar_year) DO NOTHING;

-- ─── ARMS Audit Dispatch Log ──────────────────────────────────────────────────
-- Tracks every audit event dispatched (or pending dispatch) to ARMS.
-- Supports retry logic in audit-log-service.
CREATE TABLE IF NOT EXISTS arms_audit_dispatch_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id  UUID NOT NULL REFERENCES transactions(id),
    action_type     action_type NOT NULL,
    actor_id        UUID NOT NULL REFERENCES users(id),
    payload         JSONB NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending | sent | failed
    attempts        INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    sent_at         TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_arms_dispatch_status
  ON arms_audit_dispatch_log(status, created_at);
CREATE INDEX IF NOT EXISTS idx_arms_dispatch_txn
  ON arms_audit_dispatch_log(transaction_id);

-- ─── Extend services: PSS origin tracking ─────────────────────────────────────
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS pss_service_code     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_synced_from_pss TIMESTAMPTZ;

COMMENT ON COLUMN services.pss_service_code
  IS 'PSS internal service identifier — correlates EMS services with PSS catalog';
COMMENT ON COLUMN services.last_synced_from_pss
  IS 'Timestamp when this service was last synchronized from PSS';

-- ─── Extend pss_computation_queue: PSS response + ARMS forward ───────────────
ALTER TABLE pss_computation_queue
  ADD COLUMN IF NOT EXISTS arms_dispatched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pss_response_json  JSONB;

COMMENT ON COLUMN pss_computation_queue.arms_dispatched_at
  IS 'When SLA result was forwarded to ARMS audit relay';
COMMENT ON COLUMN pss_computation_queue.pss_response_json
  IS 'Raw response payload received from PSS /api/sla/compute';

-- ─── fn_pss_sync_services ─────────────────────────────────────────────────────
-- Called by transaction-pss-service after fetching the PSS service catalog.
-- Upserts services and writes a pss_sync_log entry.
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

-- ─── fn_get_arms_dispatch_health ──────────────────────────────────────────────
-- Used by dashboard-reporting-service to surface ARMS dispatch health.
CREATE OR REPLACE FUNCTION fn_get_arms_dispatch_health()
RETURNS TABLE (
    status        VARCHAR,
    count         BIGINT,
    oldest_pending TIMESTAMPTZ
) LANGUAGE sql STABLE AS $$
    SELECT
        status,
        COUNT(*) AS count,
        MIN(CASE WHEN status IN ('pending','failed') THEN created_at END) AS oldest_pending
    FROM arms_audit_dispatch_log
    WHERE created_at > NOW() - INTERVAL '24 hours'
    GROUP BY status;
$$;
