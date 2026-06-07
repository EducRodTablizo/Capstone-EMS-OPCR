-- =============================================================================
-- EMS Sprint 3 — Triggers & Rules
-- Stories : EMS-024, EMS-025
-- Run after : 05_sprint3_schema.sql
-- =============================================================================

-- ─── EMS-025: Lock trigger ────────────────────────────────────────────────────
-- Prevents any UPDATE on a transaction once is_locked = TRUE, except for the
-- system setting is_locked itself (the initial lock action).

CREATE OR REPLACE FUNCTION fn_prevent_locked_transaction_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Allow the lock action itself (status → completed sets is_locked = TRUE)
  IF OLD.is_locked = FALSE AND NEW.is_locked = TRUE THEN
    RETURN NEW;
  END IF;

  -- Block any mutation on an already-locked row
  IF OLD.is_locked = TRUE THEN
    RAISE EXCEPTION
      'Transaction % is locked (completed) and cannot be modified. (EMS-025)',
      OLD.id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_locked_mutation ON transactions;
CREATE TRIGGER trg_prevent_locked_mutation
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION fn_prevent_locked_transaction_mutation();

-- ─── EMS-025: Auto-lock on completion ────────────────────────────────────────
-- When a transaction's status transitions to 'completed', atomically set
-- is_locked = TRUE and record time_out if not already set.

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

DROP TRIGGER IF EXISTS trg_auto_lock_on_completion ON transactions;
CREATE TRIGGER trg_auto_lock_on_completion
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION fn_auto_lock_on_completion();

-- ─── EMS-024: Append-only audit log ──────────────────────────────────────────
-- transaction_status_history is an audit table; DELETE and UPDATE must be
-- blocked at the database level to guarantee immutability.

CREATE OR REPLACE FUNCTION fn_deny_audit_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION
    'Audit log entries are immutable. DELETE/UPDATE on transaction_status_history is forbidden. (EMS-024)'
    USING ERRCODE = 'restrict_violation';
END;
$$;

-- Block UPDATE
DROP TRIGGER IF EXISTS trg_deny_audit_update ON transaction_status_history;
CREATE TRIGGER trg_deny_audit_update
  BEFORE UPDATE ON transaction_status_history
  FOR EACH ROW
  EXECUTE FUNCTION fn_deny_audit_mutation();

-- Block DELETE
DROP TRIGGER IF EXISTS trg_deny_audit_delete ON transaction_status_history;
CREATE TRIGGER trg_deny_audit_delete
  BEFORE DELETE ON transaction_status_history
  FOR EACH ROW
  EXECUTE FUNCTION fn_deny_audit_mutation();

-- ─── EMS-024: action_type auto-classification ────────────────────────────────
-- Derive action_type from the row being inserted when not supplied explicitly.

CREATE OR REPLACE FUNCTION fn_classify_audit_action()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- If the caller already supplied an explicit action_type, trust it.
  IF NEW.action_type IS NOT NULL AND NEW.action_type <> 'STATUS_CHANGE' THEN
    RETURN NEW;
  END IF;

  -- Auto-classify
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

DROP TRIGGER IF EXISTS trg_classify_audit_action ON transaction_status_history;
CREATE TRIGGER trg_classify_audit_action
  BEFORE INSERT ON transaction_status_history
  FOR EACH ROW
  EXECUTE FUNCTION fn_classify_audit_action();

-- ─── EMS-004: N/A service guard ───────────────────────────────────────────────
-- Prevent transactions from being created against is_na services.

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

DROP TRIGGER IF EXISTS trg_prevent_na_service ON transactions;
CREATE TRIGGER trg_prevent_na_service
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION fn_prevent_na_service_transaction();
