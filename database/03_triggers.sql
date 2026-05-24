-- ============================================================
-- EMS TRIGGERS — Sprint 1 & 2
-- ============================================================

-- ─── trg_auto_time_in ────────────────────────────────────────
-- EMS-004: Auto-record time_in on transaction creation.
-- Prevents manual override.

CREATE OR REPLACE FUNCTION trg_fn_auto_time_in()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Always override time_in to NOW() — no manual entry allowed
    NEW.time_in := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_time_in
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_auto_time_in();


-- ─── trg_auto_time_out_and_sla ───────────────────────────────
-- EMS-008: Auto-record time_out when status changes to 'completed'.
-- EMS-009, EMS-011: Trigger SLA computation immediately after.

CREATE OR REPLACE FUNCTION trg_fn_auto_time_out_and_sla()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only act when status transitions to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- EMS-008: set time_out to NOW() (no manual override)
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

-- After time_out is set, compute processing time and classify SLA
CREATE OR REPLACE FUNCTION trg_fn_classify_sla_after_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        PERFORM fn_classify_sla(NEW.id);
    END IF;
    RETURN NULL; -- AFTER trigger, no return value needed
END;
$$;

CREATE TRIGGER trg_classify_sla
    AFTER UPDATE ON transactions
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION trg_fn_classify_sla_after_complete();


-- ─── trg_status_history ──────────────────────────────────────
-- EMS-006: Log every status change to audit trail.
-- EMS-007: Log documentary status changes too.
-- EMS-024: Immutable audit log.

CREATE OR REPLACE FUNCTION trg_fn_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_changed_by UUID;
BEGIN
    -- NestJS sets ems.acting_user_id before each mutation
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

-- Also log initial creation
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


-- ─── trg_completed_read_only ─────────────────────────────────
-- EMS-025: Completed transactions must be read-only.
-- Blocks UPDATE on completed transactions except for SLA fields set by trigger.

CREATE OR REPLACE FUNCTION trg_fn_completed_read_only()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Allow only SLA computation fields to be updated on completed transactions
    -- (processing_time_seconds, sla_status, is_sla_breached set by fn_classify_sla)
    IF OLD.status = 'completed' THEN
        -- Only allow sla-related updates from the internal function
        IF NEW.status != OLD.status
        OR NEW.documentary_status != OLD.documentary_status
        OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to
        OR NEW.client_name != OLD.client_name
        OR NEW.remarks IS DISTINCT FROM OLD.remarks
        THEN
            RAISE EXCEPTION 'Transaction % is completed and read-only (EMS-025)', OLD.id
                USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_completed_read_only
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    WHEN (OLD.status = 'completed')
    EXECUTE FUNCTION trg_fn_completed_read_only();


-- ─── trg_updated_at ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_fn_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_updated_at();


-- ─── trg_no_delete_history ───────────────────────────────────
-- EMS-024: Prevent deletion of audit history

CREATE OR REPLACE FUNCTION trg_fn_no_delete_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Audit history records are immutable and cannot be deleted (EMS-024)'
        USING ERRCODE = '23514';
END;
$$;

CREATE TRIGGER trg_no_delete_history
    BEFORE DELETE ON transaction_status_history
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_no_delete_history();

CREATE OR REPLACE RULE no_update_history AS
    ON UPDATE TO transaction_status_history
    DO INSTEAD NOTHING;
