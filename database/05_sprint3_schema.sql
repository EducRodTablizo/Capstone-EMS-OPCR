-- =============================================================================
-- EMS Sprint 3 — Schema Migrations
-- Stories : EMS-004, EMS-015, EMS-024, EMS-025
-- Run after : 04_seed.sql
-- =============================================================================

-- ─── EMS-024: Audit action classification ────────────────────────────────────
-- Add an enum for the five recognised action types.

DO $$ BEGIN
  CREATE TYPE action_type AS ENUM (
    'CREATE',
    'STATUS_CHANGE',
    'ASSIGNMENT',
    'DOCUMENTARY_CHANGE',
    'REMARKS_UPDATE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add action_type + old/new value columns to transaction_status_history.
ALTER TABLE transaction_status_history
  ADD COLUMN IF NOT EXISTS action_type     action_type   NOT NULL DEFAULT 'STATUS_CHANGE',
  ADD COLUMN IF NOT EXISTS old_value       TEXT,
  ADD COLUMN IF NOT EXISTS new_value       TEXT;

-- Back-fill existing rows based on old_status being NULL (creation rows).
UPDATE transaction_status_history
SET
  action_type = 'CREATE',
  old_value   = NULL,
  new_value   = new_status::text
WHERE old_status IS NULL AND action_type = 'STATUS_CHANGE';

-- Back-fill remaining rows.
UPDATE transaction_status_history
SET
  old_value = old_status::text,
  new_value = new_status::text
WHERE action_type = 'STATUS_CHANGE';

-- ─── EMS-025: Transaction lock ────────────────────────────────────────────────
-- Completed transactions must become read-only at the DB level.

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE;

-- Back-fill: any already-completed row is locked.
UPDATE transactions
SET is_locked = TRUE
WHERE status = 'completed' AND is_locked = FALSE;

-- ─── EMS-004: N/A service flag ────────────────────────────────────────────────
-- Services that are "Not Applicable" (e.g. placeholder / retired entries from
-- the OPCR catalogue) should be hidden from the transaction intake form.

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS is_na BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── Indexes ─────────────────────────────────────────────────────────────────
-- Composite index to support the EMS-026 Audit Log queries.
CREATE INDEX IF NOT EXISTS idx_tsh_transaction_action
  ON transaction_status_history (transaction_id, action_type, changed_at DESC);

-- Office-scoped audit log viewer.
CREATE INDEX IF NOT EXISTS idx_transactions_office_created
  ON transactions (office_id, created_at DESC);

COMMENT ON COLUMN transaction_status_history.action_type
  IS 'Classifies the write operation: CREATE | STATUS_CHANGE | ASSIGNMENT | DOCUMENTARY_CHANGE | REMARKS_UPDATE (EMS-024)';
COMMENT ON COLUMN transaction_status_history.old_value
  IS 'Human-readable previous value for the changed field (EMS-024)';
COMMENT ON COLUMN transaction_status_history.new_value
  IS 'Human-readable new value for the changed field (EMS-024)';
COMMENT ON COLUMN transactions.is_locked
  IS 'Set TRUE atomically when status → completed. Blocks all further mutations (EMS-025)';
COMMENT ON COLUMN services.is_na
  IS 'When TRUE, service is hidden from the intake form service selector (EMS-004)';

-- ─── Manual Time-In Override columns ─────────────────────────────────────────
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS is_overridden BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS override_reason TEXT,
  ADD COLUMN IF NOT EXISTS override_document_name VARCHAR(500),
  ADD COLUMN IF NOT EXISTS original_time_in TIMESTAMPTZ;

COMMENT ON COLUMN transactions.is_overridden IS 'True if the time_in of the transaction has been manually overridden';
COMMENT ON COLUMN transactions.override_reason IS 'The administrative justification reason for overriding the time_in';
COMMENT ON COLUMN transactions.override_document_name IS 'The filename of the supporting document uploaded to validate the override';
COMMENT ON COLUMN transactions.original_time_in IS 'The original automatically-recorded time_in of the transaction';
