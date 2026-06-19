-- ============================================================
-- EMS DATABASE SCHEMA — Sprint 1 & 2
-- PostgreSQL 15+
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUM Types ───────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('subsystem_admin', 'staff', 'opcr_evaluator');
CREATE TYPE office_code AS ENUM ('ADMIN_OFFICE', 'ACADEMIC_OFFICE', 'OSAS');
CREATE TYPE transaction_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE documentary_status AS ENUM ('complete', 'incomplete', 'for_compliance');
CREATE TYPE sla_status AS ENUM ('compliant', 'non_compliant', 'pending_computation');

-- ─── Offices ─────────────────────────────────────────────────

CREATE TABLE offices (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(150) NOT NULL,
    code        office_code NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



-- ─── Users (EMS-001, 002, 003) ───────────────────────────────
-- Synced read-only from ARMS. EMS never creates/edits users.

CREATE TABLE users (
    id          UUID PRIMARY KEY,  -- same ID as ARMS user ID (from JWT sub)
    name        VARCHAR(200) NOT NULL,
    email       VARCHAR(200) NOT NULL UNIQUE,
    role        user_role NOT NULL,
    office_id   UUID NOT NULL REFERENCES offices(id),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    synced_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_office ON users(office_id);
CREATE INDEX idx_users_role ON users(role);

-- ─── Service Catalogue (from OPCR Citizen Charter) ───────────

CREATE TABLE services (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(500) NOT NULL,
    category            VARCHAR(100) NOT NULL,
    client_type         VARCHAR(100),
    office_id           UUID NOT NULL REFERENCES offices(id),
    sla_target_seconds  INTEGER NOT NULL CHECK (sla_target_seconds > 0),
    sla_display         VARCHAR(100),  -- human-readable e.g. "22 min"
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_office ON services(office_id);
CREATE INDEX idx_services_active ON services(is_active);

-- ─── Service Transactions ────────────────────────────────────

CREATE TABLE transactions (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id                  UUID NOT NULL REFERENCES services(id),
    office_id                   UUID NOT NULL REFERENCES offices(id),
    assigned_to                 UUID REFERENCES users(id),
    created_by                  UUID NOT NULL REFERENCES users(id),

    -- EMS-004: auto time-in on creation (set by trigger)
    time_in                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- EMS-008: auto time-out on completion (set by trigger)
    time_out                    TIMESTAMPTZ,

    -- EMS-006: status flow
    status                      transaction_status NOT NULL DEFAULT 'pending',
    -- EMS-007: documentary status
    documentary_status          documentary_status NOT NULL DEFAULT 'complete',

    -- EMS-009: computed after completion
    processing_time_seconds     INTEGER,
    -- EMS-010: SLA target (snapshot from services at creation time)
    sla_target_seconds          INTEGER NOT NULL,
    -- EMS-011: auto-classified, not manually editable
    sla_status                  sla_status NOT NULL DEFAULT 'pending_computation',
    -- EMS-012: flag
    is_sla_breached             BOOLEAN NOT NULL DEFAULT FALSE,

    client_name                 VARCHAR(300) NOT NULL,
    remarks                     TEXT,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- EMS-025: completed transactions are read-only (enforced in app + RLS)
    CONSTRAINT no_modify_completed CHECK (
        status != 'completed' OR (status = 'completed' AND time_out IS NOT NULL)
    )
);

CREATE INDEX idx_transactions_office ON transactions(office_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_sla_status ON transactions(sla_status);
CREATE INDEX idx_transactions_breach ON transactions(is_sla_breached) WHERE is_sla_breached = TRUE;
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_assigned ON transactions(assigned_to);

-- ─── Transaction Status History (Audit Trail) ────────────────
-- EMS-015, EMS-024, EMS-025, EMS-026

CREATE TABLE transaction_status_history (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id      UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    old_status          transaction_status,          -- NULL on first creation
    new_status          transaction_status NOT NULL,
    documentary_old     documentary_status,
    documentary_new     documentary_status,
    changed_by          UUID NOT NULL REFERENCES users(id),
    changed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    remarks             TEXT,
    -- Immutable: no UPDATE/DELETE on history rows
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_txn_history_transaction ON transaction_status_history(transaction_id);
CREATE INDEX idx_txn_history_changed_at ON transaction_status_history(changed_at DESC);

-- ─── PSS SLA Computation Queue (EMS-028A, 028B) ──────────────
-- Tracks transactions submitted to PSS for async SLA computation

CREATE TABLE pss_computation_queue (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id  UUID NOT NULL REFERENCES transactions(id),
    time_in         TIMESTAMPTZ NOT NULL,
    time_out        TIMESTAMPTZ NOT NULL,
    duration_secs   INTEGER NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'queued',  -- queued | submitted | received | failed
    attempts        INTEGER NOT NULL DEFAULT 0,
    pss_result      VARCHAR(20),  -- compliant | non_compliant
    last_attempt_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pss_queue_status ON pss_computation_queue(status);
CREATE INDEX idx_pss_queue_transaction ON pss_computation_queue(transaction_id);

-- ─── Row-Level Security (prevent cross-office access) ────────
-- EMS-002, EMS-003

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_status_history ENABLE ROW LEVEL SECURITY;

-- NestJS service uses a role with set_config to pass claims:
-- set_config('ems.current_office_id', $1, true)
-- set_config('ems.current_role', $1, true)

CREATE POLICY transactions_office_isolation ON transactions
    USING (
        office_id = current_setting('ems.current_office_id', true)::UUID
        OR current_setting('ems.current_role', true) = 'opcr_evaluator'
    );

CREATE POLICY txn_history_office_isolation ON transaction_status_history
    USING (
        transaction_id IN (
            SELECT id FROM transactions
            WHERE office_id = current_setting('ems.current_office_id', true)::UUID
               OR current_setting('ems.current_role', true) = 'opcr_evaluator'
        )
    );
