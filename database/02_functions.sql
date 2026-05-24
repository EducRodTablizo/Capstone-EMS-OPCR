-- ============================================================
-- EMS FUNCTIONS — Sprint 1 & 2
-- ============================================================

-- ─── fn_compute_processing_time ─────────────────────────────
-- EMS-009: total processing time = (time_out - time_in) - paused windows
-- Paused windows = periods when documentary_status was 'incomplete'
-- Uses transaction_status_history to reconstruct pause windows.

CREATE OR REPLACE FUNCTION fn_compute_processing_time(p_transaction_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_time_in       TIMESTAMPTZ;
    v_time_out      TIMESTAMPTZ;
    v_total_ms      BIGINT;
    v_paused_ms     BIGINT := 0;

    -- Cursor over history rows to find incomplete windows
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

    -- Find pause windows (documentary_status transitions to/from 'incomplete')
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

    -- If still paused at time_out, add remaining
    IF v_pause_start IS NOT NULL THEN
        v_paused_ms := v_paused_ms +
            EXTRACT(EPOCH FROM (v_time_out - v_pause_start)) * 1000;
    END IF;

    RETURN GREATEST(0, ((v_total_ms - v_paused_ms) / 1000)::INTEGER);
END;
$$;


-- ─── fn_classify_sla ────────────────────────────────────────
-- EMS-010, EMS-011: compare actual duration vs SLA target.
-- Automated classification, immutable result.

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


-- ─── fn_sync_user ────────────────────────────────────────────
-- EMS-001: Upsert a user record synced from ARMS.
-- Called by NestJS when it receives a JWT with a new/updated user.

CREATE OR REPLACE FUNCTION fn_sync_user(
    p_id        UUID,
    p_name      VARCHAR,
    p_email     VARCHAR,
    p_role      user_role,
    p_office_id UUID
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


-- ─── fn_get_office_stats ─────────────────────────────────────
-- Dashboard stats for a given office (or all if NULL).

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
        COUNT(*)                                                            AS total_transactions,
        COUNT(*) FILTER (WHERE t.status = 'pending')                       AS pending,
        COUNT(*) FILTER (WHERE t.status = 'in_progress')                   AS in_progress,
        COUNT(*) FILTER (WHERE t.status = 'completed')                     AS completed,
        COUNT(*) FILTER (WHERE t.sla_status = 'compliant')                 AS compliant,
        COUNT(*) FILTER (WHERE t.sla_status = 'non_compliant')             AS non_compliant,
        COUNT(*) FILTER (WHERE t.sla_status = 'pending_computation')       AS pending_computation,
        COUNT(*) FILTER (WHERE t.is_sla_breached = TRUE)                   AS sla_breach_count,
        CASE
            WHEN COUNT(*) FILTER (WHERE t.status = 'completed') = 0 THEN 0
            ELSE ROUND(
                100.0 * COUNT(*) FILTER (WHERE t.sla_status = 'compliant') /
                NULLIF(COUNT(*) FILTER (WHERE t.status = 'completed'), 0), 2
            )
        END                                                                 AS compliance_rate
    FROM transactions t
    WHERE p_office_id IS NULL OR t.office_id = p_office_id;
END;
$$;


-- ─── fn_get_sla_compliance_by_service ────────────────────────
-- EMS-017: per-service metrics

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
        COUNT(t.id),
        COUNT(t.id) FILTER (WHERE t.sla_status = 'compliant'),
        COUNT(t.id) FILTER (WHERE t.sla_status = 'non_compliant'),
        ROUND(
            100.0 * COUNT(t.id) FILTER (WHERE t.sla_status = 'compliant') /
            NULLIF(COUNT(t.id) FILTER (WHERE t.status = 'completed'), 0), 2
        ),
        ROUND(AVG(t.processing_time_seconds) FILTER (WHERE t.status = 'completed'), 2)
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
