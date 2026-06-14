# EMS NestJS Microservices Architecture Plan
## Capstone — Production-Grade Backend Migration (Final)

---

## 1. Context

The EMS is a React + Vite frontend backed by an in-memory mock API (`src/api/mockApi.ts`).
Database schema, RLS, triggers, and functions are fully designed in `database/`.
This plan creates a real NestJS monorepo backend that replaces the mock layer — without breaking the frontend or existing migrations.

**Final architecture decisions:**
- ✅ 5 NestJS services + 1 API Gateway
- ✅ HTTP REST between services (not TCP, not Kafka day-1)
- ✅ Single shared PostgreSQL — all existing RLS/triggers/functions reused
- ✅ Docker Compose for capstone demo
- ✅ ARMS owns auth — EMS only validates JWT & syncs user context
- ✅ Audit Log Service owns local history + ARMS dispatch (not Transaction Service)
- ✅ Kafka deferred to Phase 4 (after HTTP services verified)

---

## 2. Final Service Boundaries

### Why NOT fully remove User Management
ARMS owns: Login, JWT, Password Reset, Registration, Identity.
EMS still needs: office assignments, staff lists, evaluator lookup, RLS context, user sync.
**Solution: rename, don't remove. Scope it correctly.**

```
Old name                          New name
──────────────────────────────────────────────────────
User Management Service       →   Identity & Office Service
Service Transaction + PSS     →   Transaction & PSS Service
Time Tracking & SLA           →   Time Tracking & SLA Service   (unchanged)
Transaction History +
  Performance Monitoring      →   Audit Log Service              (merged)
Dashboard & Reporting         →   Dashboard & Reporting Service  (absorbs performance)
API Gateway                   →   API Gateway                    (unchanged)
```

**Performance Monitoring is merged into Dashboard & Reporting** — both consume the same DB
functions (`fn_get_office_stats`, `fn_get_sla_compliance_by_service`) and serve the same
React pages (Dashboard, SLA Review). No reason to run them as separate services.

---

## 3. Six Components — Responsibilities

### 1 — API Gateway (port 3001)
- Single entry point for all React frontend HTTP calls
- Validates ARMS-issued JWT (signature + expiry)
- Extracts claims → injects `x-user-id`, `x-office-id`, `x-user-role` headers
- Proxies every request to the correct downstream service
- Rate limiting, CORS, request logging
- `GET /api/auth/me` — returns decoded JWT as `User` (no DB call)
- **No login endpoint. No password endpoint.**

### 2 — Identity & Office Service (port 3002)
- Receives JWT → upserts user via `fn_sync_user()` on first touch
- `GET /users?officeId=` — staff list for assignment dropdowns
- `GET /users/:id` — user profile
- `GET /offices` — office list
- Provides RLS context: `SET LOCAL ems.current_office_id / ems.current_role / ems.acting_user_id`
- Optionally calls ARMS `GET /api/users/:id` for profile enrichment
- **No login. No password. No registration.**

### 3 — Transaction & PSS Service (port 3003)
- Full transaction CRUD (create, assign, update status, update documentary status)
- Service catalog management (`GET /services?officeId=`)
- PSS sync: `POST /pss/sync` fetches live PSS service catalog → upserts `services` table
- PSS offline fallback: serves from cached `services` table, writes to `pss_sync_log`
- PSS intake schema cache: `pss_intake_schema_cache` table
- After each transaction mutation → HTTP POST to Audit Log Service (audit trail write)
- **Does NOT dispatch directly to ARMS — delegates to Audit Log Service**

### 4 — Time Tracking & SLA Service (port 3004)
- Consumes `POST /sla/compute` request (triggered by Transaction Service after completion)
- Calls `fn_classify_sla()` for local SLA computation
- Manages `pss_computation_queue`: queued → submitted → received | failed
- Receives PSS webhook callback at `POST /sla/result`
- Serves `pss_calendar_cache` (fallback: `src/utils/workingCalendar.ts` values)
- **Retry logic** with exponential backoff for failed PSS submissions

### 5 — Audit Log Service (port 3006)
- Receives HTTP POST from Transaction Service after every mutation
- Writes to `transaction_status_history` (append-only, never editable)
- `GET /transactions/:id/history` — audit timeline
- `GET /audit-log?officeId=&actionType=&from=&to=` — filtered audit log viewer
- Dispatches copy to ARMS: `POST {ARMS_BASE_URL}/api/audit/ingest` (fire-and-forget)
- Writes to `arms_audit_dispatch_log` (pending → sent | failed)
- Retry cron: picks up failed rows every 60s (NestJS `@Cron`)
- **If ARMS is down → EMS still works. Retry until ARMS is back.**

### 6 — Dashboard & Reporting Service (port 3007)
- `GET /dashboard/stats` → calls `fn_get_office_stats()`
- `GET /performance/by-service` → calls `fn_get_sla_compliance_by_service()`
- `GET /performance/trend` → time-series SLA data by week/month
- `GET /dashboard/pss-status` → PSS connectivity + last sync time from `pss_sync_log`
- `GET /dashboard/arms-health` → ARMS dispatch health from `arms_audit_dispatch_log`
- Phase 3+ : PDF/CSV report generation

---

## 4. Audit Flow — Transaction → Audit Log → ARMS

```
React Frontend
    │  POST /api/transactions
    ↓
API Gateway :3001
    │  JWT validated, headers injected
    ↓
Transaction & PSS Service :3003
    │  1. Write transaction to PostgreSQL
    │  2. HTTP POST /audit/record → Audit Log Service :3006
    │     {transactionId, actionType, actorId, oldValue, newValue, ...}
    ↓
Audit Log Service :3006
    │  1. INSERT into transaction_status_history  ← immutable, append-only
    │  2. INSERT into arms_audit_dispatch_log     ← status = 'pending'
    │  3. HTTP POST {ARMS_URL}/api/audit/ingest   ← fire-and-forget
    │     → on success: update row status = 'sent'
    │     → on failure: update row status = 'failed', retry cron picks up
    ↓
ARMS (external)
    │  Receives audit event, stores centralized log
```

**Why this is better than Transaction Service → ARMS directly:**
- EMS keeps its own immutable audit history regardless of ARMS availability
- ARMS downtime does not block transaction operations
- Retry mechanism is isolated in one service
- `arms_audit_dispatch_log` gives full visibility into dispatch health

---

## 5. Monorepo Structure

```
EMS_PROJECT/                              ← /workspace/thread
├── src/                                  ← existing React app (UNCHANGED)
│   └── api/
│       ├── mockApi.ts                    ← keep (dev only)
│       ├── realApi.ts                    ← NEW: real HTTP via apiClient
│       └── index.ts                      ← NEW: toggle mock vs real
├── apps/
│   ├── api-gateway/                      port 3001
│   ├── identity-office-service/          port 3002  (was: user-management-service)
│   ├── transaction-pss-service/          port 3003  (was: service-transaction-service)
│   ├── time-tracking-sla-service/        port 3004
│   ├── audit-log-service/               port 3006
│   └── dashboard-reporting-service/     port 3007  (absorbs performance-monitoring)
├── packages/
│   ├── dto/                              shared DTOs
│   └── types/                            shared TypeScript interfaces
├── database/
│   ├── 01_schema.sql … 06_sprint3_triggers.sql   ← DO NOT TOUCH
│   └── 07_contract_schema.sql                    ← NEW
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json                          workspaces root
```

> `packages/kafka/` deferred to Phase 4.
> `performance-monitoring-service/` removed — merged into `dashboard-reporting-service/`.

---

## 6. Service Ownership Matrix

| Table | Owning Service | Read-Access Services |
|---|---|---|
| `offices` | identity-office-service | all |
| `users` | identity-office-service | transaction-pss, audit-log |
| `services` | transaction-pss-service | dashboard, audit-log |
| `transactions` | transaction-pss-service | audit-log, dashboard |
| `transaction_status_history` | audit-log-service | dashboard |
| `pss_computation_queue` | time-tracking-sla-service | dashboard |
| `pss_sync_log` | transaction-pss-service | dashboard |
| `pss_intake_schema_cache` | transaction-pss-service | — |
| `pss_calendar_cache` | time-tracking-sla-service | transaction-pss |
| `arms_audit_dispatch_log` | audit-log-service | dashboard |

---

## 7. API Endpoint Mapping

| `mockApi.ts` Function | Method | API GW Route | Target Service |
|---|---|---|---|
| `loginApi` (mock-only) | — | — | ARMS (not EMS) |
| `getUsersApi` | GET | `/api/users` | identity-office-service |
| `getServicesApi` | GET | `/api/services` | transaction-pss-service |
| `getTransactionsApi` | GET | `/api/transactions` | transaction-pss-service |
| `getTransactionApi` | GET | `/api/transactions/:id` | transaction-pss-service |
| `createTransactionApi` | POST | `/api/transactions` | transaction-pss-service |
| `assignTransactionApi` | PATCH | `/api/transactions/:id/assignment` | transaction-pss-service |
| `updateTransactionStatusApi` | PATCH | `/api/transactions/:id/status` | transaction-pss-service |
| `updateDocumentaryStatusApi` | PATCH | `/api/transactions/:id/documentary-status` | transaction-pss-service |
| `getTransactionHistoryApi` | GET | `/api/transactions/:id/history` | audit-log-service |
| `getAuditLogApi` | GET | `/api/audit-log` | audit-log-service |
| `getDashboardStatsApi` | GET | `/api/dashboard/stats` | dashboard-reporting-service |
| *(new)* | GET | `/api/auth/me` | api-gateway (JWT decode only) |
| *(new)* | GET | `/api/offices` | identity-office-service |
| *(new)* | POST | `/api/pss/sync` | transaction-pss-service |
| *(new)* | GET | `/api/pss/status` | transaction-pss-service |
| *(new — PSS callback)* | POST | `/api/sla/result` | time-tracking-sla-service |
| *(new)* | GET | `/api/performance/by-service` | dashboard-reporting-service |
| *(new)* | GET | `/api/dashboard/pss-status` | dashboard-reporting-service |
| *(new — internal only)* | POST | `/audit/record` | audit-log-service ← transaction-pss only |

---

## 8. Database Migration — `database/07_contract_schema.sql` (NEW)

Only new migration needed. Existing `01–06` files are never touched.

```sql
-- =============================================================================
-- EMS Contract Schema — PSS / ARMS Integration Tables
-- Run after: 06_sprint3_triggers.sql
-- =============================================================================

-- ─── PSS Sync Log ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pss_sync_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type       VARCHAR(50) NOT NULL,  -- 'services' | 'calendar' | 'intake_schema'
    office_code     office_code,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | success | failed
    records_synced  INTEGER DEFAULT 0,
    error_message   TEXT,
    synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pss_sync_type ON pss_sync_log(sync_type, synced_at DESC);

-- ─── PSS Intake Schema Cache ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pss_intake_schema_cache (
    service_id      UUID PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
    schema_json     JSONB NOT NULL,
    schema_version  VARCHAR(50),
    cached_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ GENERATED ALWAYS AS (cached_at + INTERVAL '24 hours') STORED
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

-- Seed with values from src/utils/workingCalendar.ts (2026 PH calendar)
INSERT INTO pss_calendar_cache (calendar_year, holidays, working_hours) VALUES (
  2026,
  '["2026-01-01","2026-02-25","2026-04-02","2026-04-03","2026-04-04",
    "2026-04-09","2026-05-01","2026-06-12","2026-08-21","2026-08-31",
    "2026-10-31","2026-11-01","2026-11-02","2026-11-30","2026-12-08",
    "2026-12-24","2026-12-25","2026-12-30","2026-12-31"]'::JSONB,
  '{"start":"08:00","end":"17:00","timezone":"Asia/Manila","days":[1,2,3,4,5]}'::JSONB
) ON CONFLICT (calendar_year) DO NOTHING;

-- ─── ARMS Audit Dispatch Log ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS arms_audit_dispatch_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id  UUID NOT NULL REFERENCES transactions(id),
    action_type     action_type NOT NULL,
    actor_id        UUID NOT NULL REFERENCES users(id),
    payload         JSONB NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | sent | failed
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

-- ─── Extend pss_computation_queue: PSS response + ARMS forward ───────────────
ALTER TABLE pss_computation_queue
  ADD COLUMN IF NOT EXISTS arms_dispatched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pss_response_json  JSONB;

-- ─── fn_pss_sync_services ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_pss_sync_services(
    p_office_id     UUID,
    p_services_json JSONB
) RETURNS INTEGER LANGUAGE plpgsql AS $$
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
           'success', v_count;

    RETURN v_count;
END;
$$;
```

---

## 9. External Integration Contracts (PSS & ARMS)

### ARMS JWT Claims (EMS validates, never issues)
```typescript
{ sub, name, email, role, office_id, office_code, office_name, iat, exp }
```

### ARMS Audit Ingest (EMS → ARMS, via Audit Log Service)
```
POST {ARMS_BASE_URL}/api/audit/ingest
Authorization: Bearer {EMS_SERVICE_TOKEN}

{ source, transaction_id, action_type, actor_id, actor_name,
  office_id, old_value, new_value, timestamp, metadata }
→ 202 Accepted
```

### PSS Service Catalog (PSS → EMS cache)
```
GET {PSS_BASE_URL}/api/services?officeCode=ACADEMIC_OFFICE
→ [{ name, category, client_type, sla_target_seconds, sla_display, is_na, pss_service_code }]
```

### PSS SLA Computation (EMS → PSS)
```
POST {PSS_BASE_URL}/api/sla/compute
{ transaction_id, service_id, office_code, time_in, time_out, duration_seconds, sla_target_seconds }
→ { transaction_id, sla_status, is_breached, computed_at }
```

### PSS Webhook Callback (PSS → EMS)
```
POST {EMS_BASE_URL}/api/sla/result
{ transaction_id, sla_status, is_breached, computed_at }
→ 200 OK
```

---

## 10. Phased Implementation

### Phase 1 — Core HTTP (3 services)
**Goal:** All Sprint 3 functionality working against real PostgreSQL.

Services started: `api-gateway` + `identity-office-service` + `transaction-pss-service`

- ARMS JWT validated by api-gateway
- `fn_sync_user()` called on first authenticated request (identity-office-service)
- All transaction CRUD endpoints live in transaction-pss-service
- PSS offline → serve from `services` table, log to `pss_sync_log`
- Frontend: `realApi.ts` + `index.ts` toggle, update all page imports

### Phase 2 — Audit & SLA (2 services)
**Goal:** Audit trail + ARMS dispatch live. SLA queue working.

Services started: `audit-log-service` + `time-tracking-sla-service`

- transaction-pss-service calls `POST /audit/record` → audit-log-service after every mutation
- audit-log-service writes `transaction_status_history` + dispatches to ARMS
- `arms_audit_dispatch_log` populated; retry cron active
- `POST /api/sla/result` webhook receives PSS callback
- `pss_computation_queue` management active

### Phase 3 — Dashboard & Reporting (1 service)
**Goal:** Real DB-backed dashboard, SLA review, PSS/ARMS health.

Services started: `dashboard-reporting-service`

- `fn_get_office_stats()` powers dashboard
- `fn_get_sla_compliance_by_service()` powers SLA review page
- PSS sync status + ARMS dispatch health surfaced

### Phase 4 — Kafka
**Goal:** Replace direct HTTP audit dispatch with async event bus.

- `packages/kafka/` created
- transaction-pss-service emits `ems.transaction.*` topics
- audit-log-service becomes Kafka consumer (no longer receiving HTTP from transaction-pss)
- docker-compose adds `zookeeper` + `kafka`
- ARMS optionally consumes Kafka topic instead of HTTP webhook

---

## 11. Files to Create

### Phase 1 — Root
- `pnpm-workspace.yaml`
- `package.json` (workspaces root)
- `docker-compose.yml`
- `database/07_contract_schema.sql`

### Phase 1 — `packages/types/`
- `src/index.ts` (mirrors `src/types/index.ts`)
- `package.json`, `tsconfig.json`

### Phase 1 — `packages/dto/`
- `src/transaction.dto.ts`, `src/user.dto.ts`, `src/auth.dto.ts`
- `src/dashboard.dto.ts`, `src/audit.dto.ts`, `src/pss.dto.ts`
- `package.json`, `tsconfig.json`

### Phase 1 — `apps/api-gateway/`
- `src/main.ts`, `src/app.module.ts`
- `src/auth/jwt.strategy.ts`, `jwt.guard.ts`, `auth.controller.ts`, `auth.module.ts`
- `src/proxy/proxy.module.ts`
- `src/proxy/users.proxy.controller.ts`
- `src/proxy/transactions.proxy.controller.ts`
- `src/proxy/audit.proxy.controller.ts`
- `src/proxy/dashboard.proxy.controller.ts`
- `src/proxy/pss.proxy.controller.ts`
- `src/proxy/sla.proxy.controller.ts`
- `src/common/rls-headers.interceptor.ts`
- `package.json`, `tsconfig.json`, `.env.example`

### Phase 1 — `apps/identity-office-service/`
- `src/main.ts`, `src/app.module.ts`
- `src/database/database.module.ts` — PG pool + `setRlsContext()` helper
- `src/users/users.module.ts`, `users.controller.ts`, `users.service.ts`, `users.repository.ts`
- `src/users/arms-sync.service.ts` — calls `fn_sync_user()`, optionally enriches from ARMS
- `src/offices/offices.module.ts`, `offices.controller.ts`, `offices.service.ts`
- `package.json`, `tsconfig.json`, `.env.example`

### Phase 1 — `apps/transaction-pss-service/`
- `src/main.ts`, `src/app.module.ts`
- `src/database/database.module.ts`
- `src/services/services.module.ts`, `services.controller.ts`, `services.service.ts`, `services.repository.ts`
- `src/services/pss-sync.service.ts` — fetches + caches PSS catalog
- `src/services/pss-status.controller.ts` — `GET /pss/status`, `POST /pss/sync`
- `src/transactions/transactions.module.ts`, `transactions.controller.ts`
- `src/transactions/transactions.service.ts` — ports all logic from `mockApi.ts`
- `src/transactions/transactions.repository.ts` — raw SQL + RLS context
- `src/transactions/audit-dispatch.service.ts` — HTTP POST to audit-log-service
- `package.json`, `tsconfig.json`, `.env.example`

### Phase 1 — Frontend
- `src/api/realApi.ts` — 12+ functions using `apiClient`
- `src/api/index.ts` — toggle via `window.__EMS_USE_REAL_API__`
- Update `src/auth/AuthContext.tsx` — import from `@/api` not `@/api/mockApi`
- Update all 6 pages/components that import from `@/api/mockApi`

### Phase 2 — `apps/audit-log-service/`
- `src/main.ts`, `src/app.module.ts`, `src/database/database.module.ts`
- `src/audit/audit.module.ts`, `audit.controller.ts`, `audit.service.ts`, `audit.repository.ts`
- `src/audit/arms-dispatch.service.ts` — HTTP POST to ARMS `/api/audit/ingest`
- `src/audit/arms-dispatch.repository.ts` — writes `arms_audit_dispatch_log`
- `src/audit/arms-dispatch-retry.cron.ts` — retries failed rows every 60s (`@Cron`)
- `package.json`, `tsconfig.json`, `.env.example`

### Phase 2 — `apps/time-tracking-sla-service/`
- `src/main.ts`, `src/app.module.ts`, `src/database/database.module.ts`
- `src/sla/sla.module.ts`, `sla.controller.ts`, `sla.service.ts`, `sla.repository.ts`
- `src/sla/pss-callback.controller.ts` — `POST /sla/result` PSS webhook
- `src/pss/pss.client.ts` — HTTP client for PSS `/api/sla/compute`
- `src/calendar/calendar.service.ts` — serves `pss_calendar_cache` with `workingCalendar.ts` fallback
- `package.json`, `tsconfig.json`, `.env.example`

### Phase 3 — `apps/dashboard-reporting-service/`
- `src/main.ts`, `src/app.module.ts`, `src/database/database.module.ts`
- `src/dashboard/dashboard.module.ts`, `dashboard.controller.ts`, `dashboard.service.ts`, `dashboard.repository.ts`
- `src/performance/performance.controller.ts` — `GET /performance/by-service`, `GET /performance/trend`
- `src/performance/performance.service.ts` — calls `fn_get_sla_compliance_by_service()`
- `src/health/pss-status.service.ts` — reads `pss_sync_log`
- `src/health/arms-health.service.ts` — reads `arms_audit_dispatch_log`
- `package.json`, `tsconfig.json`, `.env.example`

### Phase 4 — `packages/kafka/`
- `src/events.ts`, `src/kafka.module.ts`, `src/kafka.service.ts`
- `package.json`, `tsconfig.json`

---

## 12. Docker Compose

### Phase 1 (minimal)
```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ems_db
      POSTGRES_USER: ems_user
      POSTGRES_PASSWORD: ems_pass
    ports: ["5432:5432"]
    volumes: ["./database:/docker-entrypoint-initdb.d"]

  api-gateway:
    build: ./apps/api-gateway
    ports: ["3001:3001"]
    depends_on: [postgres]

  identity-office-service:
    build: ./apps/identity-office-service
    ports: ["3002:3002"]
    depends_on: [postgres]

  transaction-pss-service:
    build: ./apps/transaction-pss-service
    ports: ["3003:3003"]
    depends_on: [postgres, identity-office-service]

  audit-log-service:
    build: ./apps/audit-log-service
    ports: ["3006:3006"]
    depends_on: [postgres]

  time-tracking-sla-service:
    build: ./apps/time-tracking-sla-service
    ports: ["3004:3004"]
    depends_on: [postgres]

  dashboard-reporting-service:
    build: ./apps/dashboard-reporting-service
    ports: ["3007:3007"]
    depends_on: [postgres]
```

### Phase 4 additions
```yaml
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    environment: { ZOOKEEPER_CLIENT_PORT: 2181 }

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    ports: ["9092:9092"]
    depends_on: [zookeeper]
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
```

---

## 13. Environment Variables

| Variable | Service | Value |
|---|---|---|
| `ARMS_JWT_SECRET` | api-gateway | shared with ARMS |
| `USER_SVC_URL` | api-gateway | `http://identity-office-service:3002` |
| `TRANSACTION_SVC_URL` | api-gateway | `http://transaction-pss-service:3003` |
| `AUDIT_SVC_URL` | api-gateway | `http://audit-log-service:3006` |
| `TIME_SVC_URL` | api-gateway | `http://time-tracking-sla-service:3004` |
| `DASHBOARD_SVC_URL` | api-gateway | `http://dashboard-reporting-service:3007` |
| `DATABASE_URL` | all services | `postgresql://ems_user:ems_pass@postgres:5432/ems_db` |
| `PSS_BASE_URL` | transaction-pss, time-tracking | `http://pss.pup.edu.ph/api` |
| `PSS_API_KEY` | transaction-pss, time-tracking | PSS-issued API key |
| `ARMS_BASE_URL` | audit-log, identity | `http://arms.pup.edu.ph/api` |
| `ARMS_SERVICE_TOKEN` | audit-log | EMS service token for ARMS |
| `AUDIT_SVC_URL` | transaction-pss | `http://audit-log-service:3006` |

---

## 14. Key Existing Code Reused

| Existing File | Reused In |
|---|---|
| `database/01–06_*.sql` | Reference only — no recreation |
| `fn_classify_sla()` | time-tracking-sla-service |
| `fn_get_office_stats()` | dashboard-reporting-service |
| `fn_get_sla_compliance_by_service()` | dashboard-reporting-service (performance tab) |
| `fn_sync_user()` | identity-office-service |
| `fn_pss_sync_services()` | transaction-pss-service ← defined in 07_contract_schema.sql |
| `src/api/client.ts` | `realApi.ts` reuses same axios instance |
| `src/types/index.ts` | Copied to `packages/types/src/index.ts` |
| `src/utils/workingCalendar.ts` | Seeded into `pss_calendar_cache` as fallback |
| `src/utils/slaUtils.ts` | Mirrored in time-tracking-sla-service |
| `dispatchToARMS()` stub | Replaced by `arms-dispatch.service.ts` in audit-log-service |

---

## 15. Capstone Adviser Scorecard (Final)

| Area | Verdict |
|---|---|
| Service boundaries (5 + gateway) | ✅ Excellent |
| User Mgmt renamed → Identity & Office | ✅ Correct |
| ARMS = auth only, EMS = context only | ✅ Correct |
| Audit Log Service owns dispatch to ARMS | ✅ Correct |
| Transaction Service → Audit Service → ARMS | ✅ Correct |
| Performance merged into Dashboard | ✅ Simpler, justified |
| Docker Compose (phases 1+4) | ✅ Excellent |
| Shared PostgreSQL + RLS | ✅ Excellent |
| HTTP REST service-to-service | ✅ Correct |
| Kafka deferred to Phase 4 | ✅ Risk-controlled |
| New migration only adds tables/columns | ✅ Non-destructive |
| `arms_audit_dispatch_log` retry pattern | ✅ Production-grade |

---

## 16. Verification Checklist

### Phase 1
- [ ] `docker-compose up` starts postgres + 3 services
- [ ] `GET /api/auth/me` with ARMS JWT returns `User` object (no DB call)
- [ ] `GET /api/transactions` returns office-scoped list from real DB
- [ ] `POST /api/transactions` creates DB row; `fn_sync_user()` upserts actor on first request
- [ ] `PATCH /api/transactions/:id/status` → `completed` sets `is_locked = true`
- [ ] PSS unreachable → `services` table fallback, `pss_sync_log` row with `status = 'failed'`
- [ ] React with `window.__EMS_USE_REAL_API__ = true` loads all Sprint 3 pages correctly

### Phase 2
- [ ] Every transaction mutation writes to `transaction_status_history` via audit-log-service
- [ ] `arms_audit_dispatch_log` row created with `status = 'pending'` after each history write
- [ ] ARMS HTTP call succeeds → row updated to `status = 'sent'`
- [ ] ARMS down → row stays `failed`; retry cron sends within 60s when ARMS recovers
- [ ] `GET /api/audit-log` returns filtered history with correct action types
- [ ] `POST /api/sla/result` updates `pss_computation_queue` and transaction SLA status

### Phase 3
- [ ] `GET /api/dashboard/stats` returns correct counts from `fn_get_office_stats()`
- [ ] `GET /api/performance/by-service` returns service breakdown
- [ ] Dashboard shows PSS sync status and ARMS dispatch health

### Phase 4
- [ ] `ems.transaction.created` Kafka event produced and consumed by audit-log-service
- [ ] Audit history written from Kafka consumer (not HTTP)
